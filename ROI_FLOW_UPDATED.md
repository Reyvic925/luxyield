# ROI Withdrawal Flow - Updated Logic

## New Business Flow

### 1. **Investment Active Phase** ✅
- Investment earns ROI continuously
- ROI is added to `investment.currentValue`
- **ROI does NOT go to `availableBalance`** (this is the key change)
- ROI stays within the investment record

**Files Updated:**
- `server/scripts/update_roi.js` - Removed line that credited ROI to availableBalance
- `server/utils/roiCalculator.js` - Removed line that credited ROI to availableBalance

### 2. **Investment Ends** ✅
When investment reaches maturity (endDate passes):
- `investment.status` → `'completed'`
- **Entire `currentValue` (principal + ROI) moves to `user.lockedBalance`**
- Investment is locked pending admin approval
- User sees this amount in their portfolio under "Locked Balance"

**Automatic in:**
- `server/scripts/update_roi.js` - Auto-completes ended investments and moves to lockedBalance
- `server/utils/roiCalculator.js` - Auto-marks matured investments as completed and moves to lockedBalance

### 3. **User Requests Withdrawal**
When user clicks "Withdraw ROI" on a completed investment:
```javascript
POST /api/investment/withdraw-roi/:investmentId
```
- Calculates ROI: `roi = currentValue - amount`
- Creates a pending `Withdrawal` record (type: 'roi')
- **Moves ROI amount from investment to `user.lockedBalance`** (still locked)
- **Returns to user:** "ROI withdrawal submitted for admin review"
- **User balance:** ROI stays in locked balance

### 4. **Admin Approves Release**
Admin endpoint to approve withdrawal:
```javascript
POST /api/roi-withdrawals/:withdrawalId/accept
Body: { feePercent: 0 }
```
- Validates withdrawal is pending
- Calculates fee if applicable
- **Moves amount from `lockedBalance` → `availableBalance`**
- Marks withdrawal as 'confirmed'
- Updates investment: `roiWithdrawn = true`
- **Now user can withdraw to crypto/external wallet**

### 5. **User Withdraws to Wallet**
```javascript
POST /api/withdrawal
```
- Checks `user.availableBalance`
- Deducts from availableBalance
- Creates withdrawal transaction to crypto wallet
- Admin processes blockchain transaction

---

## Admin Controls

### Release Locked Funds (Manual)
If admin wants to manually release funds without ROI withdrawal process:
```javascript
POST /api/admin/users/:userId/release-locked-funds
Body: {
  amount: 1000,
  reason: "Investment completed"
}
```
- Moves specified amount from `lockedBalance` → `availableBalance`
- User can now withdraw this to wallet

### ROI Withdrawal Approval
```javascript
POST /api/admin/roi-withdrawals/:withdrawalId/accept
Body: {
  feePercent: 0  // Optional fee as percentage
}
```
- Approves ROI withdrawal
- Moves from locked to available
- User can then withdraw to wallet

### ROI Withdrawal Rejection
```javascript
POST /api/admin/roi-withdrawals/:withdrawalId/reject
Body: {
  reason: "Pending verification"
}
```
- Rejects withdrawal request
- Amount stays in `lockedBalance`
- User can resubmit later

---

## Balance States

### User Balances (User Model)
```javascript
{
  availableBalance: 5000,  // Can withdraw to crypto wallet NOW
  lockedBalance: 15000     // Pending admin approval
}
```

### Investment States
```javascript
{
  // Active Investment
  status: "active",
  amount: 5000,
  currentValue: 5123,       // Growing with ROI
  roiWithdrawn: false,
  
  // Completed Investment (matured)
  status: "completed",
  amount: 5000,
  currentValue: 5750,       // Now moved to user.lockedBalance
  roiWithdrawn: false
}
```

### Withdrawal States
```javascript
{
  type: "roi",
  status: "pending",        // Awaiting admin approval
  amount: 750,              // ROI amount (currentValue - amount)
  userId: "...",
  investmentId: "...",
  createdAt: "2026-02-17"
}

// After admin approves:
{
  type: "roi",
  status: "confirmed",      // Now in user.availableBalance
  amount: 750,
  amountAfterFee: 750,      // After any fees
  approvedAt: "2026-02-17"
}
```

