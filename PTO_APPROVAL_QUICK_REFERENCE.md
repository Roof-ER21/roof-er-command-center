# PTO Approval Routing - Quick Reference

## Approval Flow

### Standard Employee Request Flow

```
Employee submits PTO
     ↓
System checks employee email & department
     ↓
Sends notification to:
  - Ahmed Mahmoud
  - Ford Barsi
  - Reese Samala
  - Oliver Brown
  - [Department approvers if applicable]
     ↓
Any authorized approver can approve/deny
     ↓
Employee receives notification
```

### Ford or Reese Request Flow

```
Ford/Reese submits PTO
     ↓
System detects special routing
     ↓
Sends notification ONLY to:
  - Ahmed Mahmoud
  - Oliver Brown
     ↓
Only Ahmed or Oliver can approve/deny
     ↓
Ford/Reese receives notification
```

## Current Approvers

### Core Approvers (Can approve most requests)
- ahmed.mahmoud@theroofdocs.com (SYSTEM_ADMIN)
- ford.barsi@theroofdocs.com (GENERAL_MANAGER)
- reese.samala@theroofdocs.com (Core Approver)
- oliver.brown@theroofdocs.com (Core Approver)

### Department Approvers
- **Production:** greg.campbell@theroofdocs.com

### Special Routing
- **Ford Barsi** → Ahmed & Oliver only
- **Reese Samala** → Ahmed & Oliver only

## API Changes

### POST /api/hr/pto
Creates PTO request and sends notifications to designated approvers only.

**No changes to request/response format.**

**Behavior change:**
- Before: Sent to ALL managers/HR admins
- After: Sent only to designated approvers

### PATCH /api/hr/pto/:id
Approves or denies PTO request.

**New authorization check:**
- Verifies approver is authorized for this specific employee
- Returns 403 if not authorized

**New error response:**
```json
{
  "error": "You are not authorized to approve this request",
  "message": "This request requires approval from designated approvers only"
}
```

## Adding New Approvers

Edit `/server/config/pto-approvers.ts`:

### Add Core Approver
```typescript
CORE_APPROVERS: [
  // ... existing approvers
  {
    email: 'new.approver@theroofdocs.com',
    name: 'New Approver',
    role: 'ADMIN'
  },
]
```

### Add Department Approver
```typescript
DEPARTMENT_APPROVERS: {
  // ... existing departments
  'NewDepartment': [
    {
      email: 'dept.manager@theroofdocs.com',
      name: 'Department Manager',
      role: 'Manager'
    }
  ],
}
```

### Add Special Routing
```typescript
SPECIAL_ROUTING: {
  // ... existing routing
  'special.employee@theroofdocs.com': [
    'specific.approver1@theroofdocs.com',
    'specific.approver2@theroofdocs.com',
  ],
}
```

## Testing

Run the test script:
```bash
npx tsx test-pto-approval.ts
```

Expected output: All ✅ (green checks)

## Troubleshooting

### Employee not receiving notifications
1. Check employee email is in `users` table
2. Check designated approvers exist in system
3. Check email service logs

### Approver can't approve request
1. Verify approver email matches config exactly
2. Check if request is for special employee (Ford/Reese)
3. Verify approver has manager role in database

### Wrong approvers receiving notifications
1. Check employee's department field
2. Verify approver config matches requirements
3. Check for typos in email addresses

## File Locations

### Configuration
- `/server/config/pto-approvers.ts` - Approver routing rules

### Services
- `/server/services/pto-approval.ts` - Approval logic
- `/server/services/email.ts` - Email notifications

### Routes
- `/server/routes/hr/index.ts` - PTO endpoints (lines ~580-900)

### Tests
- `/test-pto-approval.ts` - Test script

### Documentation
- `/PTO_APPROVAL_ROUTING_IMPLEMENTATION.md` - Full implementation details
- `/PTO_APPROVAL_QUICK_REFERENCE.md` - This file

## Security Notes

- ✅ Whitelist-based authorization
- ✅ Employee-specific routing
- ✅ Clear error messages for unauthorized attempts
- ✅ Audit trail (reviewedBy, reviewedAt)
- ✅ No implicit permissions

## Future Enhancements

Potential improvements:
1. Two-stage approval (department + core)
2. Approval delegation
3. Backup approvers
4. Approval history tracking
5. Per-approver notification preferences

---

**Last Updated:** 2026-01-19
**Version:** 1.0.0
