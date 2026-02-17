# ROI WITHDRAWAL SYSTEM - VISUAL FLOW

## Complete User Journey

```
╔════════════════════════════════════════════════════════════════════════════╗
║                           USER INVESTS $5,000                              ║
╚════════════════════════════════════════════════════════════════════════════╝

                    Investment Created
                    Status: ACTIVE
                    ┌─────────────────┐
                    │   Principal     │
                    │      $5,000     │
                    │   Current Value │
                    │      $5,000     │
                    └─────────────────┘
                           ↓
                    [ROI Cron Every 5 min]
                           ↓
                    ┌─────────────────┐
                    │   Principal     │
                    │      $5,000     │
                    │   Current Value │
                    │      $5,123 ✨  │ (ROI added to investment)
                    └─────────────────┘
                           ↓
                      [Days Pass...]
                           ↓
                    ┌─────────────────┐
                    │   Principal     │
                    │      $5,000     │
                    │   Current Value │
                    │      $5,750 ✨  │ (ROI accumulated)
                    └─────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
      Available    Locked             Investment
      Balance      Balance             Value
        $0           $0                 $5,750
                           │
                      [endDate passes]
                           ↓
╔════════════════════════════════════════════════════════════════════════════╗
║                   INVESTMENT AUTO-COMPLETES                                 ║
║                   Status: COMPLETED                                         ║
╚════════════════════════════════════════════════════════════════════════════╝

        CurrentValue ($5,750) moves to lockedBalance
                           ↓
           ┌───────────────┬───────────────┐
           │               │               │
      Available    Locked             Investment
      Balance      Balance             Value
        $0         $5,750               $0 (empty)
                    (LOCKED!)         Status: completed


┌─────────────────────────────────────────────────────────┐
│  USER SEES IN PORTFOLIO:                                │
│  ├─ Investment Status: COMPLETED ✓                      │
│  ├─ Available Balance: $0                               │
│  └─ Locked Balance: $5,750 (Awaiting Release)          │
└─────────────────────────────────────────────────────────┘

                           ↓
           ┌─────────────────────────────────────┐
           │  USER CLICKS: "WITHDRAW ROI"        │
           └─────────────────────────────────────┘
                           ↓

╔════════════════════════════════════════════════════════════════════════════╗
║                 WITHDRAWAL REQUEST CREATED                                 ║
║                 Type: ROI                                                  ║
║                 Status: PENDING                                            ║
║                 Amount: $750 (currentValue - principal)                    ║
╚════════════════════════════════════════════════════════════════════════════╝

           ┌───────────────┬───────────────┐
           │               │               │
      Available    Locked             Withdrawal
      Balance      Balance             Status
        $0         $5,750              PENDING
                    (STILL!)           (Awaiting
                                       Approval)

┌─────────────────────────────────────────────────────────┐
│  ADMIN SEES:                                            │
│  ├─ New ROI Withdrawal Request                         │
│  ├─ Amount: $750                                       │
│  ├─ User: user@example.com                            │
│  └─ Buttons: [Approve] [Reject]                       │
└─────────────────────────────────────────────────────────┘

                           ↓
           ┌─────────────────────────────────────┐
           │  ADMIN CLICKS: "APPROVE"            │
           └─────────────────────────────────────┘
                           ↓

╔════════════════════════════════════════════════════════════════════════════╗
║                 WITHDRAWAL APPROVED                                        ║
║                 Move: Locked → Available                                  ║
╚════════════════════════════════════════════════════════════════════════════╝

           ┌───────────────┬───────────────┐
           │               │               │
      Available    Locked             Withdrawal
      Balance      Balance             Status
        $750       $5,000              CONFIRMED ✓
        ↑          (Released)
    (Released!)
        
    NOW USER CAN WITHDRAW!

                           ↓
           ┌─────────────────────────────────────┐
           │  USER CLICKS: "WITHDRAW TO BTC"     │
           └─────────────────────────────────────┘
                           ↓

╔════════════════════════════════════════════════════════════════════════════╗
║              REGULAR WITHDRAWAL PROCESS                                   ║
║              From availableBalance to Crypto Wallet                       ║
╚════════════════════════════════════════════════════════════════════════════╝

           ┌───────────────┬───────────────┐
           │               │               │
      Available    Locked          Transaction
      Balance      Balance          Status
        $0         $5,000           COMPLETED ✓
      (Sent!)      (Unchanged)      (To BTC)

┌─────────────────────────────────────────────────────────┐
│  FINAL STATE:                                           │
│  ├─ BTC Wallet: +0.0001 BTC                            │
│  ├─ Available Balance: $0 ✓                            │
│  ├─ Locked Balance: $5,000                             │
│  └─ Withdrawal: COMPLETED ✓                            │
└─────────────────────────────────────────────────────────┘
```

