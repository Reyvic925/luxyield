<<<<<<< HEAD
# ROI WITHDRAWAL SYSTEM - COMPLETE RESTRUCTURE

## 📋 Summary

The ROI withdrawal system has been completely restructured to separate ROI accumulation from user-available balance, and add a proper approval workflow.

**Date:** February 17, 2026
**Status:** ✅ COMPLETE

---

## 🔄 The New Flow

### Phase 1: Investment Active (Days/Weeks)
```
User deposits $5,000
     ↓
Investment starts earning ROI
     ↓
System credits ROI to investment.currentValue ONLY
     ↓
Day 7: currentValue = $5,750 (includes ROI)
     ↓
user.availableBalance = $0 (ROI is NOT here)
user.lockedBalance = $0 (investment still active)
```

### Phase 2: Investment Matures (Auto)
```
endDate passes
     ↓
Investment auto-completes
     ↓
Entire currentValue ($5,750) moves to user.lockedBalance
     ↓
Investment becomes read-only
     ↓
user.availableBalance = $0
user.lockedBalance = $5,750 (pending admin approval)
```

### Phase 3: User Requests Withdrawal
```
User clicks "Withdraw ROI"
     ↓
System calculates: ROI = $5,750 - $5,000 = $750
     ↓
Creates Withdrawal record (type='roi', status='pending')
     ↓
Amount stays in user.lockedBalance
     ↓
Admin sees pending ROI withdrawal for review
```

### Phase 4: Admin Approves
```
Admin reviews withdrawal request
     ↓
Admin clicks "Approve"
     ↓
System calculates any fees
     ↓
Moves amount from lockedBalance → availableBalance
     ↓
user.availableBalance = $750
user.lockedBalance = $5,000
     ↓
Withdrawal marked as 'confirmed'
```

### Phase 5: User Withdraws to Crypto
```
User goes to withdrawal page
     ↓
User has $750 availableBalance to withdraw
     ↓
User enters crypto details (BTC/ETH/USDT address)
     ↓
System converts to crypto and sends
```

---

## 📝 Files Changed

### 1. ✅ `server/scripts/update_roi.js`
**What Changed:**
- ROI no longer credited to availableBalance
- When investment ends, entire currentValue moves to lockedBalance

**Before:**
```javascript
await User.findByIdAndUpdate(inv.user, { $inc: { availableBalance: roiAmount } });
```

**After:**
```javascript
// ROI stays in investment.currentValue only
// When investment ends:
await User.findByIdAndUpdate(inv.user, { $inc: { lockedBalance: currentValue } });
```

### 2. ✅ `server/utils/roiCalculator.js`
**What Changed:**
- ROI gains no longer credited to availableBalance
- When investment matures (every 5 min cron), entire currentValue moves to lockedBalance

**Before:**
```javascript
if (fluctuation > 0) {
  await User.findByIdAndUpdate(invDoc.user, { $inc: { availableBalance: fluctuation } });
}
```

**After:**
```javascript
// ROI stays in investment.currentValue only
// When matured:
const currentValue = invDoc.currentValue;
await User.findByIdAndUpdate(invDoc.user, { $inc: { lockedBalance: currentValue } });
```

### 3. ✅ `server/routes/admin.js`
**What Added:**
- New endpoint: `POST /admin/users/:userId/release-locked-funds`
- Allows admin to manually move funds from locked → available

**Endpoint:**
```javascript
POST /api/admin/users/:userId/release-locked-funds
Body: {
  amount: 1000,
  reason: "Investment completed"
}
```

### 4. ✅ `server/routes/investment.js`
**Status:** No changes needed
- Already correctly moves ROI to lockedBalance
- Already has pending withdrawal workflow

### 5. ✅ `server/routes/withdrawal.js`
**Status:** No changes needed
- Already checks availableBalance
- Already prevents over-withdrawal

---

## 💰 User Balance Explanation

