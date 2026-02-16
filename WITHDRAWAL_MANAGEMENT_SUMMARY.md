# ROI Withdrawal Management - Implementation Summary

## What Was Implemented

A complete three-step withdrawal management system that allows admins to:

### Step 1: REJECT ROI Withdrawal
- **Endpoint:** `POST /api/admin/withdrawals/:withdrawalId/reject`
- **Action:** Admin rejects a pending withdrawal request
- **Result:** 
  - Withdrawal status changes to `rejected`
  - Amount stays in user's `lockedBalance`
  - Rejection reason is recorded

### Step 2: MOVE FROM LOCKED TO AVAILABLE (With Fee)
- **Endpoint:** `POST /api/admin/withdrawals/:withdrawalId/move-to-available`
- **Action:** Admin moves rejected amount to available balance
- **Optional:** Apply a fee (e.g., 5%)
- **Result:**
  - Amount is deducted from `lockedBalance`
  - Net amount (after fee) is added to `availableBalance`
  - Withdrawal status changes to `moved_to_available`
  - Fee is recorded for audit purposes

### Step 3: ACCEPT & COMPLETE
- **Endpoint:** `POST /api/admin/withdrawals/:withdrawalId/accept`
- **Action:** Admin accepts a pending withdrawal
- **Optional:** Apply a fee
- **Result:**
  - Amount moves from `lockedBalance` to `availableBalance`
  - Net amount (after fee) is available to user
  - Withdrawal status changes to `completed`

## Additional Features

### List & View Withdrawals
- **Get specific withdrawal:** `GET /api/admin/withdrawals/:withdrawalId`
- **List all withdrawals:** `GET /api/admin/withdrawals?status=rejected&type=roi&page=1&limit=20`

### Audit Logging
- Every action is logged in the AuditLog collection
- Includes admin ID, user ID, action type, and transaction details
- Full balance history is maintained

## Files Created/Modified

### New Files Created
1. **[server/routes/admin/withdrawalManagement.js](server/routes/admin/withdrawalManagement.js)**
   - Complete withdrawal management endpoints
   - Rejection, moving to available, and acceptance logic
   - Error handling and validation

2. **[WITHDRAWAL_MANAGEMENT_API.md](WITHDRAWAL_MANAGEMENT_API.md)**
   - Complete API documentation
   - Workflow diagrams
   - Example requests and responses
   - Error handling guide

### Files Modified
1. **[server/routes/admin.js](server/routes/admin.js)**
   - Registered the new withdrawalManagement routes at `/api/admin/withdrawals`

## Database Models Used

### User Model Fields
- `availableBalance` - Money user can use
- `lockedBalance` - Money in rejected/pending withdrawals
- `balance` - Total balance

### Withdrawal Model Fields
- `status` - pending, rejected, moved_to_available, completed, failed
- `type` - roi, regular
- `amount` - Withdrawal amount
- `userId` - Reference to user
- `rejectionReason` - Why it was rejected
- `feeApplied` - Fee amount deducted
- `amountAfterFee` - Final amount after fee

## Usage Example

```bash
# 1. Reject a withdrawal
curl -X POST http://localhost:5000/api/admin/withdrawals/64a1b2c3d4e5f6g7h8i9j0k1/reject \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Insufficient documentation"}'

# 2. Move to available with 5% fee
curl -X POST http://localhost:5000/api/admin/withdrawals/64a1b2c3d4e5f6g7h8i9j0k1/move-to-available \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"feePercent": 5}'

# 3. Or accept pending withdrawal directly
curl -X POST http://localhost:5000/api/admin/withdrawals/64a1b2c3d4e5f6g7h8i9j0k1/accept \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"feePercent": 2}'
```

## Key Features

✅ **Complete Workflow** - Reject → Move with Fee → Accept
✅ **Flexible Fees** - Optional percentage-based fees on all transfers
✅ **Balance Management** - Automatic transfer between locked and available balances
✅ **Audit Trail** - Complete logging of all admin actions
✅ **Error Handling** - Comprehensive validation and error messages
✅ **User Populated** - All responses include user details and updated balances
✅ **Pagination** - List endpoint supports filtering and pagination

## How It Works

1. **User withdraws ROI** → Goes to `pending` status
2. **Admin reviews** → Can reject or accept
3. **If Rejected:**
   - Amount stays in `lockedBalance`
   - Admin can later move it to `availableBalance` with a fee
4. **If Accepted:**
   - Amount moves to `availableBalance` with optional fee
   - User can now use it for new investments
5. **All actions logged** → For compliance and reconciliation

## Testing

To test the implementation:

1. Create a withdrawal request as a user
2. Use the rejection endpoint to reject it
3. Verify amount is in `lockedBalance`
4. Use move-to-available to transfer with fee
5. Verify amount is now in `availableBalance` (minus fee)
6. Check audit logs for all actions

For detailed API documentation, see [WITHDRAWAL_MANAGEMENT_API.md](WITHDRAWAL_MANAGEMENT_API.md)
