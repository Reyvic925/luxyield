# ROI Withdrawal Rejection and Balance Management System

## Overview

This system provides admins with complete control over ROI (Return on Investment) withdrawals with a three-step workflow:

1. **REJECT** - Admin rejects a withdrawal request, amount stays in user's locked balance
2. **MOVE TO AVAILABLE** - Admin moves the rejected amount to user's available balance (with optional fee)
3. **ACCEPT** - Admin accepts a pending withdrawal and moves it to available balance (with optional fee)

## Workflow Diagram

```
User Requests ROI Withdrawal
    ↓
Withdrawal Status: PENDING (amount in lockedBalance)
    ↓
    ├─→ [REJECT] → Status: REJECTED (stays in lockedBalance)
    │       ↓
    │   [MOVE TO AVAILABLE] → Status: MOVED_TO_AVAILABLE (moves to availableBalance with fee)
    │
    └─→ [ACCEPT] → Status: COMPLETED (moves to availableBalance with fee)
```

## API Endpoints

### Base URL
```
POST /api/admin/withdrawals/:withdrawalId/reject
POST /api/admin/withdrawals/:withdrawalId/move-to-available
POST /api/admin/withdrawals/:withdrawalId/accept
GET  /api/admin/withdrawals/:withdrawalId
GET  /api/admin/withdrawals
```

---

## Endpoint Details

### 1. REJECT WITHDRAWAL
**Endpoint:** `POST /api/admin/withdrawals/:withdrawalId/reject`

**Description:** Reject a pending withdrawal. Amount remains in user's locked balance.

**Request Body:**
```json
{
  "reason": "Insufficient documentation" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal rejected. Amount remains in user's locked balance.",
  "withdrawal": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "amount": 1000,
    "status": "rejected",
    "type": "roi",
    "rejectionReason": "Insufficient documentation"
  },
  "userBalance": {
    "lockedBalance": 5000,
    "availableBalance": 2000
  }
}
```

**Status Codes:**
- `200` - Successfully rejected
- `404` - Withdrawal or user not found
- `400` - Invalid withdrawal status (must be pending)

---

### 2. MOVE FROM LOCKED TO AVAILABLE
**Endpoint:** `POST /api/admin/withdrawals/:withdrawalId/move-to-available`

**Description:** Move a rejected withdrawal amount from locked balance to available balance, with optional fee.

**Request Body:**
```json
{
  "feePercent": 5 // Optional: fee as percentage (e.g., 5 for 5%)
}
```

**Calculation:**
- Total Amount: $1000
- Fee (5%): $50
- Amount to Available: $950

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal moved to available balance! Fee applied: $50.00, Net amount added: $950.00",
  "withdrawal": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "amount": 1000,
    "status": "moved_to_available",
    "type": "roi",
    "feeApplied": 50,
    "amountAfterFee": 950
  },
  "userBalance": {
    "lockedBalance": 4000,     // 5000 - 1000
    "availableBalance": 2950   // 2000 + 950
  }
}
```

**Status Codes:**
- `200` - Successfully moved
- `404` - Withdrawal or user not found
- `400` - Invalid withdrawal status (must be rejected) or insufficient locked balance

---

### 3. ACCEPT WITHDRAWAL
**Endpoint:** `POST /api/admin/withdrawals/:withdrawalId/accept`

**Description:** Accept a pending withdrawal and move it to available balance with optional fee.

**Request Body:**
```json
{
  "feePercent": 2 // Optional: fee as percentage (e.g., 2 for 2%)
}
```

**Calculation:**
- Total Amount: $500
- Fee (2%): $10
- Amount to Available: $490

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal accepted! Fee: $10.00, Amount moved to available: $490.00",
  "withdrawal": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "amount": 500,
    "status": "completed",
    "type": "roi",
    "feeApplied": 10,
    "amountAfterFee": 490
  },
  "userBalance": {
    "lockedBalance": 4000,
    "availableBalance": 2490
  }
}
```

**Status Codes:**
- `200` - Successfully accepted
- `404` - Withdrawal or user not found
- `400` - Invalid withdrawal status (must be pending)

---

### 4. GET WITHDRAWAL DETAILS
**Endpoint:** `GET /api/admin/withdrawals/:withdrawalId`

**Description:** Retrieve details of a specific withdrawal.

**Response:**
```json
{
  "success": true,
  "withdrawal": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "userId": {
      "_id": "63d9a8b7c6f5e4d3c2b1a0z9",
      "name": "John Doe",
      "email": "john@example.com",
      "availableBalance": 2490,
      "lockedBalance": 4000
    },
    "amount": 1000,
    "status": "rejected",
    "type": "roi",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc2e0c63DD45e9",
    "network": "ERC20",
    "currency": "USDT",
    "createdAt": "2024-01-15T10:30:00Z",
    "rejectionReason": "Insufficient documentation",
    "feeApplied": null,
    "amountAfterFee": null,
    "processedAt": "2024-01-15T11:00:00Z"
  }
}
```

---

### 5. LIST ALL WITHDRAWALS
**Endpoint:** `GET /api/admin/withdrawals`

