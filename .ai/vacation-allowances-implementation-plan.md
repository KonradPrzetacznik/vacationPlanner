# API Endpoint Implementation Plan: User Vacation Allowances

## 1. Przegląd punktu końcowego

Implementacja dwóch endpointów REST API do zarządzania pulami urlopowymi użytkowników:

1. **GET /api/users/:userId/vacation-allowances** - Pobiera wszystkie pule urlopowe użytkownika (opcjonalnie filtrowane po roku)
2. **GET /api/users/:userId/vacation-allowances/:year** - Pobiera pulę urlopową dla konkretnego roku

Oba endpointy zwracają szczegółowe informacje o pulach urlopowych, w tym:
- Podstawowe dane (rok, total_days, carryover_days)
- Obliczone pola: wykorzystane dni (ogółem, z carry-over, z bieżącego roku)
- Obliczone pola: pozostałe dni (ogółem, z carry-over, z bieżącego roku)
- Data wygaśnięcia dni carry-over (31 marca danego roku)

### Business Rules:
- Dni carry-over wygasają 31 marca danego roku
- Dni są wykorzystywane w kolejności: najpierw carry-over, potem dni z bieżącego roku
- Tylko zaakceptowane urlopy (APPROVED) liczą się do wykorzystanych dni
- Anulowane urlopy (CANCELLED) przywracają dni do puli

## 2. Szczegóły żądania

### Endpoint 1: GET /api/users/:userId/vacation-allowances

**Metoda HTTP:** GET

**Struktura URL:** `/api/users/:userId/vacation-allowances`

**Parametry:**
- **Wymagane (Path):**
  - `userId` (string, UUID) - Identyfikator użytkownika

- **Opcjonalne (Query):**
  - `year` (number, integer) - Filtrowanie po konkretnym roku (2000-2100)

**Przykładowe zapytania:**
```
GET /api/users/123e4567-e89b-12d3-a456-426614174000/vacation-allowances
GET /api/users/123e4567-e89b-12d3-a456-426614174000/vacation-allowances?year=2026
```

**Request Body:** Brak (GET request)

**Headers:**
- Brak dodatkowych (auth będzie dodana później)

---

### Endpoint 2: GET /api/users/:userId/vacation-allowances/:year

**Metoda HTTP:** GET

**Struktura URL:** `/api/users/:userId/vacation-allowances/:year`

**Parametry:**
- **Wymagane (Path):**
  - `userId` (string, UUID) - Identyfikator użytkownika
  - `year` (number, integer) - Rok puli urlopowej (2000-2100)

**Przykładowe zapytanie:**
```
GET /api/users/123e4567-e89b-12d3-a456-426614174000/vacation-allowances/2026
```

**Request Body:** Brak (GET request)

**Headers:**
- Brak dodatkowych (auth będzie dodana później)

## 3. Wykorzystywane typy

### Nowe typy do dodania w `src/types.ts`:

```typescript
// ============================================================================
// Vacation Allowances DTOs
// ============================================================================

/**
 * Get vacation allowances query parameters DTO
 * Used for filtering allowances by year
 */
export interface GetVacationAllowancesQueryDTO {
  year?: number; // Optional filter by specific year (2000-2100)
}

/**
 * Vacation allowance DTO with computed fields
 * Connected to: Database['public']['Tables']['vacation_allowances']['Row']
 * Connected to: Database['public']['Tables']['vacation_requests']['Row'] (for calculations)
 */
export interface VacationAllowanceDTO {
  id: string;
  userId: string;
  year: number;
  totalDays: number;
  carryoverDays: number;
  
  // Computed fields - calculated from vacation_requests
  usedDays: number; // Total used days (carryover + current year)
  usedCarryoverDays: number; // Used days from carryover
  usedCurrentYearDays: number; // Used days from current year
  remainingDays: number; // Total remaining days
  remainingCarryoverDays: number; // Remaining carryover days
  remainingCurrentYearDays: number; // Remaining current year days
  
  carryoverExpiresAt: string; // ISO date (YYYY-MM-DD) - always March 31st of the year
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

/**
 * Get vacation allowances response DTO
 * Returns list of allowances for user
 */
export interface GetVacationAllowancesResponseDTO {
  userId: string;
  allowances: VacationAllowanceDTO[];
}

/**
 * Get vacation allowance by year response DTO
 * Returns single allowance for specific year
 */
export interface GetVacationAllowanceByYearResponseDTO {
  data: VacationAllowanceDTO;
}
```

### Istniejące typy z `database.types.ts`:

```typescript
// Tabela vacation_allowances
type VacationAllowances = Database["public"]["Tables"]["vacation_allowances"]["Row"];
// Fields: id, user_id, year, total_days, carryover_days, created_at, updated_at

// Tabela vacation_requests (do obliczeń)
type VacationRequests = Database["public"]["Tables"]["vacation_requests"]["Row"];
// Fields używane: user_id, start_date, end_date, business_days_count, status

// Enum request_status
type RequestStatus = Database["public"]["Enums"]["request_status"];
// Values: SUBMITTED, APPROVED, REJECTED, CANCELLED

// Enum user_role (do RBAC)
type UserRole = Database["public"]["Enums"]["user_role"];
// Values: ADMINISTRATOR, HR, EMPLOYEE
```

## 4. Szczegóły odpowiedzi

### Endpoint 1: GET /api/users/:userId/vacation-allowances

**Success Response (200 OK):**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "allowances": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "year": 2025,
      "totalDays": 26,
      "carryoverDays": 0,
      "usedDays": 20,
      "usedCarryoverDays": 0,
      "usedCurrentYearDays": 20,
      "remainingDays": 6,
      "remainingCarryoverDays": 0,
      "remainingCurrentYearDays": 6,
      "carryoverExpiresAt": "2025-03-31",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-06-15T10:30:00Z"
    },
    {
      "id": "b2c3d4e5-f6g7-8901-bcde-f12345678901",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "year": 2026,
      "totalDays": 26,
      "carryoverDays": 5,
      "usedDays": 10,
      "usedCarryoverDays": 3,
      "usedCurrentYearDays": 7,
      "remainingDays": 21,
      "remainingCarryoverDays": 2,
      "remainingCurrentYearDays": 19,
      "carryoverExpiresAt": "2026-03-31",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-15T14:20:00Z"
    }
  ]
}
```

**Success Response with year filter (200 OK):**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "allowances": [
    {
      "id": "b2c3d4e5-f6g7-8901-bcde-f12345678901",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "year": 2026,
      "totalDays": 26,
      "carryoverDays": 5,
      "usedDays": 10,
      "usedCarryoverDays": 3,
      "usedCurrentYearDays": 7,
      "remainingDays": 21,
      "remainingCarryoverDays": 2,
      "remainingCurrentYearDays": 19,
      "carryoverExpiresAt": "2026-03-31",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-15T14:20:00Z"
    }
  ]
}
```

---

### Endpoint 2: GET /api/users/:userId/vacation-allowances/:year

**Success Response (200 OK):**
```json
{
  "data": {
    "id": "b2c3d4e5-f6g7-8901-bcde-f12345678901",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "year": 2026,
    "totalDays": 26,
    "carryoverDays": 5,
    "usedDays": 10,
    "usedCarryoverDays": 3,
    "usedCurrentYearDays": 7,
    "remainingDays": 21,
    "remainingCarryoverDays": 2,
    "remainingCurrentYearDays": 19,
    "carryoverExpiresAt": "2026-03-31",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-15T14:20:00Z"
  }
}
```

---

### Error Responses (oba endpointy):

**400 Bad Request - Invalid UUID:**
```json
{
  "error": "Invalid user ID format",
  "details": {
    "userId": ["Invalid UUID format"]
  }
}
```

