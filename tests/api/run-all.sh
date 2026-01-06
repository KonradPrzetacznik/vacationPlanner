#!/bin/bash

# =====================================================
# Run All API Tests
# Description: Executes all API test scripts in tests/api directory
# =====================================================

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TESTS_DIR="$SCRIPT_DIR"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          Vacation Planner - API Test Suite                ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Server not running. Starting dev server...${NC}"
    echo ""

    cd "$PROJECT_ROOT"
    npm run dev > /tmp/astro-test-suite.log 2>&1 &
    SERVER_PID=$!

    echo -e "${BLUE}⏳ Waiting for server to start (10 seconds)...${NC}"
    sleep 10

    # Check if server started successfully
    if ! ps -p $SERVER_PID > /dev/null 2>&1; then
        echo -e "${RED}❌ Failed to start server. Check /tmp/astro-test-suite.log${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Server started (PID: $SERVER_PID)${NC}"
    echo ""
    CLEANUP_SERVER=true
else
    echo -e "${GREEN}✅ Server already running${NC}"
    echo ""
    CLEANUP_SERVER=false
fi

# Counter for test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Find and execute all test files
echo -e "${BLUE}🔍 Discovering test files...${NC}"
echo ""

TEST_FILES=$(find "$TESTS_DIR" -name "*.test.sh" -type f | sort)

if [ -z "$TEST_FILES" ]; then
    echo -e "${YELLOW}⚠️  No test files found in $TESTS_DIR${NC}"
    exit 0
fi

# Run each test file
for test_file in $TEST_FILES; do
    test_name=$(basename "$test_file" .test.sh)
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Running: ${test_name}${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Run test and capture exit code
    if bash "$test_file"; then
        echo ""
        echo -e "${GREEN}✓ ${test_name} PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo ""
        echo -e "${RED}✗ ${test_name} FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    echo ""
done

# Summary
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                     Test Summary                           ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total tests:  ${BLUE}${TOTAL_TESTS}${NC}"
echo -e "Passed:       ${GREEN}${PASSED_TESTS}${NC}"
echo -e "Failed:       ${RED}${FAILED_TESTS}${NC}"
echo ""

# Cleanup server if we started it
if [ "$CLEANUP_SERVER" = true ]; then
    echo -e "${BLUE}🧹 Cleaning up server (PID: $SERVER_PID)...${NC}"
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Cleanup complete${NC}"
fi

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi

