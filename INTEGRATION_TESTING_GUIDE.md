# Integration & Testing Guide

## 🚀 Getting Started

This guide will help you integrate and test the ROI Withdrawal Management system.

---

## 1. Verify Installation

### Check Files Exist
```bash
# Navigate to your project
cd c:\Users\USER\Desktop\luxyield-main

# Verify new file exists
ls server/routes/admin/withdrawalManagement.js

# Should output: withdrawalManagement.js
```

### Check admin.js Registration
```bash
grep -n "withdrawalManagement" server/routes/admin.js

# Should output line with: router.use('/withdrawals', require('./admin/withdrawalManagement'));
```

---

## 2. Start Your Server

```bash
# Install dependencies (if not already done)
npm install

# Start the server
npm start

# Or with nodemon for development
npm run dev
```

Check for errors in console. Server should start without issues.

---

## 3. Test Basic Endpoints

### Using cURL (Command Line)

#### Get Admin Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "adminpassword"}'

# Save the token from response
TOKEN="your_jwt_token_here"
```

#### List Withdrawals
```bash
TOKEN="your_token_here"

curl http://localhost:5000/api/admin/withdrawals \
  -H "Authorization: Bearer $TOKEN"

# Should return list of withdrawals
```

#### Get Single Withdrawal
```bash
WITHDRAWAL_ID="some_withdrawal_id"
TOKEN="your_token_here"

curl http://localhost:5000/api/admin/withdrawals/$WITHDRAWAL_ID \
  -H "Authorization: Bearer $TOKEN"

# Should return withdrawal details
```

---

## 4. Test Rejection Flow

### Step 1: Create Test Withdrawal

First, create a withdrawal request as a user:

```javascript
// As a user, create withdrawal request
const withdrawalRequest = {
  amount: 1000,
  currency: "USDT",
  network: "ERC20",
  address: "0x742d35Cc6634C0532925a3b844Bc2e0c63DD45e9",
  pin: "123456"
};

// POST /api/withdrawal
// This creates a withdrawal with status: "pending"
```

### Step 2: Reject the Withdrawal

```bash
WITHDRAWAL_ID="withdrawal_id_from_above"
TOKEN="admin_token"

curl -X POST http://localhost:5000/api/admin/withdrawals/$WITHDRAWAL_ID/reject \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Insufficient documentation"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Withdrawal rejected. Amount remains in user's locked balance.",
  "withdrawal": {
    "_id": "...",
    "amount": 1000,
    "status": "rejected",
    "type": "roi",
    "rejectionReason": "Insufficient documentation"
  },
  "userBalance": {
    "lockedBalance": 1000,
    "availableBalance": 5000
  }
}
```

### Verify in Database

```javascript
// Connect to MongoDB
use luxyield_db;  // or your database name

// Check withdrawal status
db.withdrawals.findOne({_id: ObjectId("withdrawal_id")})

// Should show:
// status: "rejected"
// rejectionReason: "Insufficient documentation"

// Check user balance
db.users.findOne({_id: ObjectId("user_id")})

// Should show:
// lockedBalance: 1000
// availableBalance: 5000
```

---

## 5. Test Move to Available

### Step 1: Move Rejected Withdrawal to Available

```bash
WITHDRAWAL_ID="rejection_withdrawal_id"
TOKEN="admin_token"

