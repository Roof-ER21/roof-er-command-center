#!/bin/bash

# Roof HR Automation Test Script
# Run this after integrating the automation changes

BASE_URL="http://localhost:5000/api/hr"
AUTH_TOKEN="your_auth_token_here"  # Replace with actual token

echo "🧪 Roof HR Automation Test Suite"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4

  echo -e "${YELLOW}Testing: ${name}${NC}"
  echo "  ${method} ${endpoint}"

  if [ -z "$data" ]; then
    response=$(curl -s -X ${method} \
      -H "Authorization: Bearer ${AUTH_TOKEN}" \
      "${BASE_URL}${endpoint}")
  else
    response=$(curl -s -X ${method} \
      -H "Authorization: Bearer ${AUTH_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "${data}" \
      "${BASE_URL}${endpoint}")
  fi

  if echo "$response" | grep -q '"success":true\|"id":\|^\['; then
    echo -e "${GREEN}✓ Success${NC}"
  else
    echo -e "${RED}✗ Failed${NC}"
    echo "  Response: $response"
  fi
  echo ""
}

# Test 1: Hire Endpoint
echo "=== TEST 1: Hire Automation ==="
test_endpoint \
  "Hire Candidate (ID 1)" \
  "POST" \
  "/candidates/1/hire" \
  '{
    "role": "SALES_REP",
    "startDate": "2026-02-01",
    "employmentType": "W2",
    "department": "Sales"
  }'

# Test 2: NO_SHOW Automation
echo "=== TEST 2: NO_SHOW Automation ==="
test_endpoint \
  "Mark Candidate as NO_SHOW" \
  "PATCH" \
  "/candidates/2" \
  '{
    "status": "NO_SHOW",
    "interviewId": 1
  }'

# Test 3: DEAD Automation
echo "=== TEST 3: DEAD Automation ==="
test_endpoint \
  "Mark Candidate as DEAD" \
  "PATCH" \
  "/candidates/3" \
  '{
    "status": "DEAD_BY_COMPANY",
    "deadReason": "DEAD_QUALIFICATIONS"
  }'

# Test 4: Auto-Archive
echo "=== TEST 4: Auto-Archive ==="
test_endpoint \
  "Auto-archive old candidates" \
  "POST" \
  "/candidates/auto-archive" \
  ""

# Test 5: Check Overdue Interviews (if manual trigger enabled)
echo "=== TEST 5: Interview Overdue Check ==="
test_endpoint \
  "Check overdue interviews" \
  "POST" \
  "/debug/check-overdue-interviews" \
  ""

echo ""
echo "================================"
echo "🎉 Test suite complete!"
echo ""
echo "Check the following:"
echo "  1. Console logs for automation execution"
echo "  2. Database tables (users, ptoPolicies, onboardingTasks, candidateNotes)"
echo "  3. Email notifications table for sent emails"
echo ""
echo "Note: Some tests may fail if candidate IDs don't exist."
echo "Update the candidate IDs in this script to match your data."
