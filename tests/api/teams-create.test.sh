#!/bin/bash

# Załaduj wspólne funkcje pomocnicze
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Inicjalizuj serwer
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing POST /api/teams endpoint${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}TODO: Implement tests for POST /api/teams${NC}"