curl -X POST http://localhost:5000/api/admin/withdrawals/$WITHDRAWAL_ID/move-to-available \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "feePercent": 5
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Withdrawal moved to available balance! Fee applied: $50.00, Net amount added: $950.00",
  "withdrawal": {
    "_id": "...",
    "amount": 1000,
    "status": "moved_to_available",
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

### Verify Calculations

```
Original Amount: $1,000
Fee Percent: 5%
Fee Amount: $1,000 × 5% = $50
Net Amount: $1,000 - $50 = $950

User's lockedBalance: $1,000 → $0
User's availableBalance: $5,000 → $5,950
```

✅ $5,000 + $950 = $5,950 ✓
✅ Fee of $50 deducted ✓

---

## 6. Test Direct Accept

### Step 1: Create Another Withdrawal

Create a new withdrawal request (follows same process as test withdrawal).

### Step 2: Accept it Directly

```bash
WITHDRAWAL_ID="pending_withdrawal_id"
TOKEN="admin_token"

curl -X POST http://localhost:5000/api/admin/withdrawals/$WITHDRAWAL_ID/accept \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "feePercent": 2
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Withdrawal accepted! Fee: $10.00, Amount moved to available: $490.00",
  "withdrawal": {
    "_id": "...",
    "amount": 500,
    "status": "completed",
    "type": "roi",
    "feeApplied": 10,
    "amountAfterFee": 490
  },
  "userBalance": {
    "lockedBalance": 0,
    "availableBalance": 6440
  }
}
```

---

## 7. Test Filtering & Pagination

### List by Status

```bash
TOKEN="admin_token"

# Get all rejected withdrawals
curl "http://localhost:5000/api/admin/withdrawals?status=rejected" \
  -H "Authorization: Bearer $TOKEN"

# Get all completed withdrawals
curl "http://localhost:5000/api/admin/withdrawals?status=completed" \
  -H "Authorization: Bearer $TOKEN"
```

### List by Type

```bash
# Get all ROI withdrawals
curl "http://localhost:5000/api/admin/withdrawals?type=roi" \
  -H "Authorization: Bearer $TOKEN"

# Get all regular withdrawals
curl "http://localhost:5000/api/admin/withdrawals?type=regular" \
  -H "Authorization: Bearer $TOKEN"
```

### Pagination

```bash
# Get page 2, 10 items per page
curl "http://localhost:5000/api/admin/withdrawals?page=2&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Response includes pagination info:
# {
#   "pagination": {
#     "page": 2,
#     "limit": 10,
#     "total": 25,
#     "pages": 3
#   }
# }
```

---

## 8. Error Testing

### Error 1: Reject Non-Pending Withdrawal

```bash
# Try to reject a withdrawal that's already rejected
curl -X POST http://localhost:5000/api/admin/withdrawals/$COMPLETED_ID/reject \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "test"}'

# Expected Error:
# {
#   "success": false,
#   "error": "Cannot reject withdrawal with status: completed. Only pending withdrawals can be rejected."
# }
```

### Error 2: Move Non-Rejected Withdrawal

```bash
# Try to move a pending withdrawal (not rejected yet)
curl -X POST http://localhost:5000/api/admin/withdrawals/$PENDING_ID/move-to-available \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"feePercent": 5}'

# Expected Error:
# {
#   "success": false,
#   "error": "Can only move rejected withdrawals. Current status: pending"
# }
```

### Error 3: Insufficient Locked Balance

```bash
# Try to move when user doesn't have enough in locked balance
curl -X POST http://localhost:5000/api/admin/withdrawals/$ID/move-to-available \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"feePercent": 5}'

# Expected Error:
# {
#   "success": false,
#   "error": "Insufficient locked balance. Required: $2000, Available: $500"
# }
```

### Error 4: Unauthorized (No Admin Token)

```bash
# Call without authorization header
curl http://localhost:5000/api/admin/withdrawals

# Expected: 401 Unauthorized
```

---

## 9. Audit Log Verification

### Check Audit Logs

```javascript
// In MongoDB
db.auditlogs.find({
  action: {
    $in: ["withdrawal_rejected", "withdrawal_moved_to_available", "withdrawal_accepted"]
  }
}).pretty()

// Should show entries like:
{
  "_id": ObjectId(...),
  "userId": ObjectId(...),
  "adminId": ObjectId(...),
  "action": "withdrawal_rejected",
  "details": {
    "withdrawalId": ObjectId(...),
    "amount": 1000,
    "reason": "Insufficient documentation",
    "lockedBalance": 1000
  },
  "createdAt": ISODate("2024-01-15T11:00:00Z")
}
```

---

## 10. Integration Testing Checklist

### Basic Functionality
- [ ] Reject endpoint accessible and working
- [ ] Move-to-available endpoint accessible
- [ ] Accept endpoint accessible
- [ ] Get details endpoint working
- [ ] List endpoint working

### Balance Operations
- [ ] Locked balance updates on reject
- [ ] Available balance updates on move-to-available
- [ ] Fee calculations correct
- [ ] User balances consistent

### Status Transitions
- [ ] pending → rejected ✓
- [ ] rejected → moved_to_available ✓
- [ ] pending → completed ✓
- [ ] Invalid transitions rejected ✓

### Error Handling
- [ ] Invalid status transitions blocked
- [ ] Insufficient balance errors shown
- [ ] Withdrawal not found errors shown
- [ ] Unauthorized access blocked

### Audit Logging
- [ ] Rejection logged
- [ ] Move-to-available logged
- [ ] Acceptance logged
- [ ] Details captured correctly

### Filtering
- [ ] Filter by status works
- [ ] Filter by type works
- [ ] Pagination works
- [ ] Combined filters work

---

## 11. Performance Testing

### Load Test

```bash
# Test with many withdrawals
for i in {1..100}; do
  curl "http://localhost:5000/api/admin/withdrawals?page=1&limit=20" \
    -H "Authorization: Bearer $TOKEN"
done

# Should complete quickly without errors
```

---

## 12. Frontend Integration Test

### Test with Postman

1. Import endpoints into Postman
2. Create collection with all withdrawal endpoints
3. Set environment variables (TOKEN, WITHDRAWAL_ID, etc.)
4. Test each endpoint
5. Verify request/response format
6. Check error handling

### Test with Frontend App

1. Integrate withdrawal list into admin dashboard
2. Add reject button with modal
3. Add move-to-available button with fee input
4. Add accept button with fee input
5. Test balance updates
6. Test list refresh
7. Test error handling

---

## 13. Production Checklist

Before deploying to production:

- [ ] All endpoints tested locally
- [ ] Error handling verified
- [ ] Balance calculations verified
- [ ] Audit logs working
- [ ] JWT authentication working
- [ ] Database indexes present
- [ ] No console.log statements causing issues
- [ ] All imports working
- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] API keys configured
- [ ] Database connection working
- [ ] CORS configured properly
- [ ] Rate limiting considered

