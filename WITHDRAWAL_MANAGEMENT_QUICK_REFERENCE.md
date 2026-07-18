<<<<<<< HEAD
# Withdrawal Management System - Quick Reference

## ⚡ Quick Start

### Reject a Withdrawal
```bash
curl -X POST http://localhost:5000/api/admin/withdrawals/{id}/reject \
  -H "Authorization: Bearer TOKEN" \
  -d '{"reason": "Reason here"}'
```
**Effect:** Status → `rejected`, Amount stays in `lockedBalance`

---

### Move to Available (with fee)
```bash
curl -X POST http://localhost:5000/api/admin/withdrawals/{id}/move-to-available \
  -H "Authorization: Bearer TOKEN" \
  -d '{"feePercent": 5}'
```
**Effect:** Status → `moved_to_available`, Amount: locked → available (minus fee)

---

### Accept Pending (with fee)
```bash
curl -X POST http://localhost:5000/api/admin/withdrawals/{id}/accept \
  -H "Authorization: Bearer TOKEN" \
  -d '{"feePercent": 2}'
```
**Effect:** Status → `completed`, Amount: locked → available (minus fee)

---

### List All Withdrawals
```bash
curl http://localhost:5000/api/admin/withdrawals?status=rejected&type=roi&page=1 \
  -H "Authorization: Bearer TOKEN"
```

---

### Get Withdrawal Details
```bash
curl http://localhost:5000/api/admin/withdrawals/{id} \
  -H "Authorization: Bearer TOKEN"
```

---

## 📊 Status Flow

```
    REQUEST
       ↓
    PENDING
    /     \
REJECT   ACCEPT
  ↓         ↓
REJECTED  COMPLETED
  ↓
MOVE_TO_AVAILABLE
```

---

## 💰 Balance Changes

### Reject Workflow
```
Before: locked=$0, available=$5,000
After:  locked=$1,000, available=$5,000
```

### Move to Available (5% fee)
```
Amount: $1,000
Fee: 5% = $50
Net: $950

Before: locked=$1,000, available=$5,000
After:  locked=$0, available=$5,950
```

### Accept Directly (2% fee)
```
Amount: $500
Fee: 2% = $10
Net: $490

Before: locked=$500, available=$2,000
After:  locked=$0, available=$2,490
```

---

## 🎯 Workflow Scenarios

### Scenario 1: Reject, Then Move to Available
```
1. User requests $1,000 ROI withdrawal
   → Withdrawal status: pending
   → Amount location: lockedBalance
   
2. Admin clicks REJECT with reason "Needs docs"
   → Withdrawal status: rejected
   → Amount location: lockedBalance (unchanged)
   
3. Admin later clicks MOVE_TO_AVAILABLE with 5% fee
   → Withdrawal status: moved_to_available
   → Amount location: availableBalance (net $950)
   → Platform keeps: $50
```

### Scenario 2: Direct Accept
```
1. User requests $500 ROI withdrawal
   → Withdrawal status: pending
   → Amount location: lockedBalance
   
2. Admin clicks ACCEPT with 2% fee
   → Withdrawal status: completed
   → Amount location: availableBalance (net $490)
   → Platform keeps: $10
```

### Scenario 3: Reject, Then Accept Different Amount
```
1. User requests $1,000 ROI withdrawal
   → Status: pending, Amount: lockedBalance
   
2. Admin rejects for "Invalid wallet"
   → Status: rejected, Amount: lockedBalance
   
3. Later, user updates wallet and requests again
   → New withdrawal request for $1,000
   → Original withdrawal stays rejected
   → New withdrawal is pending
```

---

## ✅ Validation Rules

| Action | Requirement | Error |
|--------|-------------|-------|
| REJECT | Status must be `pending` | "Cannot reject withdrawal with status: X" |
| MOVE_TO_AVAILABLE | Status must be `rejected` | "Can only move rejected withdrawals" |
| MOVE_TO_AVAILABLE | Enough in `lockedBalance` | "Insufficient locked balance" |
| ACCEPT | Status must be `pending` | "Cannot accept withdrawal with status: X" |
| ACCEPT | Enough in `lockedBalance` (ROI) | "Insufficient locked balance" |

---

## 🔐 Required Headers

