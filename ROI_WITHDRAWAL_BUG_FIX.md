# Critical ROI Withdrawal Bug Fix

## Summary

The user reported that when they initiated a ROI withdrawal:
1. ❌ Locked balance was never updated in the database
2. ❌ ROI withdrawal didn't work in the user UI  
3. ❌ Available balance in withdrawal page didn't update

## Root Cause Analysis

Found **CRITICAL BUG** in the portfolio API (`server/routes/portfolio.js`):

### The Bug:
The portfolio API was checking ONLY for **confirmed/completed** ROI withdrawals to set the `roiWithdrawn` flag:

```javascript
// OLD (WRONG) CODE:
const confirmedRoiWithdrawals = await Withdrawal.find({
  userId: userId,
  type: 'roi',
  status: { $in: ['confirmed', 'completed'] }  // ❌ Only checks confirmed!
}).lean();

roiWithdrawn: confirmedWithdrawalIds.has(inv._id.toString()), // Only true if confirmed
```

### The Problem:
- When a user withdraws ROI, a Withdrawal record is created with status: **'pending'** (awaiting admin approval)
- The backend correctly moves ROI to `lockedBalance` ✅
- BUT the portfolio API returns `roiWithdrawn: false` ❌ (because it only checks 'confirmed' status)
- The UI then thinks the ROI wasn't withdrawn and shows incorrect data
- User sees stale/wrong balance information

## The Fixes

### Fix #1: Portfolio API - getPortfolioData Function
**File**: `server/routes/portfolio.js` (Lines 15-35)

Changed to check ALL ROI withdrawal statuses (pending, confirmed, completed):

```javascript
// Check which investments have ANY ROI withdrawals (pending, confirmed, completed)
const allRoiWithdrawals = await Withdrawal.find({
  userId: userId,
  type: 'roi',
  status: { $in: ['pending', 'confirmed', 'completed'] }  // ✅ Check all statuses
}).lean();
const allWithdrawalIds = new Set(allRoiWithdrawals.map(w => w.investmentId?.toString()));

// For display purposes, also track confirmed-only withdrawals
const confirmedRoiWithdrawals = await Withdrawal.find({
  userId: userId,
  type: 'roi',
  status: { $in: ['confirmed', 'completed'] }
}).lean();
const confirmedWithdrawalIds = new Set(confirmedRoiWithdrawals.map(w => w.investmentId?.toString()));
```

### Fix #2: Portfolio API - Investment Response
**File**: `server/routes/portfolio.js` (Lines 166-181)

Updated the response to include comprehensive withdrawal status:

```javascript
// ✅ NOW: roiWithdrawn = true if investment flag is set OR there's a pending/confirmed withdrawal
roiWithdrawn: inv.roiWithdrawn || allWithdrawalIds.has(inv._id.toString()),
roiWithdrawalPending: allWithdrawalIds.has(inv._id.toString()) && !confirmedWithdrawalIds.has(inv._id.toString()),
roiWithdrawalConfirmed: confirmedWithdrawalIds.has(inv._id.toString()),
```

### Fix #3: Individual Investment Endpoint
**File**: `server/routes/portfolio.js` (Lines 305-325)

Applied same logic to the `/investment/:id` endpoint:

```javascript
// Check if there's ANY ROI withdrawal (pending, confirmed, or completed)
const anyRoiWithdrawal = await Withdrawal.findOne({
  investmentId: investment._id,
  type: 'roi',
  status: { $in: ['pending', 'confirmed', 'completed'] }  // ✅ Check all statuses
}).lean();

// roiWithdrawn = true if investment flag is set OR there's a pending/confirmed withdrawal
const roiActuallyWithdrawn = investment.roiWithdrawn || !!anyRoiWithdrawal;
```

## Impact on User Experience

### Before Fix:
1. User clicks "Withdraw ROI" button
2. Backend correctly processes withdrawal
3. ❌ Portfolio API returns `roiWithdrawn: false` (wrong!)
4. ❌ UI shows button still says "Withdraw" (misleading)
5. ❌ Locked balance doesn't update in withdrawal page (stale data)
6. ❌ User confused, might try to withdraw again

### After Fix:
1. User clicks "Withdraw ROI" button
2. Backend correctly processes withdrawal
3. ✅ Portfolio API now returns `roiWithdrawn: true` (correct!)
4. ✅ UI updates immediately to show ROI is withdrawn
5. ✅ Locked balance displays correctly with ROI amount
6. ✅ User sees clear "ROI Withdrawn" status
7. ✅ Locked balance page shows pending amount

## Additional Improvements

The fix also adds new flags for better UI differentiation:
- `roiWithdrawalPending`: true if withdrawal is pending admin approval
- `roiWithdrawalConfirmed`: true if admin has released the funds

This allows the frontend to show more specific status messages:
- "ROI Withdrawal Pending (awaiting admin approval)"
- "ROI Withdrawal Confirmed (moved to available)"

## Files Modified
- `server/routes/portfolio.js` - Fixed getPortfolioData and individual investment endpoints

## Commits
- `4e35205`: Fix: Correct roiWithdrawn flag in portfolio API to check pending withdrawals

## Deployment Note
⚠️ Production server needs to be restarted/redeployed for changes to take effect:
- Changes are committed and pushed to GitHub
- Once Render detects the new code, it will auto-redeploy
- After deployment, users will see correct balance updates immediately after ROI withdrawal

## Testing

### What Was Tested:
✅ Backend investment ROI withdrawal logic (correctly adds to lockedBalance)
✅ Withdrawal record creation with pending status
✅ Portfolio API response structure
✅ Balance calculation logic

### What Users Should Verify After Deployment:
1. Click "Withdraw ROI" on a completed investment
2. Verify button changes to "ROI Withdrawn"
3. Check withdrawal page - locked balance should increase
4. Admin approves the withdrawal
5. Verify withdrawal page - amount moves to available balance

## Code Quality

- ✅ Maintains backward compatibility with roiWithdrawn flag
- ✅ Adds helpful new flags for better UX
- ✅ Follows existing code patterns
- ✅ No breaking changes to API contract
- ✅ Includes comprehensive comments