---

## 14. Troubleshooting

### Issue: Routes not found (404)

**Solution:**
```bash
# Check routes are registered in admin.js
grep -n "withdrawalManagement" server/routes/admin.js

# Ensure the file exists
ls server/routes/admin/withdrawalManagement.js

# Check server restarted after changes
# Restart: npm start
```

### Issue: Authentication errors

**Solution:**
```bash
# Verify token is valid
# Get new token from login endpoint
# Include in Authorization header as: "Bearer TOKEN"

# Check admin role is set
db.users.findOne({_id: ObjectId("admin_id")})
# Should have: role: "admin"
```

### Issue: Balance not updating

**Solution:**
```bash
# Check user exists
db.users.findOne({_id: ObjectId("user_id")})

# Check withdrawal exists
db.withdrawals.findOne({_id: ObjectId("withdrawal_id")})

# Verify status is correct for operation
# pending → can reject or accept
# rejected → can move-to-available
# completed/moved_to_available → view only
```

### Issue: Fees not calculated correctly

**Solution:**
```javascript
// Verify formula:
feeAmount = (totalAmount * feePercent) / 100
amountAfterFee = totalAmount - feeAmount

// Example:
// Total: 1000, Fee: 5%
// Fee: (1000 * 5) / 100 = 50
// After: 1000 - 50 = 950 ✓
```

---

## 📞 Support

For issues:
1. Check server logs for errors
2. Verify database connection
3. Check user balance in MongoDB
4. Review audit logs
5. Verify API endpoints are accessible
6. Test with valid withdrawal IDs
7. Ensure admin token is valid

---

## ✅ Ready for Testing

Your system is now ready to test! Start with the basic endpoint tests and work through all scenarios.

**Good luck! 🚀**