### `availableBalance`
- Money user can **immediately withdraw** to crypto wallet
- Sources:
  - Initial deposits (after admin confirms)
  - Completed investments moved to available (after admin approves)
- **NOT included:** ROI during investment period, completed investments pending approval

### `lockedBalance`
- Money **pending admin approval**
- Sources:
  - Completed investments (pending release)
  - ROI submitted for withdrawal (pending approval)
- **Blocked from:** Cannot be withdrawn to crypto without admin approval
- **Used for:** Display in "locked" section of portfolio

---

## 🎯 Admin Workflow

### For Completed Investments

**Option A: Manual Release** (Quick approve)
```
Admin sees completed investment in user's portfolio
     ↓
Admin clicks "Release to Available"
     ↓
POST /api/admin/users/:userId/release-locked-funds
Body: { amount: 5750, reason: "Investment completed" }
     ↓
User sees $5,750 in availableBalance
     ↓
User can now withdraw to wallet
```

**Option B: User Initiates ROI Withdrawal** (Normal flow)
```
User clicks "Withdraw ROI" on completed investment
     ↓
POST /api/investment/withdraw-roi/:investmentId
     ↓
Withdrawal created with type='roi', status='pending'
     ↓
Admin reviews in "Pending ROI Withdrawals"
     ↓
Admin approves: POST /api/admin/roi-withdrawals/:id/accept
     ↓
Amount moves from lockedBalance → availableBalance
     ↓
User can now withdraw to wallet
```

---

## 🔐 Security Benefits

1. **Separation of Concerns**
   - ROI stays within investment until explicitly approved
   - Reduces risk of accidental crediting

2. **Admin Control**
   - All ROI releases require explicit admin approval
   - Audit trail in database
   - Can reject suspicious withdrawals

3. **Clear State**
   - User sees exactly what's locked vs available
   - No confusion about pending ROI
   - Transparent workflow

---

## 📊 Data Model Updates

### Investment Model
```javascript
{
  _id: "...",
  user: "...",
  amount: 5000,              // Original investment
  currentValue: 5750,        // Growing with ROI
  startDate: "2026-02-01",
  endDate: "2026-02-08",     // Investment end
  status: "completed",       // active → completed
  roiWithdrawn: false,       // Set to true after withdrawal approved
  transactions: [
    { type: 'roi', amount: 750, date: "2026-02-08" }
  ]
}
```

### User Model (Balances)
```javascript
{
  _id: "...",
  availableBalance: 750,     // Can withdraw NOW
  lockedBalance: 5000        // Pending admin
}
```

### Withdrawal Model (ROI)
```javascript
{
  _id: "...",
  type: "roi",               // vs "regular"
  status: "pending",         // pending → confirmed → rejected
  userId: "...",
  investmentId: "...",
  amount: 750,               // ROI amount
  createdAt: "2026-02-17",
  approvedAt: null,          // Set when confirmed
}
```

---

## 🧪 Testing Scenarios

### ✅ Test 1: ROI Accumulation (No Balance Change)
```
1. Create investment: $5,000
2. Wait 5 minutes (cron runs)
3. Investment.currentValue = $5,001.25 (ROI added) ✓
4. User.availableBalance = $0 (unchanged) ✓
5. User.lockedBalance = $0 (still active) ✓
```

### ✅ Test 2: Investment Completes (Auto to Locked)
```
1. Set investment endDate to past
2. Run cron or daily script
3. Investment.status = 'completed' ✓
4. Investment.currentValue = $5,750 ✓
5. User.lockedBalance += $5,750 ✓
6. User.availableBalance = $0 (unchanged) ✓
```

### ✅ Test 3: User Withdraws ROI (Pending)
```
1. User clicks "Withdraw ROI"
2. System calculates: ROI = $750
3. Withdrawal record created (status='pending') ✓
4. User.lockedBalance = $5,750 (unchanged) ✓
5. Admin sees pending withdrawal ✓
```

