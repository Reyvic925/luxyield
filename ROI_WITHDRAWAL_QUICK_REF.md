# ROI WITHDRAWAL SYSTEM - QUICK REFERENCE

## Balance Flow Diagram

```
                    INVESTMENT PHASE
                    ────────────────
                         
                    $5,000 invested
                         ↓
                  ┌───────────────┐
                  │  INVESTMENT   │
                  │               │
                  │ Amount: 5000  │
                  │ Current: 5750 │  (includes $750 ROI)
                  │ Status: active│
                  └───────────────┘
                         ↓
         availableBalance: $0
         lockedBalance: $0


            INVESTMENT MATURATION PHASE
            ──────────────────────────

         endDate passes (auto)
                ↓
    ┌──────────────────────┐
    │  Investment ends     │
    │  Status: completed   │
    │  CurrentValue: $5750 │
    └──────────┬───────────┘
               ↓
    ┌──────────────────────┐
    │  MOVE TO LOCKED      │
    │  ──────────────────  │
    │  availableBalance: 0 │
    │  lockedBalance: 5750 │
    └──────────┬───────────┘
               ↓
         (User sees in Portfolio:
          "Locked Balance: $5,750
           Awaiting Admin Release")


         WITHDRAWAL REQUEST PHASE
         ─────────────────────────

     User: "Withdraw $750 ROI"
               ↓
    Withdrawal created (pending)
               ↓
    ┌──────────────────────┐
    │  PENDING APPROVAL    │
    │  ──────────────────  │
    │  availableBalance: 0 │
    │  lockedBalance: 5750 │
    └──────────┬───────────┘
               ↓
         Admin reviews
               ↓
         Admin: "Approve"
               ↓
    ┌──────────────────────┐
    │  MOVE TO AVAILABLE   │
    │  ──────────────────  │
    │  availableBalance:750│
    │  lockedBalance: 5000 │
    └──────────┬───────────┘
               ↓
    (User now can withdraw
     $750 to crypto wallet)


         CRYPTO WITHDRAWAL PHASE
         ──────────────────────

      User: "Withdraw to BTC"
               ↓
    ┌──────────────────────┐
    │  FINAL STATE         │
    │  ──────────────────  │
    │  availableBalance: 0 │
    │  lockedBalance: 5000 │
    │  (sent to BTC wallet)│
    └──────────────────────┘
```

---

## API Endpoints Summary

### User Actions

| Action | Endpoint | Body | Result |
|--------|----------|------|--------|
| Request ROI Withdrawal | `POST /api/investment/withdraw-roi/:id` | `{}` | Creates pending withdrawal |
| Withdraw to Wallet | `POST /api/withdrawal` | Wallet details | Deducts from availableBalance |

### Admin Actions

| Action | Endpoint | Body | Result |
|--------|----------|------|--------|
| Approve ROI Withdrawal | `POST /api/admin/roi-withdrawals/:id/accept` | `{ feePercent: 0 }` | Locked → Available |
| Reject ROI Withdrawal | `POST /api/admin/roi-withdrawals/:id/reject` | `{ reason: "..." }` | Stays in locked |
| Manual Release | `POST /api/admin/users/:id/release-locked-funds` | `{ amount: 1000 }` | Locked → Available |
| View Pending ROI | `GET /api/admin/roi-withdrawals` | - | List pending approvals |

---

## Code Changes Summary

### File 1: `server/scripts/update_roi.js`
```
OLD: availableBalance += roiAmount
NEW: Keep in investment.currentValue

OLD: Only updated active investments
NEW: Also auto-completes ended investments
     and moves to lockedBalance
```

### File 2: `server/utils/roiCalculator.js`
```
OLD: availableBalance += fluctuation
NEW: Keep in investment.currentValue

OLD: Only status update to completed
NEW: Also moves to lockedBalance
     when investment matures
```

### File 3: `server/routes/admin.js`
```
NEW: POST /admin/users/:userId/release-locked-funds
     → Moves from locked to available
```

---

## Key Differences

### ❌ OLD SYSTEM
```
Investment active → ROI credited to availableBalance
                 ↓
             User withdraws immediately
```

### ✅ NEW SYSTEM
```
Investment active → ROI stays in investment
                 ↓
         Investment ends → Move to lockedBalance
                 ↓
       User requests withdrawal → Still locked
                 ↓
      Admin approves → Move to availableBalance
                 ↓
          User withdraws
```

---

## User Experience

### Before (Old System)
1. ✓ Invest $5,000
2. ✓ ROI shows in availableBalance immediately
3. ✓ Can withdraw ROI anytime
4. ✗ Less admin control
5. ✗ No approval process

### After (New System)
1. ✓ Invest $5,000
2. ✓ See ROI growing in investment details
3. ✗ ROI NOT in availableBalance (new behavior)
4. ✓ Investment completes → Moved to locked balance
5. ✓ Request withdrawal → Admin approves
6. ✓ After approval → Moves to available
7. ✓ Then can withdraw to wallet
8. ✓ Full admin control and audit trail

---

## Database Queries

### Find pending ROI withdrawals:
```javascript
Withdrawal.find({ type: 'roi', status: 'pending' })
```

### Find user's locked funds:
```javascript
User.findById(userId).select('lockedBalance')
```

### Find ended investments not yet moved to locked:
```javascript
Investment.find({ 
  status: 'completed',
  roiWithdrawn: false 
})
```

---

## Timestamps

- **Updated:** February 17, 2026
- **System Status:** ✅ Active
- **Deployment Status:** ✅ Ready
- **Version:** 2.0
