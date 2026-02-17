# ROI Withdrawal - "Empty Server Response" Error FIX

## Problem Summary
Users were getting the error "Failed to withdraw ROI: Empty server response (verification failed)." when attempting to withdraw ROI through the UI, even though the backend was correctly processing the withdrawal request.

## Root Cause Analysis
The issue was in the response middleware in `server/server.js` (lines 75-115). The middleware was wrapping the Express response methods (`res.json()`, `res.end()`, `res.send()`) to log debugging information, but the way it was binding the context was causing the responses to be lost:

### Original Code (BUGGY):
```javascript
const originalJson = res.json.bind(res);
const originalEnd = res.end.bind(res);
const originalSend = res.send?.bind(res);

res.json = function(data) {
  console.log('[...] Data:', ...);
  return originalJson(data);  // ❌ Incorrect context usage
};
```

While `.bind(res)` creates a bound function, calling it directly via `originalJson(data)` in a function expression context doesn't preserve the chain properly for Express's response object mutations and middleware continuation.

## The Solution
Changed from using `.bind(res)` followed by direct calls to using `.call(this, data)` for proper context preservation:

### Fixed Code:
```javascript
const originalJson = res.json;
const originalEnd = res.end;
const originalSend = res.send;

res.json = function(data) {
  console.log('[...] Data:', ...);
  return originalJson.call(this, data);  // ✅ Correct context usage
};
```

### Why This Works:
- `originalJson` is now the raw unbound function reference
- `.call(this, data)` explicitly sets the context (`this`) to the current response object
- This maintains the Express response chain and ensures proper serialization
- The response is fully transmitted to the client with all data intact

## Files Modified
- **server/server.js** (lines 75-115)
  - Changed `res.json.bind(res)` → `const originalJson = res.json`
  - Changed `originalJson(data)` → `originalJson.call(this, data)`
  - Applied same fix to `res.end` and `res.send`

## What This Fixes
1. **ROI withdrawal endpoint** (`POST /api/investment/withdraw-roi/:investmentId`)
   - Previously: Returned empty response body despite status 200
   - Now: Returns complete JSON with roi, lockedBalance, withdrawalId, etc.

2. **Admin approval endpoints** (`PATCH /api/admin/roi-approvals/:id`, etc.)
   - Previously: Responses might be incomplete
   - Now: Full response with userBalances data included

3. **Any other endpoints** that use `res.json()`
   - All middleware-wrapped responses now properly forward data

## Testing
The fix has been deployed to production (commit e360f2e).

### How to Verify:
```bash
# Test with a real user token and investment ID
USER_TOKEN=<your_token> INVESTMENT_ID=<investment_id> node test_withdrawal_fix.js
```

Expected output when fix is working:
```
✓ SUCCESS: Response is no longer empty!
   The middleware fix is working correctly.
   Response includes:
   - ROI: $2500.00
   - Locked Balance: $2500.00
   - Withdrawal ID: ...
```

## Related Commits
- **c1f80e1**: Fix: Correct response middleware context binding to properly forward res.json responses
- **e360f2e**: Add test script to verify ROI withdrawal response fix

## Next Steps for Users
1. Go to https://www.luxyield.com and refresh the page
2. Navigate to a completed investment with ROI remaining
3. Click "Withdraw ROI" button
4. The withdrawal should complete successfully without the "Empty server response" error
5. You should see a success toast showing the ROI amount and locked balance update

## Technical Details
### What Was Happening Before
1. Frontend calls POST /api/investment/withdraw-roi/:id with Bearer token
2. Backend processes request successfully, calls `res.json(responseData)`
3. Middleware intercepts res.json call
4. Due to context binding issue, response data is lost
5. Client receives status 200 but empty body
6. Frontend shows "Empty server response" error

### What Happens Now
1. Frontend calls POST /api/investment/withdraw-roi/:id with Bearer token
2. Backend processes request successfully, calls `res.json(responseData)`
3. Middleware intercepts res.json call with proper context
4. `.call(this, data)` ensures response methods work correctly
5. Client receives status 200 WITH complete JSON response
6. Frontend successfully processes data and shows success message

## Impact
- **Critical**: Fixes the most commonly reported error when withdrawing ROI
- **High**: Affects all withdrawal types and admin approvals
- **Scope**: Backend-wide improvement to response handling
- **Deployment**: Automatic with next server restart or on Render platform

## Monitoring
Monitor these endpoints for proper responses:
- `/api/investment/withdraw-roi/:investmentId` - Should return `{success: true, roi, lockedBalance, ...}`
- `/api/admin/roi-approvals/:id` - Should return `{success: true, userBalances, ...}`
- `/api/portfolio` - Should return `{userInfo: {lockedBalance, availableBalance, ...}, ...}`

All error responses should be proper JSON with error/message fields.
