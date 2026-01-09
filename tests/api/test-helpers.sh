#!/bin/bash

# Wspólne funkcje pomocnicze dla testów API

# Kolory
export GREEN='\033[0;32m'
export RED='\033[0;31m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export NC='\033[0m' # No Color

# Sprawdź czy jest ustawiony port, jeśli nie - użyj domyślnego
if [ -z "$API_PORT" ]; then
    API_PORT=3000
fi

export API_BASE="http://localhost:$API_PORT"
SERVER_STARTED=false
SERVER_PID=""

# Funkcja zabijająca istniejące procesy node/astro na porcie
kill_existing_servers() {
    echo -e "${YELLOW}Sprawdzam istniejące procesy na porcie $API_PORT...${NC}"

    # Znajdź PID procesu używającego portu
    local pid=$(lsof -ti:$API_PORT 2>/dev/null)

    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Zatrzymuję istniejący proces (PID: $pid)...${NC}"
        kill -9 $pid 2>/dev/null
        sleep 2
        echo -e "${GREEN}✓ Istniejący proces zatrzymany${NC}"
    fi

    # Dodatkowo zabij wszystkie procesy astro dev
    pkill -f "astro dev" 2>/dev/null
    sleep 1
}

# Funkcja sprawdzająca czy serwer jest uruchomiony
check_server() {
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE" 2>/dev/null)
    [ "$http_code" != "000" ]
}

# Funkcja uruchamiająca serwer
start_server() {
    # Zabij istniejące instancje przed uruchomieniem
    kill_existing_servers

    echo -e "${YELLOW}Uruchamiam serwer deweloperski na porcie $API_PORT...${NC}"
    cd "$(dirname "$0")/../.."
    PORT=$API_PORT npm run dev > /tmp/astro-dev-server.log 2>&1 &
    SERVER_PID=$!
    SERVER_STARTED=true

    echo -e "${YELLOW}Czekam na gotowość serwera...${NC}"
    for i in {1..60}; do
        if check_server; then
            echo -e "${GREEN}✓ Serwer gotowy${NC}"
            echo ""
            return 0
        fi
        sleep 1
    done

    echo -e "${RED}✗ Serwer nie uruchomił się w czasie 60 sekund${NC}"
    echo -e "${YELLOW}Log serwera:${NC}"
    tail -n 20 /tmp/astro-dev-server.log
    exit 1
}

# Funkcja zatrzymująca serwer
stop_server() {
    if [ "$SERVER_STARTED" = true ] && [ ! -z "$SERVER_PID" ]; then
        echo ""
        echo -e "${YELLOW}Zatrzymuję serwer...${NC}"
        kill $SERVER_PID 2>/dev/null
        # Również zabij wszystkie procesy potomne
        pkill -P $SERVER_PID 2>/dev/null
        wait $SERVER_PID 2>/dev/null
        echo -e "${GREEN}✓ Serwer zatrzymany${NC}"
    fi
}

# Funkcja inicjująca serwer dla testów
init_server() {
    # Jeśli zmienna SERVER_MANAGED jest ustawiona, nie inicjalizuj serwera
    # (serwer jest zarządzany przez nadrzędny skrypt, np. run-all.sh)
    if [ "$SERVER_MANAGED" = "true" ]; then
        echo -e "${GREEN}✓ Serwer jest zarządzany przez nadrzędny skrypt${NC}"
        echo ""
        return 0
    fi

    # Trap do zatrzymania serwera przy wyjściu
    trap stop_server EXIT INT TERM

    # Sprawdź czy serwer już działa, jeśli nie - uruchom
    if ! check_server; then
        start_server
    else
        echo -e "${GREEN}✓ Serwer już jest uruchomiony na $API_BASE${NC}"
        echo ""
    fi
}

# Funkcja do wyświetlania wyników testów
print_test() {
    local test_name="$1"
    local status_code="$2"
    local expected="$3"

    if [ "$status_code" -eq "$expected" ]; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name (HTTP $status_code)"
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name (Expected HTTP $expected, got $status_code)"
    fi
}

