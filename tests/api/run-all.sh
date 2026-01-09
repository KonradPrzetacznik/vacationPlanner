#!/bin/bash

# =====================================================
# Run All API Tests
# Description: Executes all API test scripts in tests/api directory
# =====================================================

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TESTS_DIR="$SCRIPT_DIR"

# Załaduj wspólne funkcje pomocnicze
source "$SCRIPT_DIR/test-helpers.sh"

# Dodatkowe kolory dla run-all
export CYAN='\033[0;36m'

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          Vacation Planner - API Test Suite                ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Inicjalizuj serwer (zabije istniejące i uruchomi nowy)
init_server

# Ustaw zmienną informującą testy, że serwer jest zarządzany przez ten skrypt
export SERVER_MANAGED=true

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


# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi

