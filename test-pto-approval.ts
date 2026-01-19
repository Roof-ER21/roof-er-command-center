/**
 * Test Script for PTO Approval Routing
 *
 * Run this with: npx tsx test-pto-approval.ts
 */

import { getApproversForRequest, canUserApprove, getApproverByEmail, isDepartmentApprover } from './server/config/pto-approvers.js';

console.log('🧪 Testing PTO Approval Routing Logic\n');

// Test 1: Standard employee
console.log('Test 1: Standard Employee PTO Request');
console.log('═══════════════════════════════════════');
const standardEmployeeApprovers = getApproversForRequest('john.doe@theroofdocs.com', null);
console.log(`Standard employee approvers: ${standardEmployeeApprovers.length}`);
standardEmployeeApprovers.forEach(email => console.log(`  - ${email}`));
console.log('✅ Expected: 4 core approvers\n');

// Test 2: Production department employee
console.log('Test 2: Production Department Employee');
console.log('═══════════════════════════════════════');
const productionApprovers = getApproversForRequest('prod.worker@theroofdocs.com', 'Production');
console.log(`Production employee approvers: ${productionApprovers.length}`);
productionApprovers.forEach(email => console.log(`  - ${email}`));
console.log('✅ Expected: 4 core + 1 department (Greg) = 5 approvers\n');

// Test 3: Ford Barsi special routing
console.log('Test 3: Ford Barsi (Special Routing)');
console.log('═══════════════════════════════════════');
const fordApprovers = getApproversForRequest('ford.barsi@theroofdocs.com', null);
console.log(`Ford's approvers: ${fordApprovers.length}`);
fordApprovers.forEach(email => console.log(`  - ${email}`));
console.log('✅ Expected: Only 2 approvers (Ahmed & Oliver)\n');

// Test 4: Reese Samala special routing
console.log('Test 4: Reese Samala (Special Routing)');
console.log('═══════════════════════════════════════');
const reeseApprovers = getApproversForRequest('reese.samala@theroofdocs.com', null);
console.log(`Reese's approvers: ${reeseApprovers.length}`);
reeseApprovers.forEach(email => console.log(`  - ${email}`));
console.log('✅ Expected: Only 2 approvers (Ahmed & Oliver)\n');

// Test 5: Authorization checks
console.log('Test 5: Authorization Checks');
console.log('═══════════════════════════════════════');

// Ahmed can approve standard employee
const ahmedCanApproveStandard = canUserApprove(
  'ahmed.mahmoud@theroofdocs.com',
  'john.doe@theroofdocs.com',
  null
);
console.log(`Ahmed can approve standard employee: ${ahmedCanApproveStandard ? '✅' : '❌'}`);

// Ahmed can approve Ford
const ahmedCanApproveFord = canUserApprove(
  'ahmed.mahmoud@theroofdocs.com',
  'ford.barsi@theroofdocs.com',
  null
);
console.log(`Ahmed can approve Ford: ${ahmedCanApproveFord ? '✅' : '❌'}`);

// Ford CANNOT approve Reese (special routing)
const fordCanApproveReese = canUserApprove(
  'ford.barsi@theroofdocs.com',
  'reese.samala@theroofdocs.com',
  null
);
console.log(`Ford can approve Reese: ${fordCanApproveReese ? '❌ (Should be false)' : '✅ (Correctly denied)'}`);

// Reese CANNOT approve Ford (special routing)
const reeseCanApproveFord = canUserApprove(
  'reese.samala@theroofdocs.com',
  'ford.barsi@theroofdocs.com',
  null
);
console.log(`Reese can approve Ford: ${reeseCanApproveFord ? '❌ (Should be false)' : '✅ (Correctly denied)'}`);

// Oliver can approve Ford
const oliverCanApproveFord = canUserApprove(
  'oliver.brown@theroofdocs.com',
  'ford.barsi@theroofdocs.com',
  null
);
console.log(`Oliver can approve Ford: ${oliverCanApproveFord ? '✅' : '❌'}`);

// Random manager CANNOT approve anyone
const randomCanApprove = canUserApprove(
  'random.manager@theroofdocs.com',
  'john.doe@theroofdocs.com',
  null
);
console.log(`Random manager can approve: ${randomCanApprove ? '❌ (Should be false)' : '✅ (Correctly denied)'}`);

console.log();

// Test 6: Approver lookup
console.log('Test 6: Approver Lookup');
console.log('═══════════════════════════════════════');
const ahmedInfo = getApproverByEmail('ahmed.mahmoud@theroofdocs.com');
console.log(`Ahmed info: ${ahmedInfo ? `${ahmedInfo.name} (${ahmedInfo.role})` : 'Not found'}`);

const gregInfo = getApproverByEmail('greg.campbell@theroofdocs.com');
console.log(`Greg info: ${gregInfo ? `${gregInfo.name} (${gregInfo.role || 'Department Approver'})` : 'Not found'}`);

const randomInfo = getApproverByEmail('random@theroofdocs.com');
console.log(`Random user info: ${randomInfo ? 'Found (ERROR)' : 'Not found ✅'}`);

console.log();

// Test 7: Department approver check
console.log('Test 7: Department Approver Check');
console.log('═══════════════════════════════════════');
const ahmedIsDept = isDepartmentApprover('ahmed.mahmoud@theroofdocs.com');
console.log(`Ahmed is department approver: ${ahmedIsDept ? '❌ (Should be false)' : '✅ (Core approver)'}`);

const gregIsDept = isDepartmentApprover('greg.campbell@theroofdocs.com');
console.log(`Greg is department approver: ${gregIsDept ? '✅' : '❌ (Should be true)'}`);

console.log();

// Summary
console.log('═══════════════════════════════════════');
console.log('🎉 All tests completed!');
console.log('═══════════════════════════════════════');
console.log('\nRouting Summary:');
console.log('- Standard employees: 4 core approvers');
console.log('- Production employees: 4 core + 1 dept = 5 approvers');
console.log('- Ford Barsi: 2 specific approvers (Ahmed & Oliver)');
console.log('- Reese Samala: 2 specific approvers (Ahmed & Oliver)');
console.log('\nAuthorization:');
console.log('- Only designated approvers can approve');
console.log('- Special routing prevents peer approval (Ford/Reese)');
console.log('- Random managers correctly denied');
