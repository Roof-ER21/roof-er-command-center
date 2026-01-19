# PTO Balance Update Flow Diagram

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        PTO Balance Tracking System                       │
└──────────────────────────────────────────────────────────────────────────┘

Frontend (PTOPage.tsx)
    │
    │ PATCH /api/hr/pto/:id { status: "APPROVED" }
    ↓
┌─────────────────────────────────────────────────────────────────┐
│  server/routes/hr/index.ts - router.patch("/pto/:id")         │
├─────────────────────────────────────────────────────────────────┤
│  1. Validate user permissions (manager roles)                  │
│  2. Get current request state (to track transitions)           │
│  3. Update request status in database                          │
│  4. ✨ NEW: Call balance service                               │
│  5. Send email notification                                     │
│  6. Return updated request                                      │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Step 4 calls ↓
┌─────────────────────────────────────────────────────────────────┐
│  server/services/pto-balance.ts                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  deductPtoBalance()           restorePtoBalance()              │
│  ├─ Check if exempt          ├─ Check if exempt               │
│  ├─ Get/create policy        ├─ Get policy                     │
│  ├─ Calculate new used       ├─ Calculate restored used       │
│  ├─ Calculate new remaining  ├─ Calculate restored remaining  │
│  ├─ Update database          ├─ Update database               │
│  └─ Return change log        └─ Return change log             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ↓ Updates
┌─────────────────────────────────────────────────────────────────┐
│  Database: pto_policies table                                  │
├─────────────────────────────────────────────────────────────────┤
│  - employeeId: INTEGER                                          │
│  - totalDays: INTEGER (17)                                      │
│  - usedDays: INTEGER (0 → 3 → 0)  ← UPDATED IN REAL-TIME     │
│  - remainingDays: INTEGER (17 → 14 → 17) ← UPDATED            │
│  - updatedAt: TIMESTAMP                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Status Transition Matrix

```
╔═══════════════════════════════════════════════════════════════════════╗
║                     PTO Status Transitions                            ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  From Status   │  To Status   │  Balance Action      │  Exempt Check║
║ ───────────────┼──────────────┼──────────────────────┼──────────────║
║  PENDING       │  APPROVED    │  ➖ DEDUCT           │      ✅      ║
║  PENDING       │  DENIED      │  ⚫ NO CHANGE        │      -       ║
║  APPROVED      │  DENIED      │  ➕ RESTORE          │      ✅      ║
║  APPROVED      │  PENDING     │  ➕ RESTORE (revoke) │      ✅      ║
║  DENIED        │  APPROVED    │  ➖ DEDUCT           │      ✅      ║
║  DENIED        │  PENDING     │  ⚫ NO CHANGE        │      -       ║
║                                                                       ║
║  Special Case: Exempt Flag Changes (While APPROVED)                  ║
║ ───────────────────────────────────────────────────────────────────── ║
║  NOT EXEMPT    │  EXEMPT      │  ➕ RESTORE          │      ✅      ║
║  EXEMPT        │  NOT EXEMPT  │  ➖ DEDUCT           │      ✅      ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

## Example Scenario: Approval → Denial → Re-approval

```
Initial State:
┌──────────────────────────────────┐
│ Employee Balance                 │
│ Total: 17 days                   │
│ Used: 0 days                     │
│ Remaining: 17 days               │
└──────────────────────────────────┘

Step 1: Submit PTO Request
Request: 3 days vacation (Jan 20-22)
Status: PENDING

┌──────────────────────────────────┐
│ Employee Balance                 │
│ Total: 17 days                   │
│ Used: 0 days  ⚫ NO CHANGE       │
│ Remaining: 17 days               │
└──────────────────────────────────┘

Step 2: Manager Approves
PATCH /api/hr/pto/123 { status: "APPROVED" }

    ↓ Calls deductPtoBalance()

┌──────────────────────────────────┐
│ Employee Balance                 │
│ Total: 17 days                   │
│ Used: 3 days  ➖ DEDUCTED       │
│ Remaining: 14 days               │
└──────────────────────────────────┘

Console: [PTO Balance] ✅ Deducted 3 days. New balance: 14 days remaining

Step 3: Manager Denies (Mistake/Change)
PATCH /api/hr/pto/123 { status: "DENIED" }

    ↓ Calls restorePtoBalance()

┌──────────────────────────────────┐
│ Employee Balance                 │
│ Total: 17 days                   │
│ Used: 0 days  ➕ RESTORED        │
│ Remaining: 17 days               │
└──────────────────────────────────┘

Console: [PTO Balance] ✅ Restored 3 days (denied). New balance: 17 days remaining

Step 4: Manager Re-approves as Exempt
PATCH /api/hr/pto/123 { status: "APPROVED", isExempt: true }

    ↓ Exempt request, no balance change

┌──────────────────────────────────┐
│ Employee Balance                 │
│ Total: 17 days                   │
│ Used: 0 days  ⚫ NO CHANGE       │
│ Remaining: 17 days (exempt PTO!) │
└──────────────────────────────────┘

