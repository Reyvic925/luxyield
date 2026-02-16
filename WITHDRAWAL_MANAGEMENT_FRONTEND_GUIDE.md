# Admin Withdrawal Management - Frontend Implementation Guide

## UI Workflow Overview

The admin dashboard should show withdrawal requests with action buttons based on status:

```
PENDING WITHDRAWAL
├─ [REJECT] Button → Opens rejection dialog
│   └─ Admin enters reason
│       └─ Amount stays in user's locked balance
│
└─ [ACCEPT] Button → Opens acceptance dialog
    ├─ Admin sets fee percentage
    └─ Amount moves to available balance
```

```
REJECTED WITHDRAWAL
└─ [MOVE TO AVAILABLE] Button → Opens dialog
    ├─ Admin sets fee percentage
    └─ Amount transfers from locked to available
```

```
MOVED_TO_AVAILABLE / COMPLETED
└─ [VIEW DETAILS] Button → Shows transaction details
```

---

## Admin Dashboard Components

### 1. Withdrawals List View

**Show these columns:**
| User | Amount | Status | Type | Created | Actions |
|------|--------|--------|------|---------|---------|
| john@example.com | $1,000 | pending | ROI | Jan 15 | [REJECT] [ACCEPT] |
| jane@example.com | $500 | rejected | ROI | Jan 14 | [MOVE TO AVAILABLE] [VIEW] |
| bob@example.com | $2,000 | completed | ROI | Jan 13 | [VIEW] |

**Filter Options:**
- By Status: All, Pending, Rejected, Moved to Available, Completed, Failed
- By Type: All, ROI, Regular
- Search by user email/name

---

## Modal/Dialog Templates

### 2. REJECT Withdrawal Dialog

```
┌─────────────────────────────────────┐
│ REJECT WITHDRAWAL                   │
├─────────────────────────────────────┤
│                                     │
│ User: John Doe (john@example.com)  │
│ Amount: $1,000.00                  │
│ Type: ROI Withdrawal                │
│                                     │
│ Rejection Reason (Optional):        │
│ ┌─────────────────────────────────┐ │
│ │ [Insufficient documentation..]  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Note: Amount will stay in user's    │
│ locked balance ($5,000)             │
│                                     │
│           [CANCEL]  [REJECT]        │
└─────────────────────────────────────┘
```

**API Call:**
```javascript
fetch('/api/admin/withdrawals/{withdrawalId}/reject', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reason: 'Insufficient documentation'
  })
})
.then(r => r.json())
.then(data => {
  if (data.success) {
    // Show success: "Withdrawal rejected. Amount: $1,000 remains in locked balance"
    // Refresh withdrawal list
  }
})
```

---

### 3. ACCEPT Withdrawal Dialog

```
┌─────────────────────────────────────┐
│ ACCEPT WITHDRAWAL                   │
├─────────────────────────────────────┤
│                                     │
│ User: John Doe (john@example.com)  │
│ Amount: $1,000.00                  │
│ Type: ROI Withdrawal                │
│                                     │
│ Withdrawal Amount: $1,000.00        │
│ Fee Percentage (%):                 │
│ ┌─────────────────────────────────┐ │
│ │ [2]%                            │ │
│ └─────────────────────────────────┘ │
│ Fee Amount: $20.00                  │
│ Amount to Available: $980.00        │
│                                     │
│ User will receive: $980.00          │
│ Platform fee: $20.00                │
│                                     │
│ Current Balances:                   │
│ Locked: $0  → $0                    │
│ Available: $2,000  → $2,980         │
│                                     │
│           [CANCEL]  [ACCEPT]        │
└─────────────────────────────────────┘
```

**API Call:**
```javascript
fetch('/api/admin/withdrawals/{withdrawalId}/accept', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    feePercent: 2
  })
})
.then(r => r.json())
.then(data => {
  if (data.success) {
    // Show success: "Withdrawal accepted! Fee: $20.00, Amount moved: $980.00"
    // Update user balances
    // Refresh withdrawal list
  }
})
```

---

### 4. MOVE TO AVAILABLE Dialog (for Rejected)

```
┌─────────────────────────────────────┐
│ MOVE TO AVAILABLE BALANCE           │
├─────────────────────────────────────┤
│                                     │
│ User: Jane Doe (jane@example.com)  │
│ Amount: $500.00                    │
│ Status: REJECTED                    │
│ Reason: Insufficient documentation │
│                                     │
│ Locked Balance: $500                │
│ Available Balance: $1,500           │
│                                     │
│ Fee Percentage (%):                 │
│ ┌─────────────────────────────────┐ │
│ │ [5]%                            │ │
│ └─────────────────────────────────┘ │
│ Fee Amount: $25.00                  │
│ Amount to Transfer: $475.00         │
│                                     │
│ After Transfer:                     │
│ Locked: $500  → $0                  │
│ Available: $1,500  → $1,975         │
│                                     │
│    [CANCEL]  [MOVE TO AVAILABLE]    │
└─────────────────────────────────────┘
```

