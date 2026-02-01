# Dokumentacja Testów Jednostkowych

## Przegląd

Testy jednostkowe w projekcie Vacation Planner testują logikę biznesową warstwy serwisowej w izolacji od bazy danych i API endpoints.

## Technologie

- **Vitest** - Framework do testów jednostkowych (kompatybilny z Jest)
- **@testing-library/react** - Testowanie komponentów React
- **@testing-library/jest-dom** - Dodatkowe matchery do testów DOM
- **jsdom** - Symulacja środowiska przeglądarki

## Struktura Testów

```
tests/unit/
├── setup.ts                      # Konfiguracja środowiska testowego
├── example.test.ts               # Przykładowe testy
├── settings.service.test.ts      # Testy dla Settings Service
└── UNIT_TESTS_DOCUMENTATION.md   # Ten dokument
```

## Uruchamianie Testów

### Podstawowe komendy

```bash
# Uruchom wszystkie testy jednostkowe
npm run test:unit

# Uruchom testy w trybie watch (automatyczne przeładowanie)
npm run test:unit:watch

# Uruchom testy z interfejsem UI
npm run test:unit:ui

# Uruchom testy z raportem pokrycia kodu
npm run test:unit:coverage
```

## Istniejące Testy

### Settings Service Tests (`settings.service.test.ts`)

Testuje funkcje serwisu ustawień globalnych:

#### `getAllSettings()`
- ✅ Zwraca wszystkie ustawienia
- ✅ Zwraca pustą tablicę gdy brak ustawień
- ✅ Rzuca błąd przy problemach z bazą danych
- ✅ Obsługuje wartości numeryczne jako stringi
- ✅ Weryfikuje strukturę obiektów ustawień

#### `getSettingByKey()`
- ✅ Zwraca konkretne ustawienie po kluczu
- ✅ Rzuca błąd gdy ustawienie nie istnieje

#### `updateSetting()`
- ✅ Aktualizuje ustawienie (tylko dla HR/ADMINISTRATOR)
- ✅ Rzuca błąd gdy użytkownik nie ma uprawnień (EMPLOYEE)
- ✅ Rzuca błąd przy niepowodzeniu aktualizacji

## Mockowanie

### Mockowanie Supabase Client

Przykład mockowania klienta Supabase:

```typescript
import { vi } from "vitest";
import type { SupabaseClient } from "@/db/supabase.client";

const createMockSupabaseClient = () => {
  return {
    from: vi.fn(),
  } as unknown as SupabaseClient;
};

// W teście:
const mockSupabase = createMockSupabaseClient();
const mockSelect = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockResolvedValue({
  data: mockData,
  error: null,
});

vi.mocked(mockSupabase.from).mockReturnValue({
  select: mockSelect,
  order: mockOrder,
} as any);
```

## Pokrycie Kodu

Obecne progi pokrycia kodu (konfiguracja w `vitest.config.ts`):

- **Statements**: 70%
- **Branches**: 60%
- **Functions**: 70%
- **Lines**: 70%

### Wyświetlanie raportu pokrycia

Po uruchomieniu `npm run test:unit:coverage`, raport HTML jest dostępny w:
```
coverage/index.html
```

## Struktura Testu

Każdy test powinien stosować wzorzec **AAA (Arrange-Act-Assert)**:

```typescript
it("should do something", async () => {
  // Arrange - przygotowanie danych i mocków
  const mockData = { ... };
  const mockClient = createMockSupabaseClient();
  
  // Act - wywołanie testowanej funkcji
  const result = await someFunction(mockClient, params);
  
  // Assert - weryfikacja wyniku
  expect(result).toEqual(expectedResult);
});
```

## Dobre Praktyki

### 1. Izolacja Testów
- Każdy test powinien być niezależny
- Używaj `beforeEach()` do resetowania mocków
- Nie polegaj na kolejności wykonywania testów

### 2. Czytelne Opisy
```typescript
// ✅ Dobrze
it("should return all settings successfully", async () => { ... });

// ❌ Źle
it("test1", async () => { ... });
```

### 3. Testowanie Edge Cases
- Puste wyniki
- Wartości null/undefined
- Błędy bazy danych
- Błędy autoryzacji
- Nieprawidłowe dane wejściowe

### 4. Mockowanie
- Mockuj tylko niezbędne zależności
- Używaj `vi.fn()` do śledzenia wywołań
- Weryfikuj, że mocki zostały wywołane z poprawnymi parametrami

## Integracja z GitHub Actions

Testy jednostkowe są automatycznie uruchamiane w CI/CD pipeline:

```yaml
# .github/workflows/pull-request.yml
unit-tests:
  name: Unit Tests
  runs-on: ubuntu-latest
  steps:
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run unit tests with coverage
      run: npm run test:unit:coverage
```

## Debugowanie Testów

### Tryb Watch z filtrowaniem

```bash
# Uruchom tylko testy pasujące do wzorca
npm run test:unit:watch -- settings

# Uruchom konkretny plik
npm run test:unit:watch -- tests/unit/settings.service.test.ts
```

### Używanie console.log

```typescript
it("should debug", () => {
  console.log("Debug info:", someValue);
  expect(someValue).toBe(expected);
});
```

### VSCode Debugger

Dodaj do `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:unit:watch"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Rozszerzanie Testów

### Dodawanie Nowych Testów

1. Utwórz nowy plik `*.test.ts` w `tests/unit/`
2. Importuj testowaną funkcjonalność
3. Napisz testy używając wzorca AAA
4. Uruchom testy: `npm run test:unit`

### Przykład Nowego Testu

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { myFunction } from "@/lib/services/my.service";

describe("My Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should work correctly", async () => {
    // Arrange
    const input = "test";
    
    // Act
    const result = await myFunction(input);
    
    // Assert
    expect(result).toBe("expected");
  });
});
```

## Problemy i Rozwiązania

### Problem: Testy są wolne
**Rozwiązanie**: Sprawdź czy nie tworzysz zbyt dużych setup fixtures. Używaj `vi.mock()` do mockowania ciężkich modułów.

### Problem: Testy przechodzą lokalnie, ale nie w CI
**Rozwiązanie**: Sprawdź zmienne środowiskowe i upewnij się, że wszystkie zależności są zainstalowane (`npm ci`).

### Problem: Błędy TypeScript w testach
**Rozwiązanie**: Upewnij się, że `tsconfig.json` zawiera właściwą konfigurację dla testów.

## Zasoby

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Mocking with Vitest](https://vitest.dev/guide/mocking.html)
- [Coverage Configuration](https://vitest.dev/guide/coverage.html)

## Statystyki

- **Liczba testów**: 17
- **Pliki testowe**: 2
- **Pokrycie kodu**: ~70%
- **Czas wykonania**: ~2s

---

**Ostatnia aktualizacja**: 2026-02-01