### ✅ Test 4: Admin Approves (Locked → Available)
```
1. Admin clicks "Approve Withdrawal"
2. User.lockedBalance -= $750 ✓ → $5,000
3. User.availableBalance += $750 ✓ → $750
4. Withdrawal.status = 'confirmed' ✓
5. Investment.roiWithdrawn = true ✓
```

### ✅ Test 5: User Withdraws to Wallet (Available)
```
1. User goes to withdrawal page
2. Available balance shows $750 ✓
3. User enters wallet address
4. Withdrawal created (type='regular') ✓
5. User.availableBalance -= $750 ✓ → $0
```

---

## ⚙️ Deployment Checklist

- [x] Update `server/scripts/update_roi.js`
- [x] Update `server/utils/roiCalculator.js`
- [x] Add admin endpoint to `server/routes/admin.js`
- [x] Verify `server/routes/investment.js` (no changes needed)
- [x] Verify `server/routes/withdrawal.js` (no changes needed)
- [x] Create documentation (this file)

**Ready for:** Production deployment

---

## 🚀 Migration Notes

For existing investments:
- If still active: ROI stays in currentValue ✓
- If already completed: Manually run update_roi.js to move to lockedBalance
- If user has pending ROI in availableBalance: Move to lockedBalance via admin tool

---

## 📞 Support

### User Questions
- **"Why is my ROI in locked balance?"** → "It's pending admin approval"
- **"How do I get ROI to available balance?"** → "Admin will approve and release it"
- **"When can I withdraw?"** → "Once it's in availableBalance"

### Admin Questions
- **"How do I release ROI?"** → "Approve ROI withdrawal or manually release"
- **"Can I reject a withdrawal?"** → "Yes, it stays in locked balance"
- **"Where's the audit trail?"** → "In Withdrawal records and database"

---

**Status:** ✅ COMPLETE
**Next Step:** Deploy to production
**Questions?** Check ROI_FLOW_UPDATED.md or the code comments
=======
# ROI WITHDRAWAL SYSTEM - COMPLETE RESTRUCTURE

## 📋 Summary

The ROI withdrawal system has been completely restructured to separate ROI accumulation from user-available balance, and add a proper approval workflow.

**Date:** February 17, 2026
**Status:** ✅ COMPLETE

---

## 🔄 The New Flow

### Phase 1: Investment Active (Days/Weeks)
```
User deposits $5,000
     ↓
Investment starts earning ROI
     ↓
System credits ROI to investment.currentValue ONLY
     ↓
Day 7: currentValue = $5,750 (includes ROI)
     ↓
user.availableBalance = $0 (ROI is NOT here)
user.lockedBalance = $0 (investment still active)
```

### Phase 2: Investment Matures (Auto)
```
endDate passes
     ↓
Investment auto-completes
     ↓
Entire currentValue ($5,750) moves to user.lockedBalance
     ↓
Investment becomes read-only
     ↓
user.availableBalance = $0
user.lockedBalance = $5,750 (pending admin approval)
```

### Phase 3: User Requests Withdrawal
```
User clicks "Withdraw ROI"
     ↓
System calculates: ROI = $5,750 - $5,000 = $750
     ↓
Creates Withdrawal record (type='roi', status='pending')
     ↓
Amount stays in user.lockedBalance
     ↓
Admin sees pending ROI withdrawal for review
```

### Phase 4: Admin Approves
```
Admin reviews withdrawal request
     ↓
Admin clicks "Approve"
     ↓
System calculates any fees
     ↓
Moves amount from lockedBalance → availableBalance
     ↓
user.availableBalance = $750
user.lockedBalance = $5,000
     ↓
Withdrawal marked as 'confirmed'
```

### Phase 5: User Withdraws to Crypto
```
User goes to withdrawal page
     ↓
User has $750 availableBalance to withdraw
     ↓
User enters crypto details (BTC/ETH/USDT address)
     ↓
System converts to crypto and sends
```

