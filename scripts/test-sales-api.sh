#!/bin/bash

# Sales Performance API Test Script
# This script tests the sales API endpoints

BASE_URL="http://localhost:5000"
echo "🧪 Testing Sales Performance API"
echo "================================="

# Test 1: Health check
echo ""
echo "1️⃣ Testing health check..."
curl -s "$BASE_URL/api/health" | jq '.'

# Test 2: Get my stats (requires authentication)
echo ""
echo "2️⃣ Testing /api/sales/my-stats..."
echo "   (This will return 401 if not authenticated)"
curl -s -X GET "$BASE_URL/api/sales/my-stats" \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt \
  --cookie cookies.txt | jq '.'

# Test 3: Get sales leaderboard
echo ""
echo "3️⃣ Testing /api/sales/leaderboard..."
curl -s -X GET "$BASE_URL/api/sales/leaderboard" \
  -H "Content-Type: application/json" \
  --cookie cookies.txt | jq '.'

# Test 4: Get performance (with filters)
echo ""
echo "4️⃣ Testing /api/sales/performance?month=1&year=2025..."
curl -s -X GET "$BASE_URL/api/sales/performance?month=1&year=2025" \
  -H "Content-Type: application/json" \
  --cookie cookies.txt | jq '.'

echo ""
echo "✅ API tests complete!"
echo ""
echo "📝 Notes:"
echo "   - Authentication required for most endpoints"
echo "   - Login via /api/auth/login first to test authenticated endpoints"
echo "   - Use --cookie-jar and --cookie to maintain session"
echo ""
echo "Example authenticated test:"
echo '   curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '\''{"email":"user@example.com","password":"password"}'\'' --cookie-jar cookies.txt'
echo '   curl -X GET http://localhost:5000/api/sales/my-stats --cookie cookies.txt'
echo ""

# Clean up
rm -f cookies.txt