All requests must include:
```
Authorization: Bearer {ADMIN_JWT_TOKEN}
Content-Type: application/json
```

---

## 📋 Request/Response Templates

### Reject Request
```json
{
  "reason": "Optional rejection reason"
}
```

### Reject Response
```json
{
  "success": true,
  "message": "Withdrawal rejected...",
  "withdrawal": {
    "_id": "...",
    "amount": 1000,
    "status": "rejected",
    "type": "roi",
    "rejectionReason": "..."
  },
  "userBalance": {
    "lockedBalance": 1000,
    "availableBalance": 5000
  }
}
```

### Move/Accept Request
```json
{
  "feePercent": 5
}
```

### Move/Accept Response
```json
{
  "success": true,
  "message": "Action completed...",
  "withdrawal": {
    "_id": "...",
    "amount": 1000,
    "status": "moved_to_available|completed",
    "type": "roi",
    "feeApplied": 50,
    "amountAfterFee": 950
  },
  "userBalance": {
    "lockedBalance": 0,
    "availableBalance": 5950
  }
}
```

---

## 🐛 Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| "Withdrawal not found" | Check withdrawal ID is correct |
| "Invalid withdrawal status" | Ensure withdrawal is in correct status (check status flow) |
| "Insufficient locked balance" | Check user's current locked balance |
| "Admin authentication required" | Verify JWT token is valid |
| Fee calculation wrong | Remember: fee % is of total amount, not net |

---

## 📝 Audit Logging

Every action is logged with:
- **Admin ID** - Who performed the action
- **User ID** - Who was affected
- **Action Type** - withdrawal_rejected, withdrawal_moved_to_available, withdrawal_accepted
- **Details** - Full transaction details
- **Timestamp** - When it happened

View logs in MongoDB: `db.auditlogs.find({action: "withdrawal_*"})`

---

## 🔄 Fee Examples

### 5% Fee on $1,000
```
Total: $1,000
Fee (5%): $50
Net: $950
```

### 2% Fee on $500
```
Total: $500
Fee (2%): $10
Net: $490
```

### 0% Fee (No fee)
```
Total: $1,000
Fee (0%): $0
Net: $1,000
```

---

## 🎨 Status Badges

```
pending          🟡 Yellow  - Awaiting admin action
rejected         🔴 Red     - Rejected by admin
moved_to_available 🟠 Orange - Moved to available balance
completed        🟢 Green   - Successfully processed
failed           🔴 Red     - Failed to process
```

---

## 📱 API Endpoint Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/admin/withdrawals/:id/reject` | Reject pending withdrawal |
| POST | `/api/admin/withdrawals/:id/move-to-available` | Move rejected to available (with fee) |
| POST | `/api/admin/withdrawals/:id/accept` | Accept pending (with fee) |
| GET | `/api/admin/withdrawals/:id` | Get withdrawal details |
| GET | `/api/admin/withdrawals` | List withdrawals (with filters) |

---

## 🧮 Fee Calculation

```javascript
totalAmount = 1000;
feePercent = 5;
feeAmount = (totalAmount * feePercent) / 100;  // 50
amountAfterFee = totalAmount - feeAmount;      // 950

// Frontend formula:
fee = (amount * percent) / 100
netAmount = amount - fee
```

---

## 🚀 Deployment Checklist

- [ ] New file created: `server/routes/admin/withdrawalManagement.js`
- [ ] Routes registered in `server/routes/admin.js`
- [ ] All imports working (User, Withdrawal, Investment, AuditLog)
- [ ] authAdmin middleware applied to all endpoints
- [ ] Error handling tested
- [ ] Audit logs created successfully
- [ ] Balance calculations verified
- [ ] Database indexes exist
- [ ] Documentation updated

---

## 📞 Support

For issues or questions:
1. Check the full API docs: [WITHDRAWAL_MANAGEMENT_API.md]
2. Check frontend guide: [WITHDRAWAL_MANAGEMENT_FRONTEND_GUIDE.md]
3. Review error messages carefully
4. Check audit logs for transaction history
5. Verify user balance fields in database

---

## Version Info

- **Created:** 2024
- **Status:** Production Ready
- **Last Updated:** 2024
- **Files:** 
  - `server/routes/admin/withdrawalManagement.js` (410 lines)
  - `server/routes/admin.js` (modified)
  - Documentation files