---

## 📝 Files Changed

### 1. ✅ `server/scripts/update_roi.js`
**What Changed:**
- ROI no longer credited to availableBalance
- When investment ends, entire currentValue moves to lockedBalance

**Before:**
```javascript
await User.findByIdAndUpdate(inv.user, { $inc: { availableBalance: roiAmount } });
```

**After:**
```javascript
// ROI stays in investment.currentValue only
// When investment ends:
await User.findByIdAndUpdate(inv.user, { $inc: { lockedBalance: currentValue } });
```

### 2. ✅ `server/utils/roiCalculator.js`
**What Changed:**
- ROI gains no longer credited to availableBalance
- When investment matures (every 5 min cron), entire currentValue moves to lockedBalance

**Before:**
```javascript
if (fluctuation > 0) {
  await User.findByIdAndUpdate(invDoc.user, { $inc: { availableBalance: fluctuation } });
}
```

**After:**
```javascript
// ROI stays in investment.currentValue only
// When matured:
const currentValue = invDoc.currentValue;
await User.findByIdAndUpdate(invDoc.user, { $inc: { lockedBalance: currentValue } });
```

### 3. ✅ `server/routes/admin.js`
**What Added:**
- New endpoint: `POST /admin/users/:userId/release-locked-funds`
- Allows admin to manually move funds from locked → available

**Endpoint:**
```javascript
POST /api/admin/users/:userId/release-locked-funds
Body: {
  amount: 1000,
  reason: "Investment completed"
}
```

### 4. ✅ `server/routes/investment.js`
**Status:** No changes needed
- Already correctly moves ROI to lockedBalance
- Already has pending withdrawal workflow

### 5. ✅ `server/routes/withdrawal.js`
**Status:** No changes needed
- Already checks availableBalance
- Already prevents over-withdrawal

---

## 💰 User Balance Explanation

### `availableBalance`
- Money user can **immediately withdraw** to crypto wallet
- Sources:
  - Initial deposits (after admin confirms)
  - Completed investments moved to available (after admin approves)
- **NOT included:** ROI during investment period, completed investments pending approval

### `lockedBalance`
- Money **pending admin approval**
- Sources:
  - Completed investments (pending release)
  - ROI submitted for withdrawal (pending approval)
- **Blocked from:** Cannot be withdrawn to crypto without admin approval
- **Used for:** Display in "locked" section of portfolio

---

## 🎯 Admin Workflow

### For Completed Investments

**Option A: Manual Release** (Quick approve)
```
Admin sees completed investment in user's portfolio
     ↓
Admin clicks "Release to Available"
     ↓
POST /api/admin/users/:userId/release-locked-funds
Body: { amount: 5750, reason: "Investment completed" }
     ↓
User sees $5,750 in availableBalance
     ↓
User can now withdraw to wallet
```

**Option B: User Initiates ROI Withdrawal** (Normal flow)
```
User clicks "Withdraw ROI" on completed investment
     ↓
POST /api/investment/withdraw-roi/:investmentId
     ↓
Withdrawal created with type='roi', status='pending'
     ↓
Admin reviews in "Pending ROI Withdrawals"
     ↓
Admin approves: POST /api/admin/roi-withdrawals/:id/accept
     ↓
Amount moves from lockedBalance → availableBalance
     ↓
User can now withdraw to wallet
```

---

## 🔐 Security Benefits

1. **Separation of Concerns**
   - ROI stays within investment until explicitly approved
   - Reduces risk of accidental crediting

2. **Admin Control**
   - All ROI releases require explicit admin approval
   - Audit trail in database
   - Can reject suspicious withdrawals

3. **Clear State**
   - User sees exactly what's locked vs available
   - No confusion about pending ROI
   - Transparent workflow

---

## 📊 Data Model Updates

