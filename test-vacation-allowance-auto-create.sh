#!/bin/bash

# Test script to verify automatic vacation allowance creation
# This script tests the new feature where vacation allowance is created automatically
# when a user tries to create a vacation request without existing allowance

API_BASE="http://localhost:4321"

echo "========================================="
echo "Test: Automatic Vacation Allowance Creation"
echo "========================================="
echo ""

# Test user ID (you can change this to test with different user)
TEST_USER_ID="00000000-0000-0000-0000-000000000001"

echo "Step 1: Check if user already has vacation allowance for 2026"
echo "GET /api/users/${TEST_USER_ID}/vacation-allowances?year=2026"
ALLOWANCE_RESPONSE=$(curl -s "${API_BASE}/api/users/${TEST_USER_ID}/vacation-allowances?year=2026")
echo "Response: ${ALLOWANCE_RESPONSE}"
echo ""

echo "Step 2: Try to create a vacation request"
echo "POST /api/vacation-requests"
REQUEST_PAYLOAD='{"startDate":"2026-02-23","endDate":"2026-02-25"}'
echo "Payload: ${REQUEST_PAYLOAD}"

CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/vacation-requests" \
  -H "Content-Type: application/json" \
  -d "${REQUEST_PAYLOAD}")

STATUS_CODE=$(echo "$CREATE_RESPONSE" | tail -n 1)
BODY=$(echo "$CREATE_RESPONSE" | head -n -1)

echo "Status Code: ${STATUS_CODE}"
echo "Response Body: ${BODY}"
echo ""

if [ "$STATUS_CODE" -eq 201 ]; then
  echo "✅ SUCCESS: Vacation request created successfully!"
  echo "This means vacation allowance was either existing or created automatically."
elif [ "$STATUS_CODE" -eq 500 ]; then
  echo "❌ ERROR: Got 500 error - vacation allowance creation failed"
  echo "Error details: ${BODY}"
else
  echo "⚠️  Got status code: ${STATUS_CODE}"
  echo "Response: ${BODY}"
fi

echo ""
echo "Step 3: Verify vacation allowance was created"
echo "GET /api/users/${TEST_USER_ID}/vacation-allowances?year=2026"
FINAL_ALLOWANCE_RESPONSE=$(curl -s "${API_BASE}/api/users/${TEST_USER_ID}/vacation-allowances?year=2026")
echo "Response: ${FINAL_ALLOWANCE_RESPONSE}"
echo ""

echo "Test completed!"
