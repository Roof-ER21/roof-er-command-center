# PTO Approval Routing Implementation

## Overview

Implemented specific PTO approval routing logic that determines which approvers receive notifications and can approve PTO requests based on the requesting employee.

## Changes Made

### 1. Created PTO Approvers Configuration

**File:** `/server/config/pto-approvers.ts`

Defines the approval routing rules:

- **Core Approvers:** Ahmed Mahmoud, Ford Barsi, Reese Samala, Oliver Brown
- **Department Approvers:** Greg Campbell (Production)
- **Special Routing:**
  - Ford Barsi's requests → Only Ahmed Mahmoud and Oliver Brown
  - Reese Samala's requests → Only Ahmed Mahmoud and Oliver Brown

**Key Functions:**
- `getApproversForRequest(employeeEmail, department)` - Returns list of approver emails
- `canUserApprove(approverEmail, requestEmployeeEmail, department)` - Checks authorization
- `getApproverByEmail(email)` - Retrieves approver information
- `isDepartmentApprover(email)` - Checks if approver is department-specific

### 2. Created PTO Approval Service

**File:** `/server/services/pto-approval.ts`

Provides database-integrated approval logic:

**Key Functions:**
- `getApproverEmails(employeeId)` - Gets approver emails from employee ID
- `getApproverUsers(employeeId)` - Gets full user objects for approvers
- `canUserApprovePTORequest(approverEmail, employeeId)` - Database-backed authorization check

### 3. Updated Email Service

**File:** `/server/services/email.ts`

Added new function:
- `sendPTORequestNotificationToApprovers()` - Sends notifications to multiple designated approvers

### 4. Updated PTO Request Creation Endpoint

**File:** `/server/routes/hr/index.ts` - `POST /api/hr/pto`

**Changes:**
- Replaced broad manager notification with targeted approver notification
- Uses `getApproverUsers()` to get designated approvers
- Uses `sendPTORequestNotificationToApprovers()` for batch sending
- Logs specific approvers notified

**Before:**
```typescript
// Sent to ALL managers/HR admins (broad)
const managers = await db.select().from(users)
  .where(sql`UPPER(${users.role}) IN ('SYSTEM_ADMIN', 'HR_ADMIN', 'GENERAL_MANAGER', 'MANAGER')`);
```

**After:**
```typescript
// Sent only to designated approvers (targeted)
const approvers = await getApproverUsers(employeeId);
```

### 5. Updated PTO Approval Endpoint

**File:** `/server/routes/hr/index.ts` - `PATCH /api/hr/pto/:id`

**Changes:**
- Added authorization check before allowing approval
- Fetches the PTO request to get employee ID
- Calls `canUserApprovePTORequest()` to verify authorization
- Returns 403 error if user not authorized

**Authorization Flow:**
1. Check user has manager role (existing check)
2. Fetch PTO request to get employee ID
3. Check if approver is authorized for this specific employee
4. If not authorized, return 403 with clear error message

## Routing Logic

### Standard Employees
All standard employees' PTO requests route to:
1. All Core Approvers (Ahmed, Ford, Reese, Oliver)
2. Department-specific approvers (if configured)

### Special Cases

#### Ford Barsi or Reese Samala
Their PTO requests route ONLY to:
1. Ahmed Mahmoud
2. Oliver Brown

This ensures proper oversight for leadership-level PTO requests.

### Department Approvers

Department approvers (like Greg Campbell for Production) receive notifications but are considered **secondary approvers**. The system is designed to allow future enhancement where:
- Department approver approval = "pre-approved"
- Still requires core approver final approval

Currently, any authorized approver can fully approve.

## Security Features

1. **Whitelist-based Authorization:** Only designated approvers can approve requests
2. **Employee-specific Routing:** Special routing for leadership
3. **403 Error with Clear Message:** Unauthorized approvers see explicit denial
4. **Audit Trail:** All approvals track reviewedBy and reviewedAt

## Configuration

To add new approvers or routing rules, edit `/server/config/pto-approvers.ts`:

```typescript
// Add core approver
CORE_APPROVERS: [
  { email: 'new.approver@theroofdocs.com', name: 'New Approver', role: 'ADMIN' },
  // ...
]

// Add department approver
DEPARTMENT_APPROVERS: {
  'NewDepartment': [
    { email: 'dept.manager@theroofdocs.com', name: 'Dept Manager' }
  ],
}

// Add special routing
SPECIAL_ROUTING: {
  'special.employee@theroofdocs.com': [
    'specific.approver@theroofdocs.com'
  ],
}
```

## Testing

To test the implementation:

1. **Test Standard Employee PTO Request:**
   - Create PTO request as regular employee
   - Verify only designated approvers receive notification
   - Verify non-approvers cannot approve

2. **Test Ford/Reese PTO Request:**
   - Create PTO request as Ford or Reese
   - Verify only Ahmed and Oliver receive notification
   - Verify other core approvers cannot approve

3. **Test Unauthorized Approval:**
   - Try to approve a request as non-authorized manager
   - Verify 403 error with message

## Database Schema

No database changes required. Existing schema supports:
- `ptoRequests.employeeId` - Links to employee
- `ptoRequests.reviewedBy` - Tracks approver
- `ptoRequests.reviewedAt` - Tracks approval time
- `users.email` - Used for routing
- `users.department` - Used for department-specific routing

## API Response Changes

### POST /api/hr/pto
- Success: 201 with request object (unchanged)
- Logs now include approver count and employee email

### PATCH /api/hr/pto/:id
- New 403 response for unauthorized approvers:
  ```json
  {
    "error": "You are not authorized to approve this request",
    "message": "This request requires approval from designated approvers only"
  }
  ```

## Benefits

1. **Proper Oversight:** Leadership PTO requests go to appropriate reviewers
2. **Reduced Noise:** Only relevant approvers notified
3. **Clear Authorization:** Explicit approval permissions
4. **Audit Trail:** Track who approved what
5. **Configurable:** Easy to add new routing rules
6. **Secure:** Whitelist-based, no implicit permissions

## Future Enhancements

1. **Two-stage Approval:** Department approver + core approver
2. **Approval Delegation:** Temporary approver assignment
3. **Approval History:** Track all approval attempts
4. **Notification Preferences:** Per-approver settings
5. **Backup Approvers:** Fallback when primary unavailable

## Files Created/Modified

### Created:
- `/server/config/pto-approvers.ts` (182 lines)
- `/server/services/pto-approval.ts` (151 lines)
- `/Users/a21/roof-er-command-center/PTO_APPROVAL_ROUTING_IMPLEMENTATION.md` (this file)

### Modified:
- `/server/services/email.ts` - Added `sendPTORequestNotificationToApprovers()`
- `/server/routes/hr/index.ts` - Updated POST /pto and PATCH /pto/:id

### Total Lines Added: ~400 lines

## Build Status

✅ Build successful
✅ No TypeScript errors
✅ All imports resolved
✅ No breaking changes to existing API

---

**Implementation Date:** 2026-01-19
**Implemented By:** Claude Code (Backend Developer)