### Investment Model
```javascript
{
  _id: "...",
  user: "...",
  amount: 5000,              // Original investment
  currentValue: 5750,        // Growing with ROI
  startDate: "2026-02-01",
  endDate: "2026-02-08",     // Investment end
  status: "completed",       // active → completed
  roiWithdrawn: false,       // Set to true after withdrawal approved
  transactions: [
    { type: 'roi', amount: 750, date: "2026-02-08" }
  ]
}
```

### User Model (Balances)
```javascript
{
  _id: "...",
  availableBalance: 750,     // Can withdraw NOW
  lockedBalance: 5000        // Pending admin
}
```

### Withdrawal Model (ROI)
```javascript
{
  _id: "...",
  type: "roi",               // vs "regular"
  status: "pending",         // pending → confirmed → rejected
  userId: "...",
  investmentId: "...",
  amount: 750,               // ROI amount
  createdAt: "2026-02-17",
  approvedAt: null,          // Set when confirmed
}
```

---

## 🧪 Testing Scenarios

### ✅ Test 1: ROI Accumulation (No Balance Change)
```
1. Create investment: $5,000
2. Wait 5 minutes (cron runs)
3. Investment.currentValue = $5,001.25 (ROI added) ✓
4. User.availableBalance = $0 (unchanged) ✓
5. User.lockedBalance = $0 (still active) ✓
```

### ✅ Test 2: Investment Completes (Auto to Locked)
```
1. Set investment endDate to past
2. Run cron or daily script
3. Investment.status = 'completed' ✓
4. Investment.currentValue = $5,750 ✓
5. User.lockedBalance += $5,750 ✓
6. User.availableBalance = $0 (unchanged) ✓
```

### ✅ Test 3: User Withdraws ROI (Pending)
```
1. User clicks "Withdraw ROI"
2. System calculates: ROI = $750
3. Withdrawal record created (status='pending') ✓
4. User.lockedBalance = $5,750 (unchanged) ✓
5. Admin sees pending withdrawal ✓
```

### ✅ Test 4: Admin Approves (Locked → Available)
```
1. Admin clicks "Approve Withdrawal"
2. User.lockedBalance -= $750 ✓ → $5,000
3. User.availableBalance += $750 ✓ → $750
4. Withdrawal.status = 'confirmed' ✓
5. Investment.roiWithdrawn = true ✓
```

### ✅ Test 5: User Withdraws to Wallet (Available)
```
1. User goes to withdrawal page
2. Available balance shows $750 ✓
3. User enters wallet address
4. Withdrawal created (type='regular') ✓
5. User.availableBalance -= $750 ✓ → $0
```

---

## ⚙️ Deployment Checklist

- [x] Update `server/scripts/update_roi.js`
- [x] Update `server/utils/roiCalculator.js`
- [x] Add admin endpoint to `server/routes/admin.js`
- [x] Verify `server/routes/investment.js` (no changes needed)
- [x] Verify `server/routes/withdrawal.js` (no changes needed)
- [x] Create documentation (this file)

**Ready for:** Production deployment

---

## 🚀 Migration Notes

For existing investments:
- If still active: ROI stays in currentValue ✓
- If already completed: Manually run update_roi.js to move to lockedBalance
- If user has pending ROI in availableBalance: Move to lockedBalance via admin tool

---

## 📞 Support

### User Questions
- **"Why is my ROI in locked balance?"** → "It's pending admin approval"
- **"How do I get ROI to available balance?"** → "Admin will approve and release it"
- **"When can I withdraw?"** → "Once it's in availableBalance"

### Admin Questions
- **"How do I release ROI?"** → "Approve ROI withdrawal or manually release"
- **"Can I reject a withdrawal?"** → "Yes, it stays in locked balance"
- **"Where's the audit trail?"** → "In Withdrawal records and database"

---

**Status:** ✅ COMPLETE
**Next Step:** Deploy to production
**Questions?** Check ROI_FLOW_UPDATED.md or the code comments
>>>>>>> d9aeb3e (Improve admin panel mobile responsiveness)