---

## Admin Manual Release Alternative

```
╔════════════════════════════════════════════════════════════════════════════╗
║                   ADMIN MANUAL RELEASE (Optional)                          ║
║                                                                             ║
║  Sometimes admin wants to release funds WITHOUT going through              ║
║  the ROI withdrawal request process                                        ║
╚════════════════════════════════════════════════════════════════════════════╝

    Admin Dashboard
           ↓
    [Users] → Select User
           ↓
    [Release Locked Funds] button
           ↓
    ┌─────────────────────────┐
    │ Amount: [5750]          │
    │ Reason: Investment      │
    │         completed       │
    │ [Release]               │
    └─────────────────────────┘
           ↓

        API Call:
    POST /api/admin/users/:userId/release-locked-funds
    {
      amount: 5750,
      reason: "Investment matured"
    }
           ↓

    ┌───────────────┬───────────────┐
    │               │               │
Available       Locked          Status
Balance         Balance
  $5,750          $0          RELEASED ✓
  (Moved!)        (Empty!)

User now sees all $5,750 in availableBalance
and can withdraw to wallet immediately!
```

---

## Decision Tree - Admin Actions

```
                    COMPLETED INVESTMENT
                            │
                ┌───────────┴───────────┐
                │                       │
        [Manual Release]         [User Requests]
                │                  Withdrawal
                │                       │
                ↓                       ↓
    ┌─────────────────┐     ┌─────────────────┐
    │ Admin sees:     │     │ Admin sees:     │
    │ Release button  │     │ Pending ROI     │
    │ in portfolio    │     │ Withdrawal      │
    └────────┬────────┘     └────────┬────────┘
             │                       │
        [Click]              [Review Details]
             │                       │
             ↓                       ↓
    ┌─────────────────┐     ┌─────────────────┐
    │ Enter amount    │     │ Approve/Reject  │
    │ & reason        │     │ Can add fees     │
    └────────┬────────┘     └────────┬────────┘
             │                       │
        [Release]            [Approve/Reject]
             │                       │
             ↓                       ↓
    Locked → Available     Locked → Available
             OR                      OR
          [DONE]               Keep Locked
                                   [DONE]
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ROI SOURCES                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Daily Script (update_roi.js)    Cron Simulator (every 5min)
│         │                                    │              │
│         └────────────┬─────────────────────┘               │
│                      ↓                                     │
│            Calculates ROI for                              │
│            Active Investments                              │
│                      ↓                                     │
└──────────────────────┼──────────────────────────────────────┘
                       ↓
            ┌──────────────────────┐
            │  Investment Record   │
            │  currentValue +=     │
            │  ROI amount          │
            └──────────┬───────────┘
                       ↓
                       │
         ┌─────────────┴─────────────┐
         │                           │
    Investment            Investment Still
    Still Active          Active but...
         │                
         │           [5 minutes later]
         │                │
         └────────────────┴─────────────┐
                                         │
                        ┌────────────────┴──────────────┐
                        │                               │
                        ↓                               ↓
            Investment Still          Investment Reaches
            Active (< endDate)        Maturity (>= endDate)
                        │                               │
                        │                               │
            ROI stays in            AUTO COMPLETE:
            currentValue             • status = completed
                        │           • Move to lockedBalance
                        │                    │
                        │                    ↓
                        │            ┌──────────────────┐
                        │            │  User Model      │
                        │            │  lockedBalance   │
                        │            │  += currentValue │
                        │            └──────────────────┘
                        │                    │
                        │                    ↓
                        │            User sees in
                        │            Portfolio:
                        │            "Locked: $5,750"
                        │                    │
                        ↓                    ↓
         [Days Pass]        User Requests Withdrawal
                            │
                            ↓
                    Withdrawal Created
                    (type: 'roi', status: 'pending')
                            │
                            ↓
                    Admin Approves
                            │
                            ↓
            ┌───────────────────────────┐
            │  Move to availableBalance  │
            │  lockedBalance -= 750      │
            │  availableBalance += 750   │
            └───────────────┬───────────┘
                            ↓
            User Withdraws to Crypto
                            ↓
                    availableBalance -= 750
```

---

## Endpoint Sequence Diagram

