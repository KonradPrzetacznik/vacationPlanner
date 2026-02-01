# API Endpoint Implementation Plan: Get Vacation Request & Create Vacation Request

## 1. Przegląd punktu końcowego

Ten plan obejmuje implementację dwóch endpointów API związanych z pojedynczymi wnioskami urlopowymi:

### GET /api/vacation-requests/:id

Endpoint służy do pobierania szczegółowych informacji o pojedynczym wniosku urlopowym. Dostęp do danych jest kontrolowany przez system RBAC (Role-Based Access Control):

- **EMPLOYEE**: Może przeglądać tylko swoje własne wnioski urlopowe
- **HR**: Może przeglądać wnioski członków zespołów, do których należy
- **ADMINISTRATOR**: Może przeglądać wszystkie wnioski w systemie

Endpoint zwraca pełne informacje o wniosku, włączając dane użytkownika składającego wniosek oraz osoby, która go przetworzyła (jeśli dotyczy).

### POST /api/vacation-requests

Endpoint służy do składania nowych wniosków urlopowych przez użytkowników. Endpoint:

- Przyjmuje daty rozpoczęcia i zakończenia urlopu
- Automatycznie oblicza liczbę dni roboczych (z pominięciem weekendów)
- Waliduje dostępność dni urlopowych w puli użytkownika
- Sprawdza, czy nie istnieją nakładające się wnioski
- Tworzy wniosek ze statusem SUBMITTED

## 2. Szczegóły żądania

### GET /api/vacation-requests/:id

#### Metoda HTTP

`GET`

#### Struktura URL

```
/api/vacation-requests/:id
```

#### Parametry URL

| Parametr | Typ  | Wymagany | Walidacja   | Opis                             |
| -------- | ---- | -------- | ----------- | -------------------------------- |
| `id`     | UUID | Tak      | Format UUID | Identyfikator wniosku urlopowego |

#### Przykładowe żądania

```http
GET /api/vacation-requests/123e4567-e89b-12d3-a456-426614174000
```

#### Request Body

Brak (metoda GET).

#### Headers

```
Authorization: Bearer <token>  # Będzie zaimplementowane wraz z pełną autentykacją
```

---

### POST /api/vacation-requests

#### Metoda HTTP

`POST`

#### Struktura URL

```
/api/vacation-requests
```

#### Request Body

```json
{
  "startDate": "2026-01-10",
  "endDate": "2026-01-15"
}
```

| Pole        | Typ    | Wymagane | Walidacja                                  | Opis                    |
| ----------- | ------ | -------- | ------------------------------------------ | ----------------------- |
| `startDate` | string | Tak      | YYYY-MM-DD, nie w przeszłości, nie weekend | Data rozpoczęcia urlopu |
| `endDate`   | string | Tak      | YYYY-MM-DD, >= startDate, nie weekend      | Data zakończenia urlopu |

#### Przykładowe żądania

```http
POST /api/vacation-requests
Content-Type: application/json

{
  "startDate": "2026-01-10",
  "endDate": "2026-01-15"
}
```

#### Headers

```
Content-Type: application/json
Authorization: Bearer <token>  # Będzie zaimplementowane wraz z pełną autentykacją
```

## 3. Wykorzystywane typy

### Typy do dodania w `src/types.ts`

```typescript
/**
 * Vacation request details DTO
 * Extended version with full user and processedBy information
 * Connected to: Database['public']['Tables']['vacation_requests']['Row']
 * Connected to: Database['public']['Tables']['profiles']['Row']
 */
export interface VacationRequestDetailsDTO {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  startDate: string; // ISO date
  endDate: string; // ISO date
  businessDaysCount: number;
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  processedByUserId: string | null;
  processedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  processedAt: string | null; // ISO datetime
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

/**
 * Get vacation request by ID response DTO
 */
export interface GetVacationRequestByIdResponseDTO {
  data: VacationRequestDetailsDTO;
}

/**
 * Create vacation request command DTO
 * Used by employees to submit new vacation requests
 */
export interface CreateVacationRequestDTO {
  startDate: string; // ISO date format YYYY-MM-DD
  endDate: string; // ISO date format YYYY-MM-DD
}

/**
 * Create vacation request response DTO
 * Returned after successful vacation request creation
 */
export interface CreateVacationRequestResponseDTO {
  id: string;
  userId: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  businessDaysCount: number;
  status: "SUBMITTED";
  createdAt: string; // ISO datetime
}
```

### Istniejące typy do wykorzystania

- `SupabaseClient` - z `src/db/supabase.client.ts`
- `Database` - z `src/db/database.types.ts` (typy tabeli `vacation_requests`, `profiles`, `vacation_allowances`)
- `VacationRequestListItemDTO` - bazowy typ dla informacji o wniosku

## 4. Szczegóły odpowiedzi

### GET /api/vacation-requests/:id