**400 Bad Request - Invalid year:**
```json
{
  "error": "Invalid year parameter",
  "details": {
    "year": ["Year must be between 2000 and 2100"]
  }
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden - Cannot view other user's allowances:**
```json
{
  "error": "Forbidden: You can only view your own vacation allowances"
}
```

**403 Forbidden - User soft-deleted:**
```json
{
  "error": "Forbidden: Cannot access vacation allowances for deleted user"
}
```

**404 Not Found - User not found:**
```json
{
  "error": "User not found"
}
```

**404 Not Found - Allowance not found:**
```json
{
  "error": "Vacation allowance for year 2026 not found"
}
```

**404 Not Found - No allowances:**
```json
{
  "error": "No vacation allowances found for this user"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

## 5. Przepływ danych

### Endpoint 1: GET /api/users/:userId/vacation-allowances

```
1. Request → API Handler (/api/users/[userId]/vacation-allowances/index.ts)
   ↓
2. Walidacja path parameter (userId) - Zod schema
   ↓
3. Walidacja query parameter (year) - Zod schema
   ↓
4. Pobranie currentUserId (z DEFAULT_USER_ID - tymczasowo)
   ↓
5. Pobranie roli current user z profiles (RBAC)
   ↓
6. Sprawdzenie autoryzacji:
   - EMPLOYEE: tylko własne pule (currentUserId === targetUserId)
   - HR/ADMINISTRATOR: wszystkie pule
   ↓
7. Wywołanie service: getVacationAllowances(supabase, currentUserId, currentUserRole, targetUserId, year?)
   ↓
8. Service Layer (vacation-allowances.service.ts):
   a) Sprawdzenie czy user istnieje i nie jest usunięty
   b) Pobranie vacation_allowances dla userId (opcjonalnie filtrowane po year)
   c) Dla każdej allowance:
      - Obliczenie wykorzystanych dni z vacation_requests (status = APPROVED)
      - Algorytm: najpierw wykorzystujemy carryover_days, potem total_days
      - Uwzględnienie daty: carryover expires 31 marca
   d) Wzbogacenie każdej allowance o computed fields
   e) Zwrócenie listy allowances
   ↓
9. Response 200 OK z GetVacationAllowancesResponseDTO
```

### Endpoint 2: GET /api/users/:userId/vacation-allowances/:year

```
1. Request → API Handler (/api/users/[userId]/vacation-allowances/[year].ts)
   ↓
2. Walidacja path parameters (userId, year) - Zod schema
   ↓
3. Pobranie currentUserId (z DEFAULT_USER_ID - tymczasowo)
   ↓
4. Pobranie roli current user z profiles (RBAC)
   ↓
5. Sprawdzenie autoryzacji:
   - EMPLOYEE: tylko własne pule (currentUserId === targetUserId)
   - HR/ADMINISTRATOR: wszystkie pule
   ↓
6. Wywołanie service: getVacationAllowanceByYear(supabase, currentUserId, currentUserRole, targetUserId, year)
   ↓
7. Service Layer (vacation-allowances.service.ts):
   a) Sprawdzenie czy user istnieje i nie jest usunięty
   b) Pobranie vacation_allowance dla userId i year
   c) Jeśli nie znaleziono → throw Error 404
   d) Obliczenie wykorzystanych dni z vacation_requests (status = APPROVED)
   e) Wzbogacenie allowance o computed fields
   f) Zwrócenie allowance
   ↓
8. Response 200 OK z GetVacationAllowanceByYearResponseDTO
```

### Algorytm obliczania wykorzystanych dni:

```typescript
// Pseudokod
function calculateUsedDays(allowance, vacationRequests) {
  const carryoverExpiresAt = `${allowance.year}-03-31`;
  let usedCarryoverDays = 0;
  let usedCurrentYearDays = 0;
  
  // Sortujemy requesty po dacie rozpoczęcia
  const sortedRequests = vacationRequests
    .filter(req => req.status === 'APPROVED')
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  
  let remainingCarryover = allowance.carryover_days;
  
  for (const request of sortedRequests) {
    const daysNeeded = request.business_days_count;
    
    // Jeśli request jest przed 31 marca i mamy carryover
    if (request.start_date <= carryoverExpiresAt && remainingCarryover > 0) {
      const usedFromCarryover = Math.min(daysNeeded, remainingCarryover);
      usedCarryoverDays += usedFromCarryover;
      remainingCarryover -= usedFromCarryover;
      
      const remainingDays = daysNeeded - usedFromCarryover;
      if (remainingDays > 0) {
        usedCurrentYearDays += remainingDays;
      }
    } else {
      // Po 31 marca lub brak carryover - używamy dni z bieżącego roku
      usedCurrentYearDays += daysNeeded;
    }
  }
  
  return {
    usedCarryoverDays,
    usedCurrentYearDays,
    usedDays: usedCarryoverDays + usedCurrentYearDays
  };
}
```

## 6. Względy bezpieczeństwa

### Autoryzacja (RBAC - Role-Based Access Control)

**Zasady dostępu:**
1. **EMPLOYEE:**
   - Może zobaczyć **tylko swoje** vacation allowances
   - Próba dostępu do allowances innego użytkownika → 403 Forbidden
   
2. **HR:**
   - Może zobaczyć vacation allowances **wszystkich aktywnych użytkowników**
   - Nie może zobaczyć allowances usuniętych użytkowników (deleted_at IS NOT NULL)
   
3. **ADMINISTRATOR:**
   - Może zobaczyć vacation allowances **wszystkich użytkowników**
   - Może zobaczyć allowances usuniętych użytkowników

**Implementacja RBAC w service layer:**
```typescript
// Sprawdzenie uprawnień
if (currentUserRole === 'EMPLOYEE' && currentUserId !== targetUserId) {
  throw new Error('Forbidden: You can only view your own vacation allowances');
}

// Sprawdzenie soft-delete
if (user.deleted_at && currentUserRole !== 'ADMINISTRATOR') {
  throw new Error('Forbidden: Cannot access vacation allowances for deleted user');
}
```

### Walidacja danych wejściowych

**Zod schemas do utworzenia w `src/lib/schemas/vacation-allowances.schema.ts`:**

1. **userIdParamSchema** - walidacja UUID w path
2. **yearParamSchema** - walidacja roku (integer, 2000-2100)
3. **yearQuerySchema** - walidacja opcjonalnego query parameter
4. **getVacationAllowancesQuerySchema** - pełny schemat query params

**Zasady walidacji:**
- userId: musi być prawidłowym UUID
- year: musi być liczbą całkowitą w zakresie 2000-2100
- Query parameters: opcjonalne, ale jeśli podane - muszą być prawidłowe

### SQL Injection Protection

- Używamy Supabase Client z parametryzowanymi zapytaniami
- Wszystkie parametry są walidowane przez Zod przed użyciem
- Brak bezpośrednich SQL queries w kodzie

### Soft-delete Protection

- Sprawdzenie `deleted_at IS NULL` w service layer
- EMPLOYEE i HR nie mogą zobaczyć allowances usuniętych użytkowników
- ADMINISTRATOR może (dla audytu)

### Rate Limiting (przyszłość)

- Rozważyć implementację rate limiting dla publicznych endpointów
- Obecnie brak (do implementacji z pełną autentykacją)

## 7. Obsługa błędów

### Kategorie błędów i kody statusu:

| Błąd | Status | Warunek | Odpowiedź |
|------|--------|---------|-----------|
| Invalid UUID format | 400 | userId nie jest prawidłowym UUID | `{ error: "Invalid user ID format", details: {...} }` |
| Invalid year format | 400 | year nie jest liczbą | `{ error: "Invalid year parameter", details: {...} }` |
| Year out of range | 400 | year < 2000 lub year > 2100 | `{ error: "Invalid year parameter", details: {...} }` |
| Unauthorized | 401 | Brak currentUserId (auth nie działa) | `{ error: "Unauthorized" }` |
| Forbidden - not own data | 403 | EMPLOYEE próbuje zobaczyć cudze allowances | `{ error: "Forbidden: You can only view your own vacation allowances" }` |
| Forbidden - deleted user | 403 | Próba dostępu do allowances usuniętego użytkownika | `{ error: "Forbidden: Cannot access vacation allowances for deleted user" }` |
| User not found | 404 | User o podanym userId nie istnieje | `{ error: "User not found" }` |
| Allowance not found | 404 | Brak allowance dla danego roku | `{ error: "Vacation allowance for year {year} not found" }` |
| No allowances | 404 | Brak żadnych allowances dla użytkownika | `{ error: "No vacation allowances found for this user" }` |
| Database error | 500 | Błąd połączenia z bazą lub zapytania | `{ error: "Internal server error" }` |

### Error Handling Pattern:

```typescript
// W API Handler
try {
  // 1. Walidacja
  const validationResult = schema.safeParse(data);
  if (!validationResult.success) {
    return new Response(JSON.stringify({
      error: "Validation error",
      details: validationResult.error.flatten().fieldErrors
    }), { status: 400 });
  }
  
  // 2. Wywołanie service
  const result = await service.method();
  
  // 3. Success response
  return new Response(JSON.stringify(result), { status: 200 });
  
} catch (error) {
  console.error('[GET /api/...] Error:', error);
  
  // 4. Error mapping
  if (error.message.includes('not found')) {
    return new Response(JSON.stringify({ error: error.message }), { status: 404 });
  }
  if (error.message.includes('Forbidden')) {
    return new Response(JSON.stringify({ error: error.message }), { status: 403 });
  }
  
  // 5. Generic error
  return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
}
```

### Logowanie błędów:

- Wszystkie błędy logowane do console.error z prefiksem `[GET /api/users/:userId/vacation-allowances]`
- W przyszłości: rozważyć integrację z zewnętrznym systemem logowania (Sentry, Datadog)
- Nie logujemy wrażliwych danych (hasła, tokeny)

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła:

1. **N+1 Query Problem:**
   - Problem: Dla każdej allowance osobne zapytanie do vacation_requests
   - Rozwiązanie: Jedno zapytanie JOIN lub agregacja w bazie

2. **Obliczenia w JavaScript:**
   - Problem: Obliczanie wykorzystanych dni w JavaScript (liczne iteracje)
   - Rozwiązanie: Rozważyć database function lub materialized view

3. **Brak indeksów:**
   - Problem: Zapytania po user_id i year mogą być wolne
   - Rozwiązanie: Dodać composite index na (user_id, year)

### Strategie optymalizacji:

#### 1. Database Indexes (priorytet)

Dodać w nowej migracji:
```sql
-- Composite index dla vacation_allowances
CREATE INDEX IF NOT EXISTS idx_vacation_allowances_user_year 
ON vacation_allowances(user_id, year DESC);

-- Index dla vacation_requests (do obliczeń)
CREATE INDEX IF NOT EXISTS idx_vacation_requests_user_status_dates
ON vacation_requests(user_id, status, start_date, end_date)
WHERE status = 'APPROVED';
```

#### 2. Optymalizacja zapytań

**Opcja A: Pojedyncze zapytanie z agregacją (preferowana):**
```sql
-- Pobierz allowances z policzonymi dniami w jednym zapytaniu
SELECT 
  va.*,
  COALESCE(SUM(vr.business_days_count), 0) as used_days_total
FROM vacation_allowances va
LEFT JOIN vacation_requests vr 
  ON vr.user_id = va.user_id 
  AND EXTRACT(YEAR FROM vr.start_date) = va.year
  AND vr.status = 'APPROVED'
WHERE va.user_id = $1
GROUP BY va.id
ORDER BY va.year DESC;
```

**Opcja B: Database Function (dla złożonej logiki carry-over):**
```sql
-- Funkcja do obliczania wykorzystanych dni z carry-over logic
CREATE OR REPLACE FUNCTION calculate_used_allowance_days(
  p_allowance_id UUID,
  p_year INTEGER,
  p_user_id UUID
) RETURNS TABLE (
  used_carryover_days INTEGER,
  used_current_year_days INTEGER,
  used_days_total INTEGER
) AS $$
-- Implementacja algorytmu carry-over
$$ LANGUAGE plpgsql;
```

#### 3. Caching (przyszłość)

- Cache vacation allowances na 5-15 minut (dane zmieniają się rzadko)
- Invalidacja cache przy zatwierdzeniu/anulowaniu urlopu
- Redis lub in-memory cache (Node.js)

#### 4. Pagination (jeśli potrzebna)

- Dla użytkowników z wieloma latami allowances (mało prawdopodobne)
- Opcjonalnie: limit + offset w query parameters
- Domyślnie: wszystkie lata (sortowane DESC)

### Szacowany czas odpowiedzi:

- **Bez optymalizacji:** 100-300ms (zależnie od liczby lat i requestów)
- **Z indeksami:** 20-50ms
- **Z database function:** 10-30ms
- **Z cache:** 1-5ms (hit), 10-30ms (miss)

### Monitoring:

- Logować czas wykonania zapytań (console.time/timeEnd)
- Monitorować wolne zapytania (> 100ms)
- W przyszłości: APM tools (New Relic, Datadog)

## 9. Kroki implementacji

### Krok 1: Utworzenie typów DTO w `src/types.ts`

**Plik:** `src/types.ts`

**Akcja:** Dodać nowe typy na końcu pliku, w sekcji "Vacation Allowances DTOs"

**Typy do dodania:**
- `GetVacationAllowancesQueryDTO`
- `VacationAllowanceDTO`
- `GetVacationAllowancesResponseDTO`
- `GetVacationAllowanceByYearResponseDTO`

**Czas:** 15 min

---

### Krok 2: Utworzenie schematów walidacji Zod

**Plik:** `src/lib/schemas/vacation-allowances.schema.ts` (nowy)

**Akcja:** Utworzyć nowy plik ze schematami Zod

**Schematy do utworzenia:**
- `userIdParamSchema` - walidacja UUID userId
- `yearParamSchema` - walidacja roku (integer, 2000-2100)
- `yearQuerySchema` - walidacja opcjonalnego query parameter year
- `getVacationAllowancesQuerySchema` - pełny schemat query params

**Przykład:**
```typescript
import { z } from "zod";

export const userIdParamSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});

export const yearParamSchema = z.object({
  year: z.string()
    .regex(/^\d{4}$/, "Year must be a 4-digit number")
    .transform(Number)
    .refine((val) => val >= 2000 && val <= 2100, {
      message: "Year must be between 2000 and 2100",
    }),
});

export const yearQuerySchema = z.object({
  year: z.string()
    .regex(/^\d{4}$/, "Year must be a 4-digit number")
    .transform(Number)
    .refine((val) => val >= 2000 && val <= 2100, {
      message: "Year must be between 2000 and 2100",
    })
    .optional(),
});

export const getVacationAllowancesQuerySchema = z.object({
  year: z.string()
    .regex(/^\d{4}$/, "Year must be a 4-digit number")
    .transform(Number)
    .refine((val) => val >= 2000 && val <= 2100, {
      message: "Year must be between 2000 and 2100",
    })
    .optional(),
});
```

**Czas:** 20 min

---

### Krok 3: Utworzenie service layer

**Plik:** `src/lib/services/vacation-allowances.service.ts` (nowy)

**Akcja:** Utworzyć nowy serwis z logiką biznesową

**Funkcje do implementacji:**

1. **getVacationAllowances** - główna funkcja do pobierania pul
   - Parametry: supabase, currentUserId, currentUserRole, targetUserId, year?
   - Sprawdzenie uprawnień (RBAC)
   - Sprawdzenie czy user istnieje i nie jest usunięty
   - Pobranie vacation_allowances (z filtrowaniem po year jeśli podany)
   - Dla każdej allowance: obliczenie wykorzystanych dni
   - Zwrócenie GetVacationAllowancesResponseDTO

2. **getVacationAllowanceByYear** - funkcja do pobierania konkretnej puli
   - Parametry: supabase, currentUserId, currentUserRole, targetUserId, year
   - Podobna logika jak getVacationAllowances, ale dla konkretnego roku
   - Zwrócenie GetVacationAllowanceByYearResponseDTO lub throw Error 404

3. **Helper: calculateUsedDaysForAllowance** - obliczanie wykorzystanych dni
   - Parametry: supabase, allowanceId, userId, year, carryoverDays
   - Pobranie APPROVED vacation_requests dla danego roku
   - Implementacja algorytmu carry-over (najpierw carry-over do 31 marca, potem current year)
   - Zwrócenie: { usedCarryoverDays, usedCurrentYearDays, usedDays }

4. **Helper: enrichAllowanceWithComputedFields** - dodanie computed fields
   - Parametry: allowance, usedDaysData
   - Obliczenie remainingDays, remainingCarryoverDays, remainingCurrentYearDays
   - Dodanie carryoverExpiresAt (31 marca danego roku)
   - Konwersja snake_case → camelCase
   - Zwrócenie VacationAllowanceDTO

**Struktura:**
```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type {
  GetVacationAllowancesResponseDTO,
  GetVacationAllowanceByYearResponseDTO,
  VacationAllowanceDTO,
} from "@/types";

export async function getVacationAllowances(
  supabase: SupabaseClient,
  currentUserId: string,
  currentUserRole: "ADMINISTRATOR" | "HR" | "EMPLOYEE",
  targetUserId: string,
  year?: number
): Promise<GetVacationAllowancesResponseDTO> {
  // Implementacja
}

export async function getVacationAllowanceByYear(
  supabase: SupabaseClient,
  currentUserId: string,
  currentUserRole: "ADMINISTRATOR" | "HR" | "EMPLOYEE",
  targetUserId: string,
  year: number
): Promise<VacationAllowanceDTO> {
  // Implementacja
}

async function calculateUsedDaysForAllowance(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  carryoverDays: number
): Promise<{
  usedCarryoverDays: number;
  usedCurrentYearDays: number;
  usedDays: number;
}> {
  // Implementacja algorytmu carry-over
}

function enrichAllowanceWithComputedFields(
  allowance: any,
  usedDaysData: {
    usedCarryoverDays: number;
    usedCurrentYearDays: number;
    usedDays: number;
  }
): VacationAllowanceDTO {
  // Konwersja i dodanie computed fields
}
```

**Czas:** 90-120 min (najważniejsza część)

---

### Krok 4: Utworzenie API endpoint - GET /api/users/:userId/vacation-allowances

**Plik:** `src/pages/api/users/[userId]/vacation-allowances/index.ts` (nowy)

**Akcja:** Utworzyć folder i plik endpoint

**Struktura folderu:**
```
src/pages/api/users/
  [userId]/
    vacation-allowances/
      index.ts        <- nowy plik
      [year].ts       <- utworzony w kroku 5
```

**Implementacja:**
1. Import zależności (service, schemas, types)
2. `export const prerender = false`
3. Implementacja GET handler:
   - Walidacja path parameter (userId)
   - Walidacja query parameter (year)
   - Pobranie currentUserId i roli
   - Wywołanie service.getVacationAllowances()
   - Obsługa błędów (try-catch z mapping do statusów)
   - Zwrócenie Response

**Przykład struktury:**
```typescript
import type { APIRoute } from "astro";
import { getVacationAllowances } from "@/lib/services/vacation-allowances.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import {
  userIdParamSchema,
  getVacationAllowancesQuerySchema,
} from "@/lib/schemas/vacation-allowances.schema";

export const prerender = false;

export const GET: APIRoute = async ({ params, url, locals }) => {
  try {
    // 1. Walidacja path param
    const paramsValidation = userIdParamSchema.safeParse(params);
    if (!paramsValidation.success) {
      return new Response(JSON.stringify({
        error: "Invalid user ID format",
        details: paramsValidation.error.flatten().fieldErrors,
      }), { status: 400 });
    }
    
    // 2. Walidacja query params
    const queryParams = Object.fromEntries(url.searchParams);
    const queryValidation = getVacationAllowancesQuerySchema.safeParse(queryParams);
    if (!queryValidation.success) {
      return new Response(JSON.stringify({
        error: "Invalid query parameters",
        details: queryValidation.error.flatten().fieldErrors,
      }), { status: 400 });
    }
    
    // 3. Auth + RBAC
    const currentUserId = DEFAULT_USER_ID;
    const { data: currentUserProfile } = await locals.supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single();
    
    // 4. Wywołanie service
    const result = await getVacationAllowances(
      locals.supabase,
      currentUserId,
      currentUserProfile.role,
      paramsValidation.data.userId,
      queryValidation.data.year
    );
    
    // 5. Success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    // Error handling
  }
};
```

**Czas:** 30-45 min

---

### Krok 5: Utworzenie API endpoint - GET /api/users/:userId/vacation-allowances/:year

**Plik:** `src/pages/api/users/[userId]/vacation-allowances/[year].ts` (nowy)

**Akcja:** Utworzyć plik endpoint dla konkretnego roku

**Implementacja:**
1. Import zależności
2. `export const prerender = false`
3. Implementacja GET handler:
   - Walidacja path parameters (userId, year)
   - Pobranie currentUserId i roli
   - Wywołanie service.getVacationAllowanceByYear()
   - Obsługa błędów
   - Zwrócenie Response

**Struktura podobna do kroku 4, ale:**
- Walidacja dwóch path params (userId + year)
- Wywołanie getVacationAllowanceByYear() zamiast getVacationAllowances()
- Response format: `{ data: VacationAllowanceDTO }` zamiast `{ userId, allowances: [] }`

**Czas:** 20-30 min

---

### Krok 6: Dodanie indeksów bazy danych (opcjonalne, ale zalecane)

**Plik:** `supabase/migrations/20260111000001_add_vacation_allowances_indexes.sql` (nowy)

**Akcja:** Utworzyć nową migrację z indeksami

**SQL do wykonania:**
```sql
-- Composite index dla vacation_allowances
CREATE INDEX IF NOT EXISTS idx_vacation_allowances_user_year 
ON vacation_allowances(user_id, year DESC);

-- Index dla vacation_requests (do obliczeń wykorzystanych dni)
CREATE INDEX IF NOT EXISTS idx_vacation_requests_user_status_dates
ON vacation_requests(user_id, status, start_date, end_date)
WHERE status = 'APPROVED';

-- Komentarze
COMMENT ON INDEX idx_vacation_allowances_user_year IS 
  'Composite index for efficient lookup of vacation allowances by user and year';

COMMENT ON INDEX idx_vacation_requests_user_status_dates IS 
  'Index for calculating used vacation days - only APPROVED requests';
```

**Czas:** 10 min

---

### Krok 7: Utworzenie testów API (shell scripts)

**Pliki do utworzenia w `tests/api/`:**
1. `vacation-allowances-list.test.sh`
2. `vacation-allowances-by-year.test.sh`

**Akcja:** Utworzyć skrypty testowe podobne do istniejących

**Test cases do pokrycia:**

**vacation-allowances-list.test.sh:**
- ✓ GET all allowances for user (200)
- ✓ GET allowances filtered by year (200)
- ✓ GET allowances - invalid userId format (400)
- ✓ GET allowances - invalid year format (400)
- ✓ GET allowances - year out of range (400)
- ✓ GET allowances - user not found (404)
- ✓ GET allowances - forbidden for other EMPLOYEE (403)
- ✓ GET allowances - allowed for HR (200)

**vacation-allowances-by-year.test.sh:**
- ✓ GET allowance for specific year (200)
- ✓ GET allowance - invalid userId format (400)
- ✓ GET allowance - invalid year format (400)
- ✓ GET allowance - year out of range (400)
- ✓ GET allowance - user not found (404)
- ✓ GET allowance - allowance not found (404)
- ✓ GET allowance - forbidden for other EMPLOYEE (403)
- ✓ GET allowance - allowed for HR (200)

**Struktura testu:**
```bash
#!/bin/bash
source "$(dirname "$0")/test-helpers.sh"

TEST_NAME="GET /api/users/:userId/vacation-allowances"

# Test 1: Success - get all allowances
run_test "GET $API_URL/users/$USER_ID/vacation-allowances" \
  200 \
  '.allowances | length > 0' \
  "Should return list of allowances"

# Test 2: Success - get allowances for specific year
run_test "GET $API_URL/users/$USER_ID/vacation-allowances?year=2026" \
  200 \
  '.allowances[0].year == 2026' \
  "Should return allowance for year 2026"

# ... więcej testów
```

**Czas:** 45-60 min

---

### Krok 8: Aktualizacja dokumentacji

**Pliki do aktualizacji:**
1. `docs/API_EXAMPLES.md` - dodać przykłady wywołań
2. `README.md` - zaktualizować listę endpointów (jeśli istnieje)
3. `.ai/view-implementation-plan.md` - ten plik (zostanie utworzony)

**Akcja:** Dodać dokumentację z przykładami curl

**Przykład dla API_EXAMPLES.md:**
```markdown
### Get User Vacation Allowances

Get all vacation allowances for a user (optionally filtered by year).

**Request:**
```bash
# Get all allowances
curl -X GET "http://localhost:4321/api/users/USER_ID/vacation-allowances"

# Get allowances for specific year
curl -X GET "http://localhost:4321/api/users/USER_ID/vacation-allowances?year=2026"
```

**Response (200 OK):**
```json
{
  "userId": "uuid",
  "allowances": [...]
}
```

### Get Vacation Allowance by Year

Get vacation allowance for specific year.

**Request:**
```bash
curl -X GET "http://localhost:4321/api/users/USER_ID/vacation-allowances/2026"
```

**Response (200 OK):**
```json
{
  "data": {...}
}
```
```

**Czas:** 20 min

---

### Krok 9: Uruchomienie migracji i testów

**Akcje:**
1. Uruchomić nową migrację (jeśli została utworzona w kroku 6):
   ```bash
   supabase db reset
   ```

2. Uruchomić serwer developerski:
   ```bash
   npm run dev
   ```

3. Uruchomić testy API:
   ```bash
   cd tests/api
   ./vacation-allowances-list.test.sh
   ./vacation-allowances-by-year.test.sh
   ```

4. Sprawdzić w przeglądarce/Postman:
   - GET http://localhost:4321/api/users/USER_ID/vacation-allowances
   - GET http://localhost:4321/api/users/USER_ID/vacation-allowances?year=2026
   - GET http://localhost:4321/api/users/USER_ID/vacation-allowances/2026

5. Sprawdzić edge cases:
   - Invalid UUID
   - Invalid year
   - Non-existent user
   - Non-existent allowance
   - RBAC (różne role użytkowników)

**Czas:** 30-45 min

---

### Krok 10: Code review i refactoring (opcjonalny)

**Akcje:**
1. Przejrzeć kod pod kątem:
   - Spójności z istniejącymi endpointami
   - Przestrzegania coding guidelines
   - Poprawności typów TypeScript
   - Obsługi błędów
   - Logowania

2. Uruchomić lintery:
   ```bash
   npm run lint
   ```

3. Sprawdzić błędy TypeScript:
   ```bash
   npx tsc --noEmit
   ```

4. Zrefaktorować jeśli potrzeba:
   - Wydzielić powtarzalną logikę
   - Uprościć złożone funkcje
   - Dodać komentarze JSDoc

**Czas:** 30-45 min

---

## Podsumowanie kroków:

| Krok | Akcja | Plik | Czas |
|------|-------|------|------|
| 1 | Dodać typy DTO | `src/types.ts` | 15 min |
| 2 | Utworzyć schematy Zod | `src/lib/schemas/vacation-allowances.schema.ts` | 20 min |
| 3 | Utworzyć service layer | `src/lib/services/vacation-allowances.service.ts` | 90-120 min |
| 4 | Endpoint: GET list | `src/pages/api/users/[userId]/vacation-allowances/index.ts` | 30-45 min |
| 5 | Endpoint: GET by year | `src/pages/api/users/[userId]/vacation-allowances/[year].ts` | 20-30 min |
| 6 | Dodać indeksy DB | `supabase/migrations/...sql` | 10 min |
| 7 | Utworzyć testy API | `tests/api/vacation-allowances-*.test.sh` | 45-60 min |
| 8 | Aktualizować docs | `docs/API_EXAMPLES.md` | 20 min |
| 9 | Uruchomić i przetestować | - | 30-45 min |
| 10 | Code review | - | 30-45 min |

**Całkowity szacowany czas:** 4.5 - 6.5 godzin

---

## Dodatkowe uwagi:

### Dependencies:
- Brak nowych zależności npm
- Używamy istniejących: Astro, Zod, Supabase Client

### Kompatybilność wsteczna:
- Nowe endpointy, brak zmian w istniejących
- Brak breaking changes

### Bezpieczeństwo:
- RBAC zgodny z istniejącymi endpointami
- Walidacja zgodna z best practices projektu
- Soft-delete handling

### Przyszłe rozszerzenia:
- Endpoint do tworzenia/aktualizacji vacation_allowances (dla admina)
- Endpoint do automatycznego generowania allowances na nowy rok
- Webhook do aktualizacji allowances przy approve/cancel urlopu
- Real-time updates (Supabase Realtime)
- Caching layer

### Znane ograniczenia:
- Obecnie używamy DEFAULT_USER_ID (pełna auth będzie później)
- Brak rate limiting
- Algorytm carry-over zakłada polski system (31 marca expiry)
- Brak obsługi świąt (public_holidays) w obliczeniach

---

## Checklist przed ukończeniem:

- [ ] Wszystkie typy dodane do `src/types.ts`
- [ ] Schematy Zod utworzone i przetestowane
- [ ] Service layer działa poprawnie
- [ ] Oba endpointy działają (200 OK)
- [ ] Obsługa błędów działa (400, 403, 404, 500)
- [ ] RBAC działa poprawnie (EMPLOYEE, HR, ADMIN)
- [ ] Indeksy dodane do bazy danych
- [ ] Testy API przechodzą (wszystkie green)
- [ ] Dokumentacja zaktualizowana
- [ ] Linter i TypeScript bez błędów
- [ ] Code review przeprowadzony

---

**Koniec planu implementacji**