```
┌────────┐                 ┌──────────┐              ┌────────┐
│  USER  │                 │ API/DB   │              │ ADMIN  │
└────┬───┘                 └────┬─────┘              └───┬────┘
     │                          │                       │
     │ 1. POST /api/withdraw-roi│                       │
     │ ────────────────────────>│                       │
     │                          │                       │
     │                   Generate ROI withdrawal        │
     │                   record with pending status     │
     │                          │                       │
     │<────────────────────────     status: pending ─── │ Notification
     │ 200 OK                   │                   ────┤
     │                          │                   GET /admin/
     │                          │                   roi-withdrawals
     │                          │                   |
     │                          │                   └──> View pending
     │                          │
     │                          │<─── POST /admin/roi-withdrawals/:id/accept
     │                          │
     │                   Move from locked to available
     │                   Update withdrawal status
     │                          │
     │<─── Notification:        │
     │ "ROI approved!" ◄────────┤ 
     │                          │
     │ 2. POST /api/withdrawal  │
     │ (currency, amount, etc)  │
     │ ────────────────────────>│
     │                          │
     │                   Deduct from availableBalance
     │                   Create withdrawal record
     │                   Convert to crypto
     │                          │
     │<───────────────────────     status: pending
     │ 200 OK                   │
     │                          │
     │ (Money sent to user's    │
     │  crypto wallet)          │

Time ↑
     │
     └────────────────────> (Usually 1-24 hours)
```

---

## State Machine

```
Investment State Flow:
    
    ACTIVE ─────────────┐
      │                 │ [endDate passes]
      │ [ROI Cron       │
      │  every 5min]    │
      │                 ↓
      │            COMPLETED
      │            (auto-triggered)
      │                 │
      └─────────────────┤ [roiWithdrawn = false]
         [Direct admin     │
          complete?]       │
                           └──> Stay COMPLETED
                                 forever


Withdrawal State Flow:

    PENDING ──────┐
       │          │ [Admin approves]
       │ [ROI      │
       │  added to │ ↓
       │  locked]  │ CONFIRMED
       │          │  (can now withdraw)
       │          │
       └──────────┤ [Admin rejects]
                  │
                  ↓
               REJECTED
               (ROI stays locked,
                can retry)


User Balance Flow:

Before Investment:
    availableBalance: 0
    lockedBalance: 0

After Investment:
    availableBalance: 0
    lockedBalance: 0 (still active)

After Investment Ends:
    availableBalance: 0
    lockedBalance: 5750 ← Auto-moved

After Admin Approves ROI Withdrawal:
    availableBalance: 750 ← Moved here
    lockedBalance: 5000

After User Withdraws to Wallet:
    availableBalance: 0
    lockedBalance: 5000
    (Money in crypto wallet now)
```

---

## File Changes Impact

```
┌──────────────────────────────────────────────────────────────────┐
│                    UPDATE_ROI.JS CHANGES                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ BEFORE:                    AFTER:                               │
│ ├─ Update active           ├─ Update active investments         │
│ │  investments only        │   (ROI stays in investment)        │
│ │  (credit to available)   │                                    │
│ │                          ├─ Auto-complete ended               │
│ │                          │  investments                       │
│ │                          │                                    │
│ │                          ├─ Move to lockedBalance             │
│ │                          │  when ended                        │
│ │                          │                                    │
│ └─ Missing logic for end   └─ Complete workflow                │
│    of investment              integrated                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────┐
│               ROICALCULATOR.JS CHANGES (Cron)                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ BEFORE:                    AFTER:                               │
│ ├─ Simulate fluctuations   ├─ Simulate fluctuations             │
│ │  (credit to available)   │  (ROI stays in investment)        │
│ │                          │                                    │
│ ├─ Mark completed at       ├─ Mark completed at maturity        │
│ │  maturity                │                                    │
│ │                          ├─ Move to lockedBalance             │
│ │                          │  when maturity reached             │
│ │                          │                                    │
│ └─ Missing balance flow    └─ Complete balance integration      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────┐
│                    ADMIN.JS CHANGES                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ NEW ENDPOINT ADDED:                                             │
│                                                                  │
│ POST /admin/users/:userId/release-locked-funds                 │
│                                                                  │
│ Purpose: Allow admin to manually release funds from locked     │
│          to available balance for quick approvals              │
│                                                                  │
│ Logic:                                                          │
│  ├─ Validate user exists                                       │
│  ├─ Validate amount > 0                                        │
│  ├─ Check lockedBalance >= amount                              │
│  ├─ lockedBalance -= amount                                    │
│  ├─ availableBalance += amount                                 │
│  └─ Save user                                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

This is the complete visual representation of your new ROI withdrawal system!