=======
# Withdrawal Management System - Quick Reference

## ⚡ Quick Start

### Reject a Withdrawal
```bash
curl -X POST http://localhost:5000/api/admin/withdrawals/{id}/reject \
  -H "Authorization: Bearer TOKEN" \
  -d '{"reason": "Reason here"}'
```
**Effect:** Status → `rejected`, Amount stays in `lockedBalance`

---

### Move to Available (with fee)
```bash
curl -X POST http://localhost:5000/api/admin/withdrawals/{id}/move-to-available \
  -H "Authorization: Bearer TOKEN" \
  -d '{"feePercent": 5}'
```
**Effect:** Status → `moved_to_available`, Amount: locked → available (minus fee)

---

### Accept Pending (with fee)
```bash
curl -X POST http://localhost:5000/api/admin/withdrawals/{id}/accept \
  -H "Authorization: Bearer TOKEN" \
  -d '{"feePercent": 2}'
```
**Effect:** Status → `completed`, Amount: locked → available (minus fee)

---

### List All Withdrawals
```bash
curl http://localhost:5000/api/admin/withdrawals?status=rejected&type=roi&page=1 \
  -H "Authorization: Bearer TOKEN"
```

---

### Get Withdrawal Details
```bash
curl http://localhost:5000/api/admin/withdrawals/{id} \
  -H "Authorization: Bearer TOKEN"
```

---

## 📊 Status Flow

```
    REQUEST
       ↓
    PENDING
    /     \
REJECT   ACCEPT
  ↓         ↓
REJECTED  COMPLETED
  ↓
MOVE_TO_AVAILABLE
```

---

## 💰 Balance Changes

### Reject Workflow
```
Before: locked=$0, available=$5,000
After:  locked=$1,000, available=$5,000
```

### Move to Available (5% fee)
```
Amount: $1,000
Fee: 5% = $50
Net: $950

Before: locked=$1,000, available=$5,000
After:  locked=$0, available=$5,950
```

### Accept Directly (2% fee)
```
Amount: $500
Fee: 2% = $10
Net: $490

Before: locked=$500, available=$2,000
After:  locked=$0, available=$2,490
```

---

## 🎯 Workflow Scenarios

### Scenario 1: Reject, Then Move to Available
```
1. User requests $1,000 ROI withdrawal
   → Withdrawal status: pending
   → Amount location: lockedBalance
   
2. Admin clicks REJECT with reason "Needs docs"
   → Withdrawal status: rejected
   → Amount location: lockedBalance (unchanged)
   
3. Admin later clicks MOVE_TO_AVAILABLE with 5% fee
   → Withdrawal status: moved_to_available
   → Amount location: availableBalance (net $950)
   → Platform keeps: $50
```

### Scenario 2: Direct Accept
```
1. User requests $500 ROI withdrawal
   → Withdrawal status: pending
   → Amount location: lockedBalance
   
2. Admin clicks ACCEPT with 2% fee
   → Withdrawal status: completed
   → Amount location: availableBalance (net $490)
   → Platform keeps: $10
```

### Scenario 3: Reject, Then Accept Different Amount
```
1. User requests $1,000 ROI withdrawal
   → Status: pending, Amount: lockedBalance
   
2. Admin rejects for "Invalid wallet"
   → Status: rejected, Amount: lockedBalance
   
3. Later, user updates wallet and requests again
   → New withdrawal request for $1,000
   → Original withdrawal stays rejected
   → New withdrawal is pending
```

---

## ✅ Validation Rules

| Action | Requirement | Error |
|--------|-------------|-------|
| REJECT | Status must be `pending` | "Cannot reject withdrawal with status: X" |
| MOVE_TO_AVAILABLE | Status must be `rejected` | "Can only move rejected withdrawals" |
| MOVE_TO_AVAILABLE | Enough in `lockedBalance` | "Insufficient locked balance" |
| ACCEPT | Status must be `pending` | "Cannot accept withdrawal with status: X" |
| ACCEPT | Enough in `lockedBalance` (ROI) | "Insufficient locked balance" |

---

## 🔐 Required Headers

All requests must include:
```
Authorization: Bearer {ADMIN_JWT_TOKEN}
Content-Type: application/json
```

---

## 📋 Request/Response Templates