Console: [PTO Balance] Skipping deduction for request 123 (exempt: true)
```

## Balance Calculation Logic

```
┌─────────────────────────────────────────────────────────────────┐
│  Balance Calculation Formula                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TOTAL DAYS (from policy)                                       │
│      ↓                                                          │
│  17 days (default company policy)                               │
│                                                                 │
│  USED DAYS (calculated)                                         │
│      ↓                                                          │
│  SUM of all APPROVED, non-EXEMPT requests in current year       │
│  WHERE startDate >= '2025-01-01' AND startDate <= '2025-12-31' │
│                                                                 │
│  REMAINING DAYS (derived)                                       │
│      ↓                                                          │
│  TOTAL DAYS - USED DAYS                                         │
│  MAX(0, calculated_value)  ← Prevents negative                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Multi-Request Scenario

```
Employee: John Doe (ID: 1)
Initial Balance: 17 days total, 0 used, 17 remaining

Request #1: 3 days vacation (Jan 20-22) → APPROVED
    Used: 0 → 3
    Remaining: 17 → 14

Request #2: 5 days vacation (Feb 10-14) → APPROVED
    Used: 3 → 8
    Remaining: 14 → 9

Request #3: 2 days sick (Mar 5-6) → APPROVED (exempt)
    Used: 8 → 8 (no change, exempt!)
    Remaining: 9 → 9

Request #1: Changed to DENIED (manager mistake)
    Used: 8 → 5 (restored 3 days)
    Remaining: 9 → 12

Request #4: 15 days vacation (Jun 1-15) → DENIED
    ERROR: Insufficient balance (only 12 remaining)
    Used: 5 → 5 (no change)
    Remaining: 12 → 12

Final Balance: 5/17 days used, 12 remaining
```

## Recalculation Process

```
POST /api/hr/pto/policies/balance/recalculate/1

┌─────────────────────────────────────────────────────────────────┐
│  Recalculation Algorithm                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Query all PTO requests for employee                         │
│     WHERE:                                                      │
│       - employeeId = 1                                          │
│       - status = 'APPROVED'                                     │
│       - isExempt = false                                        │
│       - startDate >= '2025-01-01'                               │
│       - startDate <= '2025-12-31'                               │
│                                                                 │
│  2. Calculate total used days                                   │
│     usedDays = SUM(request.days)                                │
│                                                                 │
│  3. Get employee's total allocation                             │
│     totalDays = policy.totalDays (from pto_policies)            │
│                                                                 │
│  4. Calculate remaining                                         │
│     remainingDays = totalDays - usedDays                        │
│                                                                 │
│  5. Update database                                             │
│     UPDATE pto_policies SET                                     │
│       usedDays = calculated_used,                               │
│       remainingDays = calculated_remaining,                     │
│       updatedAt = NOW()                                         │
│     WHERE employeeId = 1                                        │
│                                                                 │
│  6. Return summary                                              │
│     { usedDays: 5, totalDays: 17, remainingDays: 12 }          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Use Case: Fix discrepancies after manual database edits or bulk imports
```

## Type Breakdown Query

```
GET /api/hr/pto/policies/balance/1?year=2025

Returns:
{
  "totalDays": 17,
  "usedDays": 5,
  "remainingDays": 12,
  "vacationDays": 10,
  "sickDays": 5,
  "personalDays": 2,
  "policyLevel": "COMPANY",
  "byType": {
    "vacation": {
      "used": 3,
      "available": 7
    },
    "sick": {
      "used": 2,
      "available": 3
    },
    "personal": {
      "used": 0,
      "available": 2
    }
  },
  "year": 2025
}

Calculation:
- Vacation: SUM(days WHERE type='VACATION' AND approved AND not exempt)
- Sick: SUM(days WHERE type='SICK' AND approved AND not exempt)
- Personal: SUM(days WHERE type='PERSONAL' AND approved AND not exempt)
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Error Handling Strategy                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Balance Update Fails:                                          │
│    ┌─────────────────────────────────────────────────┐         │
│    │ try {                                            │         │
│    │   await deductPtoBalance(...)                    │         │
│    │ } catch (balanceError) {                         │         │
│    │   console.error("Failed to update balance")      │         │
│    │   // Request status still updated ✅             │         │
│    │   // Email still sent ✅                         │         │
│    │   // Admin can run recalculation later ✅        │         │
│    │ }                                                 │         │
│    └─────────────────────────────────────────────────┘         │
│                                                                 │
│  Why Not Rollback?                                              │
│  - PTO approval is critical business operation                  │
│  - Balance can be fixed via recalculation                       │
│  - Prevents blocking approvals due to balance service issues    │
│                                                                 │
│  Production Improvements:                                       │
│  1. Use database transactions (all-or-nothing)                  │
│  2. Implement retry queue for failed balance updates            │
│  3. Alert admins via Slack/email when balance fails             │
│  4. Add balance health check endpoint                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Performance Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│  Query Optimization                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Index on pto_requests:                                         │
│    CREATE INDEX idx_pto_employee_status ON pto_requests        │
│      (employee_id, status, start_date);                         │
│                                                                 │
│  Index on pto_policies:                                         │
│    CREATE UNIQUE INDEX idx_pto_policies_employee ON            │
│      pto_policies(employee_id);                                 │
│                                                                 │
│  Expected Query Time:                                           │
│    - Balance update: < 10ms                                     │
│    - Balance query: < 5ms                                       │
│    - Recalculation: < 50ms per employee                         │
│    - Bulk recalculation (50 employees): < 3 seconds            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

**Visual Guide Created**: January 19, 2025
**System**: Roof-ER Command Center PTO Balance Tracking