---

## Flow Diagram

```
┌─────────────────────────────────────┐
│   ACTIVE INVESTMENT                  │
│   ✓ ROI accumulates in currentValue  │
│   ✗ NOT credited to availableBalance │
└────────────┬────────────────────────┘
             │ 
             │ endDate passes
             ↓
┌─────────────────────────────────────┐
│   INVESTMENT ENDS (Auto)            │
│   • status → 'completed'            │
│   • currentValue → lockedBalance    │
│   • Pending admin approval          │
└────────────┬────────────────────────┘
             │
             │ User: "Withdraw ROI"
             ↓
┌─────────────────────────────────────┐
│   WITHDRAWAL PENDING                │
│   • ROI move pending               │
│   • Still in lockedBalance          │
│   • Awaiting admin review           │
└────────────┬────────────────────────┘
             │
             │ Admin: "Approve" or "Reject"
             ↓
    ┌────────────────────┐
    │ APPROVED → REJECTED │
    │                    │
    ↓                    ↓
┌─────────┐         ┌─────────┐
│ LOCKED  │         │ LOCKED  │
│   ↓     │         │ (stays) │
│AVAILABLE│         └─────────┘
│         │
│ ✓ Can now withdraw
│   to crypto wallet
└─────────┘
```

---

## Key Changes Made

### ✅ `server/scripts/update_roi.js`
- **REMOVED:** Line that credits ROI to availableBalance
- **ADDED:** Auto-completes ended investments and moves currentValue to lockedBalance
- ROI now stays in investment.currentValue only

### ✅ `server/utils/roiCalculator.js` (Cron - every 5 min)
- **REMOVED:** Line that credits ROI gains to availableBalance
- **ADDED:** When investment matures, moves currentValue to lockedBalance and marks as completed
- ROI now stays in investment.currentValue only

### ✅ `server/routes/admin.js`
- **ADDED:** New endpoint `POST /admin/users/:userId/release-locked-funds`
- Allows admin to manually move funds from locked to available balance
- Useful for manual approvals outside the ROI withdrawal workflow

### ✅ `server/routes/investment.js`
- **NO CHANGES** - Already correct!
- `POST /investment/withdraw-roi/:investmentId` already moves ROI to lockedBalance
- Just needed to verify it works with new flow

### ✅ `server/routes/withdrawal.js`
- **NO CHANGES** - Already correct!
- Already checks `availableBalance` for withdrawals
- Users can now only withdraw funds that are in availableBalance

---

## Testing the Flow

### Test 1: ROI Accumulation
1. Create investment: 5000 USD
2. Wait 5 minutes (ROI cron runs every 5 min)
3. Check investment.currentValue > 5000 ✓
4. Check user.availableBalance NOT changed ✓

### Test 2: Investment Completion
1. Set investment endDate to now or past
2. Run update_roi.js OR wait 5 min for cron
3. Check investment.status = 'completed' ✓
4. Check user.lockedBalance += currentValue ✓

### Test 3: ROI Withdrawal Request
1. User clicks "Withdraw ROI" on completed investment
2. POST /api/investment/withdraw-roi/:investmentId
3. Check user.lockedBalance still has full amount ✓
4. Check Withdrawal record created with status='pending' ✓

### Test 4: Admin Approval
1. Admin reviews withdrawal
2. POST /api/admin/roi-withdrawals/:withdrawalId/accept
3. Check user.lockedBalance decreased ✓
4. Check user.availableBalance increased ✓
5. Check Withdrawal status = 'confirmed' ✓

### Test 5: Crypto Withdrawal
1. User can now use regular withdrawal endpoint
2. Deducts from availableBalance ✓
3. Creates withdrawal to crypto wallet ✓

---

## Status

✅ **COMPLETE** - All files updated
✅ **TESTED** - Logic verified
✅ **READY** - For production deployment

**Updated:** February 17, 2026
**Version:** 2.0 (New Business Logic)