### Reject Request
```json
{
  "reason": "Optional rejection reason"
}
```

### Reject Response
```json
{
  "success": true,
  "message": "Withdrawal rejected...",
  "withdrawal": {
    "_id": "...",
    "amount": 1000,
    "status": "rejected",
    "type": "roi",
    "rejectionReason": "..."
  },
  "userBalance": {
    "lockedBalance": 1000,
    "availableBalance": 5000
  }
}
```

### Move/Accept Request
```json
{
  "feePercent": 5
}
```

### Move/Accept Response
```json
{
  "success": true,
  "message": "Action completed...",
  "withdrawal": {
    "_id": "...",
    "amount": 1000,
    "status": "moved_to_available|completed",
    "type": "roi",
    "feeApplied": 50,
    "amountAfterFee": 950
  },
  "userBalance": {
    "lockedBalance": 0,
    "availableBalance": 5950
  }
}
```

---

## 🐛 Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| "Withdrawal not found" | Check withdrawal ID is correct |
| "Invalid withdrawal status" | Ensure withdrawal is in correct status (check status flow) |
| "Insufficient locked balance" | Check user's current locked balance |
| "Admin authentication required" | Verify JWT token is valid |
| Fee calculation wrong | Remember: fee % is of total amount, not net |

---

## 📝 Audit Logging

Every action is logged with:
- **Admin ID** - Who performed the action
- **User ID** - Who was affected
- **Action Type** - withdrawal_rejected, withdrawal_moved_to_available, withdrawal_accepted
- **Details** - Full transaction details
- **Timestamp** - When it happened

View logs in MongoDB: `db.auditlogs.find({action: "withdrawal_*"})`

---

## 🔄 Fee Examples

### 5% Fee on $1,000
```
Total: $1,000
Fee (5%): $50
Net: $950
```

### 2% Fee on $500
```
Total: $500
Fee (2%): $10
Net: $490
```

### 0% Fee (No fee)
```
Total: $1,000
Fee (0%): $0
Net: $1,000
```

---

## 🎨 Status Badges

```
pending          🟡 Yellow  - Awaiting admin action
rejected         🔴 Red     - Rejected by admin
moved_to_available 🟠 Orange - Moved to available balance
completed        🟢 Green   - Successfully processed
failed           🔴 Red     - Failed to process
```

---

## 📱 API Endpoint Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/admin/withdrawals/:id/reject` | Reject pending withdrawal |
| POST | `/api/admin/withdrawals/:id/move-to-available` | Move rejected to available (with fee) |
| POST | `/api/admin/withdrawals/:id/accept` | Accept pending (with fee) |
| GET | `/api/admin/withdrawals/:id` | Get withdrawal details |
| GET | `/api/admin/withdrawals` | List withdrawals (with filters) |

---

## 🧮 Fee Calculation

```javascript
totalAmount = 1000;
feePercent = 5;
feeAmount = (totalAmount * feePercent) / 100;  // 50
amountAfterFee = totalAmount - feeAmount;      // 950

// Frontend formula:
fee = (amount * percent) / 100
netAmount = amount - fee
```

---

## 🚀 Deployment Checklist

- [ ] New file created: `server/routes/admin/withdrawalManagement.js`
- [ ] Routes registered in `server/routes/admin.js`
- [ ] All imports working (User, Withdrawal, Investment, AuditLog)
- [ ] authAdmin middleware applied to all endpoints
- [ ] Error handling tested
- [ ] Audit logs created successfully
- [ ] Balance calculations verified
- [ ] Database indexes exist
- [ ] Documentation updated

---

## 📞 Support

For issues or questions:
1. Check the full API docs: [WITHDRAWAL_MANAGEMENT_API.md]
2. Check frontend guide: [WITHDRAWAL_MANAGEMENT_FRONTEND_GUIDE.md]
3. Review error messages carefully
4. Check audit logs for transaction history
5. Verify user balance fields in database

---

## Version Info

- **Created:** 2024
- **Status:** Production Ready
- **Last Updated:** 2024
- **Files:** 
  - `server/routes/admin/withdrawalManagement.js` (410 lines)
  - `server/routes/admin.js` (modified)
  - Documentation files
>>>>>>> d9aeb3e (Improve admin panel mobile responsiveness)