**API Call:**
```javascript
fetch('/api/admin/withdrawals/{withdrawalId}/move-to-available', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    feePercent: 5
  })
})
.then(r => r.json())
.then(data => {
  if (data.success) {
    // Show success: "Moved to available! Fee: $25, Net amount: $475"
    // Update user balances
    // Refresh withdrawal list
  }
})
```

---

### 5. Withdrawal Details View

```
┌────────────────────────────────────────┐
│ WITHDRAWAL DETAILS                     │
├────────────────────────────────────────┤
│                                        │
│ Status: MOVED_TO_AVAILABLE             │
│ Type: ROI                              │
│ Created: Jan 15, 2024 10:30 AM        │
│ Processed: Jan 15, 2024 11:00 AM      │
│                                        │
│ User Information:                      │
│ Name: John Doe                         │
│ Email: john@example.com                │
│ Current Balances:                      │
│   Locked: $0                           │
│   Available: $950.00                   │
│                                        │
│ Withdrawal Details:                    │
│ Amount Requested: $1,000.00            │
│ Fee Applied: $50.00 (5%)               │
│ Amount Transferred: $950.00            │
│                                        │
│ Wallet Details:                        │
│ Network: ERC20                         │
│ Address: 0x742d35Cc6634C0532925...   │
│ Currency: USDT                         │
│                                        │
│ Admin Notes:                           │
│ Reason: Insufficient documentation    │
│                                        │
│                              [CLOSE]   │
└────────────────────────────────────────┘
```

**API Call:**
```javascript
fetch('/api/admin/withdrawals/{withdrawalId}', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
})
.then(r => r.json())
.then(data => {
  if (data.success) {
    displayWithdrawalDetails(data.withdrawal);
  }
})
```

---

## Status Badge Colors

Use these colors in the UI:

| Status | Color | Icon |
|--------|-------|------|
| pending | 🟡 Yellow | ⏳ |
| rejected | 🔴 Red | ❌ |
| moved_to_available | 🟠 Orange | ↗️ |
| completed | 🟢 Green | ✅ |
| failed | 🔴 Red | ⚠️ |

---

## Loading & Filter List

**List Withdrawals API Call:**
```javascript
const fetchWithdrawals = async (status = '', type = '', page = 1) => {
  const params = new URLSearchParams({
    status: status,
    type: type,
    page: page,
    limit: 20
  });
  
  fetch(`/api/admin/withdrawals?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      displayWithdrawals(data.withdrawals);
      displayPagination(data.pagination);
    }
  })
}
```

---

## Response Handling

### Success Response
```javascript
{
  "success": true,
  "message": "Action completed successfully",
  "withdrawal": { /* updated withdrawal object */ },
  "userBalance": {
    "lockedBalance": 0,
    "availableBalance": 950
  }
}
```

### Error Response
```javascript
{
  "success": false,
  "error": "Withdrawal not found" // or other error message
}
```

---

## Recommended UX Features

1. **Confirmation Dialog** - Confirm action before processing
2. **Success Toast** - Show success message with action details
3. **Error Toast** - Show error message in red
4. **Loading State** - Show spinner while processing
5. **Balance Update** - Refresh user balances after action
6. **List Refresh** - Refresh withdrawal list after action
7. **Audit Trail Link** - Link to view audit logs for the user
8. **Search & Filter** - Easy filtering by status, type, date
9. **Export** - Option to export withdrawal data to CSV
10. **Bulk Actions** - Apply same action to multiple withdrawals

---

## Example React Component

```jsx
const WithdrawalActions = ({ withdrawal, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [feePercent, setFeePercent] = useState(0);

  const handleReject = async (reason) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawal._id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Withdrawal rejected successfully');
        onRefresh();
      } else {
        toast.error(data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToAvailable = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawal._id}/move-to-available`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ feePercent })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Moved to available! Fee: $${data.withdrawal.feeApplied}`);
        onRefresh();
      } else {
        toast.error(data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {withdrawal.status === 'pending' && (
        <>
          <button onClick={() => handleReject('Admin decision')} disabled={loading}>
            {loading ? 'Processing...' : 'Reject'}
          </button>
          <button onClick={() => setShowModal(true)} disabled={loading}>
            {loading ? 'Processing...' : 'Accept'}
          </button>
        </>
      )}
      
      {withdrawal.status === 'rejected' && (
        <button onClick={handleMoveToAvailable} disabled={loading}>
          {loading ? 'Processing...' : 'Move to Available'}
        </button>
      )}
      
      {/* Modal content */}
    </>
  );
};
```

---

## Testing Checklist for Frontend

- [ ] List shows pending withdrawals
- [ ] Can filter by status
- [ ] Can filter by type
- [ ] Reject button opens modal
- [ ] Rejection works and refreshes list
- [ ] Accept button opens modal with fee input
- [ ] Accept works and updates balances
- [ ] Move to available button works
- [ ] Fee calculations display correctly
- [ ] User balances update in real-time
- [ ] Error messages show correctly
- [ ] Loading states work
- [ ] View details shows all info
- [ ] Pagination works