#### Sukces (200 OK)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "user-uuid",
  "user": {
    "id": "user-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  },
  "startDate": "2026-01-10",
  "endDate": "2026-01-15",
  "businessDaysCount": 4,
  "status": "APPROVED",
  "processedByUserId": "hr-uuid",
  "processedBy": {
    "id": "hr-uuid",
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "processedAt": "2026-01-02T10:00:00Z",
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-02T10:00:00Z"
}
```

#### Błąd walidacji (400 Bad Request)

```json
{
  "error": "Invalid vacation request ID format"
}
```

#### Brak autoryzacji (401 Unauthorized)

```json
{
  "error": "Not authenticated"
}
```

#### Brak uprawnień (403 Forbidden)

```json
{
  "error": "You can only view your own vacation requests"
}
```

lub

```json
{
  "error": "You are not authorized to view this vacation request"
}
```

#### Zasób nie znaleziony (404 Not Found)

```json
{
  "error": "Vacation request not found"
}
```

#### Błąd serwera (500 Internal Server Error)

```json
{
  "error": "Failed to fetch vacation request"
}
```

---

### POST /api/vacation-requests

#### Sukces (201 Created)

```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "startDate": "2026-01-10",
  "endDate": "2026-01-15",
  "businessDaysCount": 4,
  "status": "SUBMITTED",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

#### Błąd walidacji (400 Bad Request)

```json
{
  "error": "Invalid request data",
  "details": {
    "startDate": ["Start date cannot be in the past"],
    "endDate": ["End date must be after or equal to start date"]
  }
}
```

lub

```json
{
  "error": "Dates cannot fall on weekends"
}
```

lub

```json
{
  "error": "Insufficient vacation days available"
}
```

#### Brak autoryzacji (401 Unauthorized)

```json
{
  "error": "Not authenticated"
}
```

#### Konflikt (409 Conflict)

```json
{
  "error": "You already have a vacation request for overlapping dates"
}
```

#### Błąd serwera (500 Internal Server Error)

```json
{
  "error": "Failed to create vacation request"
}
```

## 5. Przepływ danych

### Architektura warstwowa

```
Request → API Endpoint → Validation Layer → Service Layer → Database → Response
```

### GET /api/vacation-requests/:id - Szczegółowy przepływ

1. **API Endpoint** (`src/pages/api/vacation-requests/[id].ts`)
   - Odbiera żądanie HTTP GET
   - Ekstrahuje `id` z params
   - Pobiera supabase client z `context.locals.supabase`
2. **Validation Layer** (Zod schema)
   - Waliduje format UUID parametru `id`
   - Zwraca błąd 400 jeśli nieprawidłowy format
3. **Service Layer** (`src/lib/services/vacation-requests.service.ts` - funkcja `getVacationRequestById()`)
   - **Krok 1**: Pobiera rolę bieżącego użytkownika z tabeli `profiles`
   - **Krok 2**: Pobiera wniosek urlopowy z bazy wraz z:
     - Danymi użytkownika składającego wniosek (JOIN profiles)
     - Danymi osoby przetwarzającej (LEFT JOIN profiles dla processedBy)
   - **Krok 3**: Sprawdza czy wniosek istnieje, jeśli nie → 404
   - **Krok 4**: Implementuje logikę RBAC:
     - **EMPLOYEE**: Sprawdza czy `request.user_id === currentUserId`, jeśli nie → 403
     - **HR**: Sprawdza czy użytkownik składający wniosek należy do zespołu HR-a
       - Query do `team_members` dla obu użytkowników
       - Sprawdza czy mają wspólny zespół
       - Jeśli nie → 403
     - **ADMINISTRATOR**: Brak ograniczeń
   - **Krok 5**: Mapuje wynik do DTO (snake_case → camelCase)
   - **Krok 6**: Zwraca sformatowaną odpowiedź
4. **Database Layer** (Supabase PostgreSQL)
   - Wykonuje zapytanie z JOINami
   - Zwraca wynik
5. **Response**
   - Serwis zwraca dane do endpointu
   - Endpoint serializuje do JSON
   - Zwraca response z kodem 200

#### Interakcja z bazą danych (GET)

```sql
SELECT
  vr.id,
  vr.user_id,
  vr.start_date,
  vr.end_date,
  vr.business_days_count,
  vr.status,
  vr.processed_by_user_id,
  vr.processed_at,
  vr.created_at,
  vr.updated_at,
  -- User data
  u.id as user_id,
  u.first_name as user_first_name,
  u.last_name as user_last_name,
  u.email as user_email,
  -- ProcessedBy data
  pb.id as processed_by_id,
  pb.first_name as processed_by_first_name,
  pb.last_name as processed_by_last_name
FROM vacation_requests vr
INNER JOIN profiles u ON vr.user_id = u.id
LEFT JOIN profiles pb ON vr.processed_by_user_id = pb.id
WHERE vr.id = $id
```

**Sprawdzanie uprawnień HR** (jeśli HR i user_id !== currentUserId):

```sql
SELECT EXISTS(
  SELECT 1
  FROM team_members tm1
  INNER JOIN team_members tm2 ON tm1.team_id = tm2.team_id
  WHERE tm1.user_id = $currentUserId
    AND tm2.user_id = $requestUserId
) as has_common_team
```

---

### POST /api/vacation-requests - Szczegółowy przepływ

1. **API Endpoint** (`src/pages/api/vacation-requests/index.ts`)
   - Odbiera żądanie HTTP POST
   - Parsuje request body
   - Pobiera supabase client z `context.locals.supabase`
2. **Validation Layer** (Zod schema)
   - Waliduje format dat (YYYY-MM-DD)
   - Waliduje że daty są poprawne
   - Wykonuje refinements:
     - Sprawdza czy daty nie są w przeszłości
     - Sprawdza czy endDate >= startDate
     - Sprawdza czy daty nie przypadają w weekend
   - Zwraca błędy walidacji lub zwalidowane dane
3. **Service Layer** (`src/lib/services/vacation-requests.service.ts` - funkcja `createVacationRequest()`)
   - **Krok 1**: Pobiera dane bieżącego użytkownika (id, email)
   - **Krok 2**: Oblicza liczbę dni roboczych:
     - Wywołuje funkcję DB `calculate_business_days(startDate, endDate)`
   - **Krok 3**: Sprawdza dostępność dni urlopowych:
     - Query do `vacation_allowances` dla bieżącego roku
     - Query do `vacation_requests` - suma zatwierdzonych dni w tym roku
     - Oblicza: `available = (total_days + carryover_days) - used_days`
     - Jeśli `available < business_days_count` → 400 error
   - **Krok 4**: Sprawdza nakładające się wnioski:
     - Query do `vacation_requests` WHERE user_id = currentUserId
     - AND status IN ('SUBMITTED', 'APPROVED')
     - AND (startDate BETWEEN existing OR endDate BETWEEN existing OR existing BETWEEN startDate-endDate)
     - Jeśli istnieją → 409 error
   - **Krok 5**: Tworzy nowy wniosek:
     - INSERT INTO vacation_requests
     - status = 'SUBMITTED'
     - Zwraca utworzony rekord
   - **Krok 6**: Mapuje wynik do DTO
   - **Krok 7**: Zwraca sformatowaną odpowiedź
4. **Database Layer** (Supabase PostgreSQL)
   - Wykonuje funkcję calculate_business_days
   - Wykonuje queries walidacyjne
   - Tworzy rekord vacation_request
   - Zwraca utworzony rekord
5. **Response**
   - Serwis zwraca dane do endpointu
   - Endpoint serializuje do JSON
   - Zwraca response z kodem 201

#### Interakcja z bazą danych (POST)

**1. Obliczenie dni roboczych:**

```sql
SELECT calculate_business_days($startDate, $endDate) as business_days_count
```

**2. Sprawdzenie dostępności dni urlopowych:**

```sql
-- Pobierz pulę urlopową na bieżący rok
SELECT total_days, carryover_days
FROM vacation_allowances
WHERE user_id = $currentUserId
  AND year = EXTRACT(YEAR FROM CURRENT_DATE)

-- Oblicz wykorzystane dni w bieżącym roku
SELECT COALESCE(SUM(business_days_count), 0) as used_days
FROM vacation_requests
WHERE user_id = $currentUserId
  AND status IN ('SUBMITTED', 'APPROVED')
  AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
```

**3. Sprawdzenie nakładających się wniosków:**

```sql
SELECT EXISTS(
  SELECT 1
  FROM vacation_requests
  WHERE user_id = $currentUserId
    AND status IN ('SUBMITTED', 'APPROVED')
    AND (
      -- Nowy wniosek zaczyna się w trakcie istniejącego
      ($startDate BETWEEN start_date AND end_date)
      -- Nowy wniosek kończy się w trakcie istniejącego
      OR ($endDate BETWEEN start_date AND end_date)
      -- Istniejący wniosek zawiera się w nowym
      OR (start_date >= $startDate AND end_date <= $endDate)
    )
) as has_overlap
```

**4. Utworzenie wniosku:**

```sql
INSERT INTO vacation_requests (
  user_id,
  start_date,
  end_date,
  business_days_count,
  status
) VALUES (
  $currentUserId,
  $startDate,
  $endDate,
  $businessDaysCount,
  'SUBMITTED'
)
RETURNING *
```

## 6. Względy bezpieczeństwa

### Autentykacja

**Tymczasowa implementacja (development)**:

- Używany jest `DEFAULT_USER_ID` z konfiguracji
- Pozwala na testowanie funkcjonalności bez pełnej autentykacji

**Docelowa implementacja**:

- Autentykacja przez Supabase Auth
- Token JWT w header `Authorization: Bearer <token>`
- Weryfikacja tokenu w middleware
- Pobieranie `currentUserId` z sesji użytkownika
- Błąd 401 jeśli brak lub nieprawidłowy token

### Autoryzacja (RBAC)

#### GET /api/vacation-requests/:id

**EMPLOYEE**:

- Może przeglądać tylko własne wnioski
- Sprawdzenie: `request.user_id === currentUserId`
- Błąd 403 jeśli próbuje zobaczyć cudzy wniosek

**HR**:

- Może przeglądać wnioski członków swoich zespołów
- Sprawdzenie: czy user_id wniosku należy do tego samego zespołu co HR
- Błąd 403 jeśli użytkownik nie należy do żadnego wspólnego zespołu

**ADMINISTRATOR**:

- Może przeglądać wszystkie wnioski
- Brak ograniczeń

#### POST /api/vacation-requests

**Wszyscy uwierzytelnieni użytkownicy**:

- Mogą składać wnioski tylko dla siebie
- `user_id` wniosku jest automatycznie ustawiany na `currentUserId`
- Nie można składać wniosków w imieniu innych użytkowników

### Walidacja danych wejściowych

#### GET /api/vacation-requests/:id

- Walidacja UUID format dla `id`
- Wykorzystanie Zod schema do type-safe validation
- Sanityzacja input przez Supabase client (parametryzowane zapytania)

#### POST /api/vacation-requests

- Walidacja formatu dat (YYYY-MM-DD)
- Walidacja że daty są poprawne kalendarzowo
- Walidacja business rules:
  - Daty nie w przeszłości
  - Daty nie w weekendy
  - endDate >= startDate
- Walidacja dostępności dni urlopowych
- Walidacja braku nakładających się wniosków
- Wszystkie walidacje w Zod schema + service layer

### Zapobieganie atakom

**SQL Injection**:

- Chronione przez Supabase client
- Wszystkie zapytania używają parametryzacji
- Brak bezpośredniej konkatenacji SQL

**Information Disclosure**:

- Zwracanie tylko niezbędnych danych w response
- Email użytkownika tylko w GET (szczegóły), nie w listach
- Brak zwracania wrażliwych informacji w error messages

**Business Logic Bypass**:

- Wszystkie walidacje wykonywane po stronie serwera
- Nie polegamy na walidacji po stronie klienta
- Sprawdzenie puli urlopowej w bazie danych

**Race Conditions**:

- Ryzyko przy jednoczesnym tworzeniu nakładających się wniosków
- Rozwiązanie: sprawdzenie nakładających się wniosków bezpośrednio przed INSERT
- Rozważyć transakcje dla atomowości operacji

**Authorization Bypass**:

- Sprawdzanie uprawnień w service layer dla każdego żądania
- Nie polegamy na client-side authorization
- Zawsze weryfikujemy `currentUserId` z sesji, nigdy z parametrów żądania

### Rate Limiting

**Przyszła implementacja**:

- Ograniczenie liczby żądań na użytkownika/IP
- Zapobieganie spam'owi wniosków urlopowych
- Implementacja w Astro middleware
- Wykorzystanie Redis lub in-memory cache

## 7. Obsługa błędów

### GET /api/vacation-requests/:id

| Kod | Scenariusz                  | Komunikat                                              | Szczegóły                               |
| --- | --------------------------- | ------------------------------------------------------ | --------------------------------------- |
| 400 | Nieprawidłowy format UUID   | "Invalid vacation request ID format"                   | Parametr `id` nie jest poprawnym UUID   |
| 401 | Brak autentykacji           | "Not authenticated"                                    | Brak lub nieprawidłowy token (docelowo) |
| 403 | Brak uprawnień (EMPLOYEE)   | "You can only view your own vacation requests"         | Próba dostępu do cudzego wniosku        |
| 403 | Brak uprawnień (HR)         | "You are not authorized to view this vacation request" | User nie należy do zespołu HR-a         |
| 404 | Wniosek nie istnieje        | "Vacation request not found"                           | Brak wniosku o podanym ID               |
| 500 | Błąd bazy danych            | "Failed to fetch vacation request"                     | Błąd przy query do DB                   |
| 500 | Błąd pobierania użytkownika | "Failed to verify user permissions"                    | Błąd przy pobieraniu danych użytkownika |

### POST /api/vacation-requests

| Kod | Scenariusz                | Komunikat                                                   | Szczegóły                                   |
| --- | ------------------------- | ----------------------------------------------------------- | ------------------------------------------- |
| 400 | Nieprawidłowy format JSON | "Invalid request body"                                      | Błąd parsowania JSON                        |
| 400 | Nieprawidłowy format daty | "Invalid date format, expected YYYY-MM-DD"                  | Data nie w formacie YYYY-MM-DD              |
| 400 | Data w przeszłości        | "Start date cannot be in the past"                          | startDate < dzisiaj                         |
| 400 | Data w weekend            | "Dates cannot fall on weekends"                             | startDate lub endDate jest sobotą/niedzielą |
| 400 | Nieprawidłowy zakres dat  | "End date must be after or equal to start date"             | endDate < startDate                         |
| 400 | Brak dni urlopowych       | "Insufficient vacation days available"                      | Przekroczenie dostępnej puli urlopowej      |
| 401 | Brak autentykacji         | "Not authenticated"                                         | Brak lub nieprawidłowy token (docelowo)     |
| 409 | Nakładające się wnioski   | "You already have a vacation request for overlapping dates" | Konflikt z istniejącym wnioskiem            |
| 500 | Błąd obliczania dni       | "Failed to calculate business days"                         | Błąd wywołania funkcji DB                   |
| 500 | Błąd sprawdzania puli     | "Failed to check vacation allowance"                        | Błąd przy query vacation_allowances         |
| 500 | Błąd tworzenia wniosku    | "Failed to create vacation request"                         | Błąd przy INSERT do DB                      |

### Implementacja obsługi błędów

**W API Endpoint**:

```typescript
try {
  // Service call
} catch (error) {
  console.error("[GET /api/vacation-requests/:id] Error:", error);

  if (error instanceof Error) {
    // Authorization errors
    if (error.message.includes("only view your own") || error.message.includes("not authorized")) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Not found errors
    if (error.message.includes("not found")) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validation errors
    if (
      error.message.includes("Invalid") ||
      error.message.includes("cannot be in the past") ||
      error.message.includes("weekend")
    ) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Conflict errors
    if (error.message.includes("overlapping")) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Generic server error
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

**Logging**:

- Wszystkie błędy logowane do console.error z kontekstem
- Format: `[Endpoint] Error: message { context }`
- Zawiera: userId, requestId, parametry żądania, stack trace

## 8. Rozważania dotyczące wydajności

### GET /api/vacation-requests/:id

**Potencjalne wąskie gardła**:

1. **JOIN z tabelą profiles (dwukrotnie)**
   - Pobranie danych użytkownika i processedBy
   - Mitygacja: indeksy na foreign keys są już utworzone
   - Mitygacja: SELECT tylko potrzebnych kolumn

2. **Sprawdzanie uprawnień HR (query team_members)**
   - Dodatkowe zapytanie dla HR do weryfikacji wspólnych zespołów
   - Mitygacja: indeks na (user_id, team_id) w team_members już istnieje
   - Mitygacja: można cache'ować wynik dla sesji użytkownika

**Strategie optymalizacji**:

1. **Indeksy bazodanowe**:
   - `vacation_requests.id` (PRIMARY KEY) - już istnieje
   - `vacation_requests.user_id` - już istnieje (foreign key)
   - `team_members (user_id, team_id)` - już istnieje

2. **Optymalizacja zapytań**:
   - Używać `.select()` z konkretnymi kolumnami zamiast `SELECT *`
   - LEFT JOIN dla processedBy (może być NULL)
   - INNER JOIN dla user (zawsze wymagane)

3. **Caching** (przyszła implementacja):
   - Cache sprawdzenia uprawnień HR dla sesji
   - TTL: czas trwania sesji
   - Invalidacja przy zmianie membership w zespołach

4. **Monitoring**:
   - Logowanie czasu wykonania query
   - Alert jeśli > 500ms
   - Metryki: średni czas odpowiedzi, percentyle (p50, p95, p99)

### POST /api/vacation-requests

**Potencjalne wąskie gardła**:

1. **Funkcja calculate_business_days**
   - Wywołanie funkcji DB
   - Mitygacja: funkcja wykonuje się szybko dla typowych zakresów dat
   - Mitygacja: ograniczenie max długości urlopu (np. 30 dni)

2. **Sprawdzanie nakładających się wniosków**
   - Query po wszystkich wnioskach użytkownika
   - Mitygacja: indeks na (user_id, start_date, end_date, status) - do utworzenia
   - Mitygacja: filtrowanie tylko po status IN ('SUBMITTED', 'APPROVED')

3. **Sprawdzanie puli urlopowej**
   - Dwa zapytania: vacation_allowances + suma vacation_requests
   - Mitygacja: indeks na (user_id, year) w vacation_allowances już istnieje
   - Mitygacja: indeks na (user_id, status, start_date) w vacation_requests już istnieje

4. **Race condition przy jednoczesnym tworzeniu**
   - Dwóch użytkowników tworzy nakładające się wnioski jednocześnie
   - Mitygacja: sprawdzenie nakładania bezpośrednio przed INSERT
   - Mitygacja: rozważyć transakcje lub row-level locks

**Strategie optymalizacji**:

1. **Indeksy bazodanowe** (do utworzenia):

   ```sql
   -- Dla szybkiego sprawdzania nakładających się wniosków
   CREATE INDEX idx_vacation_requests_overlap
   ON vacation_requests (user_id, status, start_date, end_date)
   WHERE status IN ('SUBMITTED', 'APPROVED');
   ```

2. **Optymalizacja zapytań**:
   - Łączenie queries tam gdzie możliwe
   - Używanie EXISTS zamiast COUNT dla sprawdzania nakładania
   - Ograniczenie skanowania do bieżącego roku + buffer

3. **Walidacja wcześniejsza**:
   - Walidacja formatu dat w Zod (przed dotarciem do DB)
   - Walidacja business rules w Zod gdzie możliwe
   - Zmniejsza liczbę niepotrzebnych zapytań do DB

4. **Transakcje** (przyszła implementacja):
   - Owinięcie wszystkich operacji w transakcję
   - Zapewnia atomowość i izolację
   - Zapobiega race conditions

5. **Monitoring**:
   - Logowanie czasu całego procesu
   - Osobne metryki dla każdego kroku (calculate, check allowance, check overlap, insert)
   - Alert jeśli całość > 1s

6. **Rate limiting** (przyszła implementacja):
   - Ograniczenie do X wniosków na użytkownika na godzinę
   - Zapobiega spam'owi i DoS

### Benchmarki docelowe

**GET /api/vacation-requests/:id**:

- p50: < 100ms
- p95: < 250ms
- p99: < 500ms

**POST /api/vacation-requests**:

- p50: < 200ms
- p95: < 500ms
- p99: < 1000ms

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie - Aktualizacja typów

**Plik**: `src/types.ts`

**Zadania**:

1. Dodać `VacationRequestDetailsDTO` z pełnymi danymi użytkownika i processedBy
2. Dodać `GetVacationRequestByIdResponseDTO`
3. Dodać `CreateVacationRequestDTO`
4. Dodać `CreateVacationRequestResponseDTO`

**Kryteria akceptacji**:

- Typy zgodne z API specification
- Dokumentacja JSDoc dla każdego typu
- Pola snake_case w DB → camelCase w DTO
- Typy podłączone do Database types

---

### Krok 2: Walidacja - Schematy Zod

**Plik**: `src/lib/schemas/vacation-requests.schema.ts`

**Zadania**:

1. **Dodać schema dla GET /:id**:

   ```typescript
   export const GetVacationRequestByIdParamsSchema = z.object({
     id: z.string().uuid("Invalid vacation request ID format"),
   });
   ```

2. **Dodać schema dla POST /**:

   ```typescript
   export const CreateVacationRequestSchema = z
     .object({
       startDate: DateStringSchema,
       endDate: DateStringSchema,
     })
     .refine(
       (data) => {
         const start = new Date(data.startDate);
         const end = new Date(data.endDate);
         return end >= start;
       },
       {
         message: "End date must be after or equal to start date",
         path: ["endDate"],
       }
     )
     .refine(
       (data) => {
         const start = new Date(data.startDate);
         const today = new Date();
         today.setHours(0, 0, 0, 0);
         return start >= today;
       },
       {
         message: "Start date cannot be in the past",
         path: ["startDate"],
       }
     )
     .refine(
       (data) => {
         const start = new Date(data.startDate);
         const end = new Date(data.endDate);
         const startDay = start.getDay(); // 0 = Sunday, 6 = Saturday
         const endDay = end.getDay();
         return startDay !== 0 && startDay !== 6 && endDay !== 0 && endDay !== 6;
       },
       {
         message: "Dates cannot fall on weekends",
         path: ["startDate"],
       }
     );
   ```

3. Dodać type exports:
   ```typescript
   export type GetVacationRequestByIdParamsType = z.infer<typeof GetVacationRequestByIdParamsSchema>;
   export type CreateVacationRequestType = z.infer<typeof CreateVacationRequestSchema>;
   ```

**Kryteria akceptacji**:

- Schema waliduje format UUID
- Schema waliduje format dat
- Refinements sprawdzają business rules
- Czytelne error messages w języku angielskim
- Type-safe exports

---

### Krok 3: Logika biznesowa - Service Layer

**Plik**: `src/lib/services/vacation-requests.service.ts`

**Zadania**:

#### 3.1. Funkcja getVacationRequestById

```typescript
/**
 * Get vacation request by ID with authorization
 * Implements RBAC:
 * - EMPLOYEE: Can only view their own requests
 * - HR: Can view requests from team members
 * - ADMINISTRATOR: Can view all requests
 *
 * @param supabase - Supabase client
 * @param currentUserId - ID of current user
 * @param requestId - ID of vacation request to fetch
 * @returns Promise with vacation request details
 * @throws Error if not found or unauthorized
 */
export async function getVacationRequestById(
  supabase: SupabaseClient,
  currentUserId: string,
  requestId: string
): Promise<VacationRequestDetailsDTO>;
```

**Implementacja**:

1. Pobierz rolę użytkownika z `profiles`
2. Pobierz wniosek z JOINami (user, processedBy)
3. Sprawdź czy wniosek istnieje
4. Zastosuj RBAC:
   - EMPLOYEE: user_id === currentUserId
   - HR: sprawdź wspólny zespół
   - ADMINISTRATOR: allow all
5. Mapuj do DTO i zwróć

#### 3.2. Funkcja createVacationRequest

```typescript
/**
 * Create new vacation request
 * Validates:
 * - Calculates business days
 * - Checks vacation allowance availability
 * - Checks for overlapping requests
 *
 * @param supabase - Supabase client
 * @param currentUserId - ID of current user
 * @param data - Vacation request data
 * @returns Promise with created vacation request
 * @throws Error if validation fails or insufficient days
 */
export async function createVacationRequest(
  supabase: SupabaseClient,
  currentUserId: string,
  data: CreateVacationRequestDTO
): Promise<CreateVacationRequestResponseDTO>;
```

**Implementacja**:

1. Oblicz business_days_count (funkcja DB)
2. Sprawdź pulę urlopową:
   - Pobierz vacation_allowances dla bieżącego roku
   - Oblicz wykorzystane dni (suma z vacation_requests)
   - Sprawdź czy wystarczająco dni
3. Sprawdź nakładające się wnioski (query z date overlap)
4. Utwórz wniosek (INSERT)
5. Mapuj do DTO i zwróć

**Kryteria akceptacji**:

- Funkcje z pełną dokumentacją JSDoc
- Error handling z szczegółowymi komunikatami
- Logowanie błędów do console.error
- Type-safe (używanie SupabaseClient, DTOs)
- RBAC poprawnie zaimplementowane
- Wszystkie walidacje wykonywane po stronie serwera

---

### Krok 4: API Endpoint - GET /api/vacation-requests/:id

**Plik**: `src/pages/api/vacation-requests/[id].ts`

**Zadania**:

```typescript
/**
 * GET /api/vacation-requests/:id
 * Retrieve single vacation request with authorization
 */
import type { APIRoute } from "astro";
import { GetVacationRequestByIdParamsSchema } from "@/lib/schemas/vacation-requests.schema";
import { getVacationRequestById } from "@/lib/services/vacation-requests.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const supabase = locals.supabase;

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate params
    const validationResult = GetVacationRequestByIdParamsSchema.safeParse(params);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid vacation request ID format",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { id } = validationResult.data;
    const currentUserId = DEFAULT_USER_ID; // TODO: Replace with actual auth

    // Call service
    const result = await getVacationRequestById(supabase, currentUserId, id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Error handling (see section 7)
  }
};
```

**Kryteria akceptacji**:

- Walidacja params przez Zod
- Wywołanie service layer
- Obsługa wszystkich kodów błędów (400, 401, 403, 404, 500)
- Response z odpowiednimi headers
- Logging błędów z kontekstem

---

### Krok 5: API Endpoint - POST /api/vacation-requests

**Plik**: `src/pages/api/vacation-requests/index.ts` (dodanie metody POST)

**Zadania**:

```typescript
/**
 * POST /api/vacation-requests
 * Create new vacation request
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate body
    const validationResult = CreateVacationRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request data",
          details: validationResult.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const validatedData = validationResult.data;
    const currentUserId = DEFAULT_USER_ID; // TODO: Replace with actual auth

    // Call service
    const result = await createVacationRequest(supabase, currentUserId, validatedData);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Error handling (see section 7)
  }
};
```

**Kryteria akceptacji**:

- Parsowanie i walidacja JSON body
- Walidacja przez Zod
- Wywołanie service layer
- Obsługa wszystkich kodów błędów (400, 401, 409, 500)
- Response 201 przy sukcesie
- Logging błędów z kontekstem

---

### Krok 6: Indeksy bazodanowe

**Plik**: `supabase/migrations/YYYYMMDD_add_vacation_requests_overlap_index.sql`

**Zadania**:

```sql
-- Indeks dla optymalizacji sprawdzania nakładających się wniosków
CREATE INDEX IF NOT EXISTS idx_vacation_requests_overlap
ON vacation_requests (user_id, status, start_date, end_date)
WHERE status IN ('SUBMITTED', 'APPROVED');

-- Komentarz
COMMENT ON INDEX idx_vacation_requests_overlap IS
'Optimizes overlap checking when creating new vacation requests';
```

**Kryteria akceptacji**:

- Migracja działa bez błędów
- Indeks tworzony tylko dla aktywnych statusów
- Performance improvement zweryfikowane (EXPLAIN ANALYZE)

---

### Krok 7: Testy API

**Pliki**:

- `tests/api/vacation-request-get.test.sh`
- `tests/api/vacation-request-create.test.sh`

**Zadania**:

#### 7.1. Testy GET /:id

1. **Test: Sukces - pobieranie własnego wniosku**
   - Request: GET /api/vacation-requests/:id (jako EMPLOYEE)
   - Expect: 200, pełne dane wniosku

2. **Test: Błąd - nieprawidłowy UUID**
   - Request: GET /api/vacation-requests/invalid-uuid
   - Expect: 400, error message

3. **Test: Błąd - nieistniejący wniosek**
   - Request: GET /api/vacation-requests/:non-existent-id
   - Expect: 404, error message

4. **Test: Błąd - brak uprawnień (EMPLOYEE → cudzy wniosek)**
   - Request: GET /api/vacation-requests/:other-user-request-id (jako EMPLOYEE)
   - Expect: 403, error message

5. **Test: Sukces - HR przegląda wniosek członka zespołu**
   - Request: GET /api/vacation-requests/:team-member-request-id (jako HR)
   - Expect: 200, pełne dane wniosku

6. **Test: Sukces - ADMINISTRATOR przegląda dowolny wniosek**
   - Request: GET /api/vacation-requests/:any-request-id (jako ADMIN)
   - Expect: 200, pełne dane wniosku

#### 7.2. Testy POST /

1. **Test: Sukces - utworzenie wniosku**
   - Request: POST /api/vacation-requests { startDate, endDate }
   - Expect: 201, utworzony wniosek z businessDaysCount

2. **Test: Błąd - nieprawidłowy JSON**
   - Request: POST /api/vacation-requests (invalid JSON)
   - Expect: 400, error message

3. **Test: Błąd - nieprawidłowy format daty**
   - Request: POST /api/vacation-requests { startDate: "2026-13-45" }
   - Expect: 400, validation error

4. **Test: Błąd - data w przeszłości**
   - Request: POST /api/vacation-requests { startDate: "2020-01-01" }
   - Expect: 400, error message "cannot be in the past"

5. **Test: Błąd - data w weekend**
   - Request: POST /api/vacation-requests { startDate: "2026-01-03" } (sobota)
   - Expect: 400, error message "cannot fall on weekends"

6. **Test: Błąd - endDate < startDate**
   - Request: POST /api/vacation-requests { startDate: "2026-01-15", endDate: "2026-01-10" }
   - Expect: 400, error message "must be after or equal"

7. **Test: Błąd - niewystarczająca pula urlopowa**
   - Setup: Użytkownik z 0 dni dostępnych
   - Request: POST /api/vacation-requests { startDate, endDate }
   - Expect: 400, error message "Insufficient vacation days"

8. **Test: Błąd - nakładające się wnioski**
   - Setup: Istniejący wniosek 01-10 do 01-15
   - Request: POST /api/vacation-requests { startDate: "2026-01-12", endDate: "2026-01-20" }
   - Expect: 409, error message "overlapping dates"

**Kryteria akceptacji**:

- Wszystkie testy przechodzą
- Skrypty używają `test-helpers.sh`
- Czytelne output z kolorami (pass/fail)
- Testy są idempotentne (cleanup po wykonaniu)

---

### Krok 8: Dokumentacja

**Plik**: `docs/API_EXAMPLES.md` (aktualizacja)

**Zadania**:

Dodać sekcje:

#### GET /api/vacation-requests/:id

````markdown
### Get Single Vacation Request

**Endpoint**: `GET /api/vacation-requests/:id`

**Description**: Retrieve detailed information about a specific vacation request.

**Authorization**:

- EMPLOYEE: Can only view their own requests
- HR: Can view requests from team members
- ADMINISTRATOR: Can view all requests

**Example Request**:

```bash
curl -X GET http://localhost:4321/api/vacation-requests/123e4567-e89b-12d3-a456-426614174000
```
````

**Example Response** (200 OK):

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "user-uuid",
  "user": {
    "id": "user-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  },
  "startDate": "2026-01-10",
  "endDate": "2026-01-15",
  "businessDaysCount": 4,
  "status": "APPROVED",
  "processedByUserId": "hr-uuid",
  "processedBy": {
    "id": "hr-uuid",
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "processedAt": "2026-01-02T10:00:00Z",
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-02T10:00:00Z"
}
```

````

#### POST /api/vacation-requests

```markdown
### Create Vacation Request

**Endpoint**: `POST /api/vacation-requests`

**Description**: Submit a new vacation request. The system automatically calculates business days and validates availability.

**Authorization**: All authenticated users can create requests for themselves.

**Request Body**:
```json
{
  "startDate": "2026-01-10",
  "endDate": "2026-01-15"
}
````

**Validations**:

- Dates must be in format YYYY-MM-DD
- Dates cannot be in the past
- Dates cannot fall on weekends
- End date must be after or equal to start date
- User must have sufficient vacation days
- No overlapping vacation requests

**Example Request**:

```bash
curl -X POST http://localhost:4321/api/vacation-requests \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-01-10",
    "endDate": "2026-01-15"
  }'
```

**Example Response** (201 Created):

```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "startDate": "2026-01-10",
  "endDate": "2026-01-15",
  "businessDaysCount": 4,
  "status": "SUBMITTED",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

**Error Responses**:

- `400`: Invalid dates or insufficient vacation days
- `409`: Overlapping vacation request exists

```

```

**Kryteria akceptacji**:

- Dokumentacja zawiera wszystkie endpointy
- Przykłady request/response są aktualne
- Opisy błędów są szczegółowe
- Sekcja autoryzacji jest jasna

---

### Krok 9: Code review i refactoring

**Zadania**:

1. **Code review checklist**:
   - [ ] Typy są zgodne z konwencją nazewnictwa (camelCase)
   - [ ] Walidacja Zod jest kompletna
   - [ ] Service layer ma pełną dokumentację JSDoc
   - [ ] Error handling jest spójny z resztą API
   - [ ] Logging zawiera odpowiedni kontekst
   - [ ] Brak hardcoded values (używanie stałych)
   - [ ] Performance considerations zastosowane

2. **Linting**:

   ```bash
   npm run lint
   ```

   - Naprawić wszystkie błędy i warningi

3. **Type checking**:

   ```bash
   npm run type-check
   ```

   - Upewnić się że brak błędów TypeScript

4. **Testing**:

   ```bash
   ./tests/api/run-all.sh
   ```

   - Wszystkie testy przechodzą

**Kryteria akceptacji**:

- Wszystkie punkty checklist zaznaczone
- Brak błędów lintingu
- Brak błędów typów
- Wszystkie testy przechodzą

---

### Krok 10: Deployment i monitoring

**Zadania**:

1. **Utworzenie migracji**:
   - Upewnić się że migracja z indeksem jest zastosowana

2. **Deployment**:
   - Merge do main branch
   - Deployment przez CI/CD

3. **Smoke tests na production**:

   ```bash
   # GET test
   curl https://api.vacationplanner.com/api/vacation-requests/:id

   # POST test
   curl -X POST https://api.vacationplanner.com/api/vacation-requests \
     -H "Content-Type: application/json" \
     -d '{"startDate": "2026-01-10", "endDate": "2026-01-15"}'
   ```

4. **Monitoring setup**:
   - Sprawdzić czy logi są widoczne
   - Ustawić alerty dla error rate > 5%
   - Ustawić alerty dla response time > 1s

5. **Documentation**:
   - Zaktualizować CHANGELOG.md
   - Poinformować zespół o nowych endpointach

**Kryteria akceptacji**:

- Migracje zastosowane bez błędów
- Smoke tests przechodzą na production
- Monitoring działa poprawnie
- Dokumentacja zaktualizowana

---

## 10. Podsumowanie

### Zależności między krokami

```
Krok 1 (Typy)
    ↓
Krok 2 (Zod schemas)
    ↓
Krok 3 (Service layer)
    ↓
Krok 4 (GET endpoint) + Krok 5 (POST endpoint)
    ↓
Krok 6 (Indeksy DB)
    ↓
Krok 7 (Testy)
    ↓
Krok 8 (Dokumentacja)
    ↓
Krok 9 (Code review)
    ↓
Krok 10 (Deployment)
```

### Szacowany czas realizacji

- Krok 1: 30 min
- Krok 2: 45 min
- Krok 3: 3 godz.
- Krok 4: 1 godz.
- Krok 5: 1.5 godz.
- Krok 6: 30 min
- Krok 7: 2 godz.
- Krok 8: 45 min
- Krok 9: 1 godz.
- Krok 10: 1 godz.

**Łącznie**: ~12 godzin

### Kluczowe punkty uwagi

1. **Bezpieczeństwo**: RBAC musi być poprawnie zaimplementowane w service layer
2. **Walidacja**: Wszystkie business rules muszą być sprawdzane po stronie serwera
3. **Performance**: Indeksy są kluczowe dla sprawdzania nakładających się wniosków
4. **Race conditions**: Rozważyć transakcje przy tworzeniu wniosków
5. **Error handling**: Spójne komunikaty błędów i odpowiednie kody HTTP
6. **Testing**: Kompleksowe testy dla wszystkich scenariuszy edge case
7. **Documentation**: Aktualna dokumentacja dla developerów i użytkowników API

### Następne kroki po implementacji

1. Implementacja pełnej autentykacji (zamiana DEFAULT_USER_ID na prawdziwą sesję)
2. Implementacja UPDATE /api/vacation-requests/:id (approve/reject przez HR/ADMIN)
3. Implementacja DELETE /api/vacation-requests/:id (cancel przez użytkownika)
4. Dodanie notyfikacji przy zmianie statusu wniosku
5. Implementacja email notifications
6. Dodanie audit logs dla zmian statusu
7. Implementacja bulk operations dla HR/ADMIN