**Description:** List all withdrawals with optional filters.

**Query Parameters:**
- `status` - Filter by status: `pending`, `rejected`, `moved_to_available`, `completed`, `failed`
- `type` - Filter by type: `roi`, `regular`
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Example:** `GET /api/admin/withdrawals?status=rejected&type=roi&page=1&limit=10`

**Response:**
```json
{
  "success": true,
  "withdrawals": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "userId": {
        "_id": "63d9a8b7c6f5e4d3c2b1a0z9",
        "name": "John Doe",
        "email": "john@example.com",
        "availableBalance": 2490,
        "lockedBalance": 4000
      },
      "amount": 1000,
      "status": "rejected",
      "type": "roi",
      "walletAddress": "0x742d35Cc6634C0532925a3b844Bc2e0c63DD45e9",
      "network": "ERC20",
      "currency": "USDT",
      "createdAt": "2024-01-15T10:30:00Z",
      "rejectionReason": "Insufficient documentation",
      "feeApplied": null,
      "amountAfterFee": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

## Complete Workflow Example

### Scenario: User requests $1000 ROI withdrawal

**Step 1: User creates withdrawal request**
- User balance before: availableBalance: $5000, lockedBalance: $0
- Withdrawal amount: $1000
- Status: `pending`

**Step 2: Admin rejects the withdrawal**
```bash
POST /api/admin/withdrawals/{withdrawalId}/reject
{
  "reason": "Needs more documentation"
}
```
- Withdrawal status: `rejected`
- User balance: availableBalance: $5000, lockedBalance: $1000 (stays here)

**Step 3: Admin moves to available with 5% fee**
```bash
POST /api/admin/withdrawals/{withdrawalId}/move-to-available
{
  "feePercent": 5
}
```
- Fee taken: $50
- Amount to available: $950
- Withdrawal status: `moved_to_available`
- User balance: availableBalance: $5950, lockedBalance: $0

**Result:**
- User receives $950 in available balance
- Platform keeps $50 as fee
- User can now use $950 in available balance for new investments

---

## Balance Fields

### User Model Balance Fields
```javascript
{
  availableBalance: 5000,    // Money user can withdraw or use for new investments
  lockedBalance: 1000,       // Money locked from rejected withdrawals or in-progress ROI
  balance: 6000              // Total balance (legacy field, use availableBalance + lockedBalance)
}
```

### Withdrawal Model Status Values
- `pending` - Initial status, awaiting admin review
- `rejected` - Admin rejected, amount stays in lockedBalance
- `moved_to_available` - Admin moved to available balance (with or without fee)
- `completed` - Admin accepted, withdrawal processed
- `failed` - Withdrawal failed during processing

---

## Audit Logging

All withdrawal actions are automatically logged in the AuditLog collection with:
- Admin ID performing the action
- User ID affected
- Action type (withdrawal_rejected, withdrawal_moved_to_available, withdrawal_accepted)
- Complete transaction details (amounts, fees, balances)
- Timestamp

**Example Audit Log Entry:**
```json
{
  "userId": "63d9a8b7c6f5e4d3c2b1a0z9",
  "adminId": "63d9a8b7c6f5e4d3c2b1a0z9",
  "action": "withdrawal_moved_to_available",
  "details": {
    "withdrawalId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "amount": 1000,
    "fee": 50,
    "amountAfterFee": 950,
    "previousLockedBalance": 1000,
    "newLockedBalance": 0,
    "newAvailableBalance": 5950
  },
  "createdAt": "2024-01-15T11:00:00Z"
}
```

---

## Error Handling

### Common Errors

**1. Withdrawal Not Found**
```json
{
  "success": false,
  "error": "Withdrawal not found"
}
```

**2. Invalid Status Transition**
```json
{
  "success": false,
  "error": "Can only move rejected withdrawals. Current status: pending"
}
```

**3. Insufficient Locked Balance**
```json
{
  "success": false,
  "error": "Insufficient locked balance. Required: $1000, Available: $500"
}
```

**4. Unauthorized Access**
```json
{
  "success": false,
  "error": "Admin authentication required"
}
```

---

## Implementation Notes

1. **Fee Handling:** Fees are optional (default 0%). They reduce the amount transferred to available balance.
2. **Audit Trail:** All transactions are logged for compliance and reconciliation.
3. **Balance Integrity:** The system maintains balance consistency through transaction-based updates.
4. **ROI Tracking:** For ROI withdrawals, the associated investment is marked as `roiWithdrawn: true`.

---

## Testing Checklist

- [ ] Reject pending withdrawal - verify amount stays in lockedBalance
- [ ] Move rejected to available - verify fee is applied correctly
- [ ] Move rejected to available - verify amount transferred correctly
- [ ] Accept pending withdrawal - verify amount in availableBalance
- [ ] Accept pending withdrawal - verify fee is applied
- [ ] Audit logs created for all actions
- [ ] User balances updated correctly
- [ ] List withdrawals with filters works
- [ ] Get withdrawal details works
- [ ] Error handling for invalid transitions
- [ ] Error handling for insufficient balance
