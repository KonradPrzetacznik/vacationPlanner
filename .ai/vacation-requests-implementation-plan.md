# API Endpoint Implementation Plan: List Vacation Requests

## 1. Przegląd punktu końcowego

Endpoint `GET /api/vacation-requests` służy do pobierania listy wniosków urlopowych z możliwością filtrowania i paginacji. Dostęp do danych jest kontrolowany przez system RBAC (Role-Based Access Control):

- **EMPLOYEE**: Może przeglądać tylko swoje własne wnioski urlopowe
- **HR**: Może przeglądać wnioski członków zespołów, do których należy
- **ADMINISTRATOR**: Może przeglądać wszystkie wnioski w systemie

Endpoint zwraca paginowaną listę wniosków urlopowych z podstawowymi informacjami o użytkownikach, którzy je złożyli.

## 2. Szczegóły żądania

### Metoda HTTP

`GET`

### Struktura URL

```
/api/vacation-requests
```

### Parametry zapytania (Query Parameters)

#### Wymagane

Brak wymaganych parametrów.

#### Opcjonalne

| Parametr    | Typ      | Domyślna wartość | Walidacja                                | Opis                                                                   |
| ----------- | -------- | ---------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| `limit`     | number   | 50               | 1-100                                    | Liczba wyników na stronę                                               |
| `offset`    | number   | 0                | >= 0                                     | Przesunięcie paginacji                                                 |
| `status`    | string[] | -                | SUBMITTED, APPROVED, REJECTED, CANCELLED | Filtrowanie po statusie (może być wielokrotne)                         |
| `userId`    | UUID     | -                | Format UUID                              | Filtrowanie po ID użytkownika (EMPLOYEE może używać tylko własnego ID) |
| `teamId`    | UUID     | -                | Format UUID                              | Filtrowanie po ID zespołu                                              |
| `startDate` | date     | -                | Format YYYY-MM-DD                        | Wnioski rozpoczynające się po tej dacie                                |
| `endDate`   | date     | -                | Format YYYY-MM-DD                        | Wnioski kończące się przed tą datą                                     |

#### Przykładowe żądania

```http
GET /api/vacation-requests?limit=20&offset=0
GET /api/vacation-requests?status=SUBMITTED&status=APPROVED
GET /api/vacation-requests?userId=123e4567-e89b-12d3-a456-426614174000
GET /api/vacation-requests?teamId=123e4567-e89b-12d3-a456-426614174001&startDate=2026-01-01
```

### Request Body

Brak (metoda GET).

### Headers

```
Authorization: Bearer <token>  # Będzie zaimplementowane wraz z pełną autentykacją
```

## 3. Wykorzystywane typy

### Typy do dodania w `src/types.ts`

```typescript
/**
 * Get vacation requests query parameters DTO
 * Used for filtering and paginating vacation requests list
 */
export interface GetVacationRequestsQueryDTO {
  limit?: number;
  offset?: number;
  status?: ("SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED")[];
  userId?: string;
  teamId?: string;
  startDate?: string; // ISO date format YYYY-MM-DD
  endDate?: string; // ISO date format YYYY-MM-DD
}

/**
 * Vacation request list item DTO
 * Represents a single vacation request in the list
 * Connected to: Database['public']['Tables']['vacation_requests']['Row']
 * Connected to: Database['public']['Tables']['profiles']['Row']
 */
export interface VacationRequestListItemDTO {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  startDate: string; // ISO date
  endDate: string; // ISO date
  businessDaysCount: number;
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  processedByUserId: string | null;
  processedAt: string | null; // ISO datetime
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

/**
 * Pagination metadata for vacation requests list
 */
export interface VacationRequestsPaginationDTO {
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get vacation requests response DTO
 * Complete response with data and pagination
 */
export interface GetVacationRequestsResponseDTO {
  data: VacationRequestListItemDTO[];
  pagination: VacationRequestsPaginationDTO;
}
```

### Istniejące typy do wykorzystania

- `SupabaseClient` - z `src/db/supabase.client.ts`
- `Database` - z `src/db/database.types.ts` (typy tabeli `vacation_requests` i `profiles`)

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "userId": "223e4567-e89b-12d3-a456-426614174000",
      "user": {
        "id": "223e4567-e89b-12d3-a456-426614174000",
        "firstName": "Jan",
        "lastName": "Kowalski"
      },
      "startDate": "2026-01-10",
      "endDate": "2026-01-15",
      "businessDaysCount": 4,
      "status": "SUBMITTED",
      "processedByUserId": null,
      "processedAt": null,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 50,
    "offset": 0
  }
}
```

### Błąd walidacji (400 Bad Request)

```json
{
  "error": "Invalid query parameters",
  "details": {
    "limit": ["Number must be less than or equal to 100"],
    "startDate": ["Invalid date format, expected YYYY-MM-DD"]
  }
}
```

### Brak autoryzacji (401 Unauthorized)

```json
{
  "error": "Not authenticated"
}
```

### Brak uprawnień (403 Forbidden)

```json
{
  "error": "You can only view your own vacation requests"
}
```

lub

```json
{
  "error": "You are not a member of this team"
}
```

### Zasób nie znaleziony (404 Not Found)

```json
{
  "error": "Team not found"
}
```

lub

```json
{
  "error": "User not found"
}
```

### Błąd serwera (500 Internal Server Error)

```json
{
  "error": "Failed to fetch vacation requests"
}
```

## 5. Przepływ danych

### Architektura warstwowa

```
Request → API Endpoint → Validation Layer → Service Layer → Database → Response
```

### Szczegółowy przepływ

1. **API Endpoint** (`src/pages/api/vacation-requests/index.ts`)
   - Odbiera żądanie HTTP GET
   - Pobiera supabase client z `context.locals.supabase`
   - Ekstrahuje parametry zapytania z URL
2. **Validation Layer** (Zod schemas)
   - Waliduje wszystkie parametry zapytania
   - Konwertuje typy (coerce) gdzie potrzebne
   - Zwraca błędy walidacji lub zwalidowane dane
3. **Service Layer** (`src/lib/services/vacation-requests.service.ts`)
   - **Krok 1**: Pobiera rolę bieżącego użytkownika z tabeli `profiles`
   - **Krok 2**: Implementuje logikę RBAC:
     - **EMPLOYEE**: Jeśli podano `userId`, sprawdza czy jest równy `currentUserId`, w przeciwnym razie wymusza `userId = currentUserId`
     - **HR**: Jeśli podano `teamId`, sprawdza czy użytkownik należy do tego zespołu
     - **ADMINISTRATOR**: Brak ograniczeń
   - **Krok 3**: Buduje zapytanie do bazy danych:
     - Query na `vacation_requests`
     - JOIN z `profiles` dla informacji o użytkowniku
     - Opcjonalny JOIN z `team_members` jeśli filtrowanie po `teamId`
     - Stosuje filtry: status, userId, teamId, startDate, endDate
     - Dodaje paginację (LIMIT, OFFSET)
     - Sortowanie po `created_at DESC`
   - **Krok 4**: Wykonuje zapytanie z użyciem `COUNT(*) OVER()` dla total count
   - **Krok 5**: Mapuje wyniki do DTOs (snake_case → camelCase)
   - **Krok 6**: Zwraca sformatowaną odpowiedź z danymi i metadanymi paginacji
4. **Database Layer** (Supabase PostgreSQL)
   - Wykonuje zoptymalizowane zapytanie SQL
   - Wykorzystuje istniejące indeksy dla wydajności
   - Zwraca wyniki

5. **Response**
   - Serwis zwraca dane do endpointu
   - Endpoint serializuje do JSON
   - Zwraca response z odpowiednim status code

### Interakcja z bazą danych

**Główne zapytanie** (przykładowa struktura):

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
  p.id as profile_id,
  p.first_name,
  p.last_name,
  COUNT(*) OVER() as total_count
FROM vacation_requests vr
INNER JOIN profiles p ON vr.user_id = p.id
WHERE
  -- Filtry RBAC
  (dla EMPLOYEE: vr.user_id = $currentUserId)
  (dla HR z teamId: vr.user_id IN (SELECT user_id FROM team_members WHERE team_id = $teamId))
  -- Filtry opcjonalne
  AND ($status IS NULL OR vr.status = ANY($status))
  AND ($userId IS NULL OR vr.user_id = $userId)
  AND ($startDate IS NULL OR vr.start_date >= $startDate)
  AND ($endDate IS NULL OR vr.end_date <= $endDate)
ORDER BY vr.created_at DESC
LIMIT $limit OFFSET $offset
```

## 6. Względy bezpieczeństwa

### Autentykacja

- **Obecna implementacja (development)**: Używa `DEFAULT_USER_ID` dla symulacji użytkownika
- **Przyszła implementacja**: Będzie używać Supabase Auth z JWT tokenami
- **Wymagania**: Użytkownik musi być zalogowany, w przeciwnym razie zwraca 401

### Autoryzacja (RBAC)

#### EMPLOYEE

- **Ograniczenia**:
  - Może widzieć TYLKO swoje wnioski urlopowe
  - Parametr `userId` jest ignorowany lub wymuszany na `currentUserId`
  - Nie może filtrować po `teamId` (lub tylko po swoich zespołach - wymaga dalszej specyfikacji)
- **Implementacja**:
  ```typescript
  if (userRole === "EMPLOYEE") {
    if (userId && userId !== currentUserId) {
      throw new Error("You can only view your own vacation requests");
    }
    // Force userId to currentUserId
    filters.userId = currentUserId;
  }
  ```

#### HR

- **Ograniczenia**:
  - Może widzieć wnioski członków zespołów, do których należy
  - Przy filtrowaniu po `teamId` - musi być członkiem tego zespołu
  - Przy braku `teamId` - widzi wnioski wszystkich członków swoich zespołów
- **Implementacja**:

  ```typescript
  if (userRole === "HR") {
    // Get teams where user is a member
    const userTeams = await getUserTeams(supabase, currentUserId);

    if (teamId) {
      // Check if user is member of requested team
      if (!userTeams.includes(teamId)) {
        throw new Error("You are not a member of this team");
      }
    } else {
      // Filter by all user's teams
      filters.teamIds = userTeams;
    }
  }
  ```

#### ADMINISTRATOR

- **Ograniczenia**: Brak
- **Uprawnienia**: Pełny dostęp do wszystkich wniosków urlopowych

### Walidacja danych wejściowych

1. **Walidacja typów**: Zod schemas zapewniają walidację typów i formatów
2. **Walidacja zakresów**:
   - `limit`: 1-100
   - `offset`: >= 0
   - `status`: tylko dozwolone wartości enum
3. **Walidacja formatów**:
   - UUID: format UUID v4
   - Daty: format ISO (YYYY-MM-DD)
4. **Walidacja logiczna**:
   - `startDate <= endDate` (jeśli oba podane)

### Zapobieganie atakom

1. **SQL Injection**: Supabase używa parameterized queries (automatyczna ochrona)
2. **IDOR (Insecure Direct Object Reference)**:
   - Walidacja właściciela zasobu
   - Wymuszanie ograniczeń RBAC
3. **Information Disclosure**:
   - Generyczne komunikaty błędów dla użytkownika
   - Szczegółowe logi tylko w console (server-side)
4. **Enumeration Attacks**:
   - Zwracanie 404 dla nieistniejących zasobów (team, user)
   - Nie ujawnianie informacji o istnieniu zasobów bez uprawnień

### Logowanie i monitoring

```typescript
// Log access patterns
console.log("[GET /api/vacation-requests] Access:", {
  userId: currentUserId,
  role: userRole,
  filters: validatedParams,
  timestamp: new Date().toISOString(),
});

// Log authorization failures
console.warn("[GET /api/vacation-requests] Authorization failed:", {
  userId: currentUserId,
  role: userRole,
  attemptedAccess: { userId, teamId },
  timestamp: new Date().toISOString(),
});

// Log slow queries
if (duration > 1000) {
  console.warn("[GET /api/vacation-requests] Slow query:", {
    duration,
    filters: validatedParams,
    timestamp: new Date().toISOString(),
  });
}
```

## 7. Obsługa błędów

### Hierarchia obsługi błędów

1. **Walidacja na poziomie API** → 400 Bad Request
2. **Autentykacja** → 401 Unauthorized
3. **Autoryzacja** → 403 Forbidden
4. **Brak zasobu** → 404 Not Found
5. **Błędy serwisu** → 500 Internal Server Error

### Szczegółowe scenariusze błędów

#### 400 Bad Request

**Przyczyny**:

- Nieprawidłowy format UUID dla `userId` lub `teamId`
- Nieprawidłowy format daty (nie YYYY-MM-DD)
- `limit` poza zakresem (< 1 lub > 100)
- `offset` ujemny
- Nieprawidłowa wartość `status` (nie SUBMITTED/APPROVED/REJECTED/CANCELLED)
- `startDate > endDate`

**Odpowiedź**:

```json
{
  "error": "Invalid query parameters",
  "details": {
    "fieldName": ["Error message"]
  }
}
```

**Implementacja**:

```typescript
const validationResult = getVacationRequestsQuerySchema.safeParse(queryParams);

if (!validationResult.success) {
  return new Response(
    JSON.stringify({
      error: "Invalid query parameters",
      details: validationResult.error.flatten().fieldErrors,
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

#### 401 Unauthorized

**Przyczyny**:

- Brak tokenu autentykacji
- Nieprawidłowy token
- Wygasły token

**Odpowiedź**:

```json
{
  "error": "Not authenticated"
}
```

**Uwaga**: Obecnie pomijane (używamy DEFAULT_USER_ID), zostanie zaimplementowane z pełną autentykacją.

#### 403 Forbidden

**Przyczyny**:

- EMPLOYEE próbuje zobaczyć wnioski innego użytkownika
- HR próbuje zobaczyć wnioski zespołu, do którego nie należy
- Użytkownik próbuje uzyskać dostęp do zasobu bez odpowiednich uprawnień

**Odpowiedzi**:

```json
{
  "error": "You can only view your own vacation requests"
}
```

```json
{
  "error": "You are not a member of this team"
}
```

**Implementacja**:

```typescript
if (error.message.includes("only view your own")) {
  return new Response(JSON.stringify({ error: error.message }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
```

#### 404 Not Found

**Przyczyny**:

- Zespół o podanym `teamId` nie istnieje
- Użytkownik o podanym `userId` nie istnieje

**Odpowiedzi**:

```json
{
  "error": "Team not found"
}
```

```json
{
  "error": "User not found"
}
```

**Implementacja**:

```typescript
// W serwisie
if (teamId) {
  const { data: team, error } = await supabase.from("teams").select("id").eq("id", teamId).single();

  if (error || !team) {
    throw new Error("Team not found");
  }
}
```

#### 500 Internal Server Error

**Przyczyny**:

- Błąd połączenia z bazą danych
- Nieoczekiwany błąd w trakcie wykonywania zapytania
- Błąd w logice serwisu

**Odpowiedź**:

```json
{
  "error": "Failed to fetch vacation requests"
}
```

**Implementacja**:

```typescript
} catch (error) {
  console.error("[GET /api/vacation-requests] Error:", {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
  });

  return new Response(
    JSON.stringify({ error: "Failed to fetch vacation requests" }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

### Najlepsze praktyki obsługi błędów

1. **Early returns**: Sprawdzanie warunków błędu na początku funkcji
2. **Guard clauses**: Używanie warunków zabezpieczających przed kontynuacją
3. **Szczegółowe logowanie**: Dokładne logi w console dla debugowania
4. **Generyczne komunikaty**: Nie ujawniać szczegółów implementacji użytkownikowi
5. **Spójne formaty**: Wszystkie błędy zwracane w tym samym formacie JSON
6. **Kody statusu HTTP**: Właściwe kody zgodne ze standardem REST

## 8. Rozważania dotyczące wydajności

### Indeksy bazy danych

**Istniejące indeksy** (z migracji `20260109000000_add_vacation_requests_indexes.sql`):

- `vacation_requests.user_id`
- `vacation_requests.status`
- `vacation_requests.start_date`
- `vacation_requests.end_date`
- `vacation_requests.created_at`

**Weryfikacja**: Sprawdzić czy istnieją composite indexes dla typowych kombinacji:

```sql
-- Możliwe dodatkowe indeksy do rozważenia
CREATE INDEX IF NOT EXISTS idx_vacation_requests_user_status
  ON vacation_requests(user_id, status);

CREATE INDEX IF NOT EXISTS idx_vacation_requests_status_dates
  ON vacation_requests(status, start_date, end_date);
```

### Optymalizacja zapytań

1. **Window functions dla total count**:

   ```sql
   COUNT(*) OVER() as total_count
   ```

   Zamiast osobnego zapytania `COUNT(*)`, używamy window function dla pojedynczego query.

2. **Selective field fetching**:
   - Pobieranie tylko potrzebnych kolumn
   - Unikanie `SELECT *`

3. **Efficient pagination**:
   - Używanie `LIMIT` i `OFFSET`
   - Rozważenie cursor-based pagination dla bardzo dużych zbiorów danych

4. **Query planning**:
   - Testowanie planów wykonania zapytań (EXPLAIN ANALYZE)
   - Monitorowanie slow queries

### Caching strategy

**Dla przyszłej implementacji**:

- Cache'owanie listy zespołów użytkownika (HR)
- Cache'owanie roli użytkownika
- Invalidacja cache przy zmianach danych

**Obecnie**: Brak cache'owania (implementacja podstawowa)

### Performance monitoring

```typescript
// Measure query execution time
const startTime = Date.now();
const result = await getVacationRequests(supabase, currentUserId, userRole, validatedParams);
const duration = Date.now() - startTime;

// Log slow queries
if (duration > 1000) {
  console.warn("[GET /api/vacation-requests] Slow query detected:", {
    duration,
    filters: validatedParams,
    userId: currentUserId,
    role: userRole,
  });
}
```

### Limity i rate limiting

1. **Query limits**:
   - Maksymalny `limit`: 100 wyników na stronę
   - Zapobieganie pobieraniu zbyt dużych zbiorów danych

2. **Rate limiting** (przyszła implementacja):
   - Ograniczenie liczby requestów per użytkownik per minutę
   - Implementacja za pomocą middleware lub Redis

### Connection pooling

- Supabase automatycznie zarządza connection pooling
- Używanie pojedynczego klienta Supabase z connection pooling

### Potencjalne wąskie gardła

1. **Duża liczba wniosków urlopowych**:
   - **Mitigation**: Paginacja, indeksy, optymalizacja zapytań
2. **Złożone filtry (wiele JOIN-ów)**:
   - **Mitigation**: Selective indexes, query optimization
3. **HR z wieloma zespołami**:
   - **Mitigation**: Efficient IN queries, proper indexing

## 9. Etapy wdrożenia

### Etap 1: Dodanie typów DTO

**Plik**: `src/types.ts`

**Akcja**: Dodaj nowe interfejsy na końcu pliku (przed ostatnią sekcją lub w odpowiedniej sekcji):

```typescript
// ============================================================================
// Vacation Requests DTOs
// ============================================================================

/**
 * Get vacation requests query parameters DTO
 * Used for filtering and paginating vacation requests list
 */
export interface GetVacationRequestsQueryDTO {
  limit?: number;
  offset?: number;
  status?: ("SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED")[];
  userId?: string;
  teamId?: string;
  startDate?: string; // ISO date format YYYY-MM-DD
  endDate?: string; // ISO date format YYYY-MM-DD
}

/**
 * Vacation request list item DTO
 * Represents a single vacation request in the list
 * Connected to: Database['public']['Tables']['vacation_requests']['Row']
 * Connected to: Database['public']['Tables']['profiles']['Row']
 */
export interface VacationRequestListItemDTO {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  startDate: string; // ISO date
  endDate: string; // ISO date
  businessDaysCount: number;
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  processedByUserId: string | null;
  processedAt: string | null; // ISO datetime
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

/**
 * Pagination metadata for vacation requests list
 */
export interface VacationRequestsPaginationDTO {
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get vacation requests response DTO
 * Complete response with data and pagination
 */
export interface GetVacationRequestsResponseDTO {
  data: VacationRequestListItemDTO[];
  pagination: VacationRequestsPaginationDTO;
}
```

### Etap 2: Utworzenie schematów walidacji Zod

**Plik**: `src/lib/schemas/vacation-requests.schema.ts` (nowy plik)

**Akcja**: Utwórz nowy plik z następującą zawartością:

```typescript
/**
 * Zod validation schemas for vacation requests management endpoints
 *
 * These schemas validate input data for vacation requests queries.
 * They ensure data integrity and provide clear validation error messages.
 */

import { z } from "zod";

/**
 * Schema for validating GET vacation requests query parameters
 */
export const getVacationRequestsQuerySchema = z
  .object({
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be at least 1")
      .max(100, "Limit must be at most 100")
      .optional()
      .default(50),

    offset: z.coerce.number().int().min(0, "Offset must be non-negative").optional().default(0),

    status: z
      .union([
        z.enum(["SUBMITTED", "APPROVED", "REJECTED", "CANCELLED"]),
        z.array(z.enum(["SUBMITTED", "APPROVED", "REJECTED", "CANCELLED"])),
      ])
      .optional()
      .transform((val) => {
        // Ensure status is always an array
        if (!val) return undefined;
        return Array.isArray(val) ? val : [val];
      }),

    userId: z.string().uuid("Invalid user ID format").optional(),

    teamId: z.string().uuid("Invalid team ID format").optional(),

    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD")
      .optional(),

    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD")
      .optional(),
  })
  .refine(
    (data) => {
      // If both dates are provided, startDate must be <= endDate
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: "Start date must be before or equal to end date",
      path: ["startDate"],
    }
  );
```

### Etap 3: Utworzenie serwisu vacation requests

**Plik**: `src/lib/services/vacation-requests.service.ts` (nowy plik)

**Akcja**: Utwórz nowy plik z logiką biznesową:

```typescript
/**
 * Vacation Requests Service
 * Handles business logic for vacation requests operations
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type { GetVacationRequestsQueryDTO, GetVacationRequestsResponseDTO, VacationRequestListItemDTO } from "@/types";

/**
 * Get vacation requests list with pagination and filtering
 *
 * @param supabase - Supabase client from context.locals
 * @param currentUserId - ID of the current user (for RBAC)
 * @param currentUserRole - Role of the current user (for RBAC)
 * @param query - Query parameters for filtering and pagination
 * @returns Promise with vacation requests data and pagination metadata
 * @throws Error if validation fails or user lacks permissions
 */
export async function getVacationRequests(
  supabase: SupabaseClient,
  currentUserId: string,
  currentUserRole: "ADMINISTRATOR" | "HR" | "EMPLOYEE",
  query: GetVacationRequestsQueryDTO
): Promise<GetVacationRequestsResponseDTO> {
  const { limit = 50, offset = 0, status, userId, teamId, startDate, endDate } = query;

  // 1. Implement RBAC logic
  let effectiveUserId: string | undefined = userId;
  let teamIds: string[] | undefined = undefined;

  if (currentUserRole === "EMPLOYEE") {
    // EMPLOYEE can only view their own requests
    if (userId && userId !== currentUserId) {
      throw new Error("You can only view your own vacation requests");
    }
    // Force userId to currentUserId
    effectiveUserId = currentUserId;
  } else if (currentUserRole === "HR") {
    // HR can view requests from their team members

    // Get teams where current user is a member
    const { data: memberships, error: membershipError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", currentUserId);

    if (membershipError) {
      console.error("[VacationRequestsService] Failed to fetch user teams:", membershipError);
      throw new Error("Failed to fetch vacation requests");
    }

    const userTeamIds = memberships.map((m) => m.team_id);

    if (teamId) {
      // Check if requested team is one of user's teams
      if (!userTeamIds.includes(teamId)) {
        throw new Error("You are not a member of this team");
      }

      // Validate team exists
      const { data: team, error: teamError } = await supabase.from("teams").select("id").eq("id", teamId).single();

      if (teamError || !team) {
        throw new Error("Team not found");
      }

      teamIds = [teamId];
    } else {
      // Use all user's teams
      teamIds = userTeamIds;
    }

    // If HR has no teams, return empty result
    if (teamIds.length === 0) {
      return {
        data: [],
        pagination: {
          total: 0,
          limit,
          offset,
        },
      };
    }
  } else if (currentUserRole === "ADMINISTRATOR") {
    // ADMINISTRATOR has no restrictions

    // Validate teamId if provided
    if (teamId) {
      const { data: team, error: teamError } = await supabase.from("teams").select("id").eq("id", teamId).single();

      if (teamError || !team) {
        throw new Error("Team not found");
      }

      teamIds = [teamId];
    }

    // Validate userId if provided
    if (userId) {
      const { data: user, error: userError } = await supabase.from("profiles").select("id").eq("id", userId).single();

      if (userError || !user) {
        throw new Error("User not found");
      }

      effectiveUserId = userId;
    }
  }

  // 2. Build base query
  let vacationRequestsQuery = supabase.from("vacation_requests").select(
    `
      id,
      user_id,
      start_date,
      end_date,
      business_days_count,
      status,
      processed_by_user_id,
      processed_at,
      created_at,
      updated_at,
      profiles!vacation_requests_user_id_fkey (
        id,
        first_name,
        last_name
      )
    `,
    { count: "exact" }
  );

  // 3. Apply filters based on RBAC
  if (effectiveUserId) {
    vacationRequestsQuery = vacationRequestsQuery.eq("user_id", effectiveUserId);
  } else if (teamIds && teamIds.length > 0) {
    // For HR: filter by team members
    // Get all user IDs in these teams
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from("team_members")
      .select("user_id")
      .in("team_id", teamIds);

    if (teamMembersError) {
      console.error("[VacationRequestsService] Failed to fetch team members:", teamMembersError);
      throw new Error("Failed to fetch vacation requests");
    }

    const teamMemberUserIds = [...new Set(teamMembers.map((m) => m.user_id))];

    if (teamMemberUserIds.length === 0) {
      return {
        data: [],
        pagination: {
          total: 0,
          limit,
          offset,
        },
      };
    }

    vacationRequestsQuery = vacationRequestsQuery.in("user_id", teamMemberUserIds);
  }

  // 4. Apply optional filters
  if (status && status.length > 0) {
    vacationRequestsQuery = vacationRequestsQuery.in("status", status);
  }

  if (startDate) {
    vacationRequestsQuery = vacationRequestsQuery.gte("start_date", startDate);
  }

  if (endDate) {
    vacationRequestsQuery = vacationRequestsQuery.lte("end_date", endDate);
  }

  // 5. Apply pagination and sorting
  vacationRequestsQuery = vacationRequestsQuery
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  // 6. Execute query
  const { data: vacationRequests, error: queryError, count } = await vacationRequestsQuery;

  if (queryError) {
    console.error("[VacationRequestsService] Failed to fetch vacation requests:", queryError);
    throw new Error("Failed to fetch vacation requests");
  }

  if (!vacationRequests) {
    return {
      data: [],
      pagination: {
        total: 0,
        limit,
        offset,
      },
    };
  }

  // 7. Map to DTOs (snake_case to camelCase)
  const vacationRequestsList: VacationRequestListItemDTO[] = vacationRequests.map((vr) => {
    // Handle nested profile data
    const profile = Array.isArray(vr.profiles) ? vr.profiles[0] : vr.profiles;

    return {
      id: vr.id,
      userId: vr.user_id,
      user: {
        id: profile?.id ?? vr.user_id,
        firstName: profile?.first_name ?? "",
        lastName: profile?.last_name ?? "",
      },
      startDate: vr.start_date,
      endDate: vr.end_date,
      businessDaysCount: vr.business_days_count,
      status: vr.status as "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED",
      processedByUserId: vr.processed_by_user_id,
      processedAt: vr.processed_at,
      createdAt: vr.created_at,
      updatedAt: vr.updated_at,
    };
  });

  // 8. Return response with pagination
  return {
    data: vacationRequestsList,
    pagination: {
      total: count ?? 0,
      limit,
      offset,
    },
  };
}
```

### Etap 4: Utworzenie endpointu API

**Plik**: `src/pages/api/vacation-requests/index.ts` (nowy plik, nowy folder)

**Akcja**: Utwórz folder `vacation-requests` w `src/pages/api/` i dodaj plik `index.ts`:

```typescript
/**
 * GET /api/vacation-requests
 * Endpoint for retrieving paginated and filtered list of vacation requests
 *
 * Authorization: Using DEFAULT_USER_ID for development
 * - ADMINISTRATOR: Can view all vacation requests
 * - HR: Can view vacation requests of team members
 * - EMPLOYEE: Can view only own vacation requests
 *
 * NOTE: Full authentication will be implemented later
 */

import type { APIRoute } from "astro";
import { getVacationRequests } from "@/lib/services/vacation-requests.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { getVacationRequestsQuerySchema } from "@/lib/schemas/vacation-requests.schema";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET handler for /api/vacation-requests
 * Retrieves list of vacation requests with pagination and filtering
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);

    const validationResult = getVacationRequestsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: validationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedParams = validationResult.data;

    // 2. Use DEFAULT_USER_ID for development (auth will be implemented later)
    const currentUserId = DEFAULT_USER_ID;

    // 3. Get current user's role
    const { data: userProfile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single();

    if (profileError || !userProfile) {
      console.error("[GET /api/vacation-requests] Failed to fetch user profile:", profileError);
      return new Response(JSON.stringify({ error: "Failed to authenticate user" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userRole = userProfile.role as "ADMINISTRATOR" | "HR" | "EMPLOYEE";

    // 4. Call service to get vacation requests
    const startTime = Date.now();
    const result = await getVacationRequests(locals.supabase, currentUserId, userRole, validatedParams);
    const duration = Date.now() - startTime;

    // Log access
    console.log("[GET /api/vacation-requests] Access:", {
      userId: currentUserId,
      role: userRole,
      filters: validatedParams,
      resultCount: result.data.length,
      timestamp: new Date().toISOString(),
    });

    // Log slow queries
    if (duration > 1000) {
      console.warn("[GET /api/vacation-requests] Slow query detected:", {
        duration,
        queryParams: validatedParams,
        userId: currentUserId,
        role: userRole,
      });
    }

    // 5. Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/vacation-requests] Error:", {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle known error types
    if (error instanceof Error) {
      // Authorization errors (403 Forbidden)
      if (error.message.includes("only view your own") || error.message.includes("not a member of this team")) {
        console.warn("[GET /api/vacation-requests] Authorization failed:", {
          error: error.message,
          timestamp: new Date().toISOString(),
        });

        return new Response(JSON.stringify({ error: error.message }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Not found errors (404)
      if (error.message.includes("not found") || error.message.includes("Not found")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Generic error response (500)
    return new Response(JSON.stringify({ error: "Failed to fetch vacation requests" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Etap 5: Testowanie i walidacja

**Akcja**: Utwórz plik testowy dla API (opcjonalne)

**Plik**: `tests/api/vacation-requests-list.test.sh` (nowy plik)

```bash
#!/bin/bash

# Test script for GET /api/vacation-requests endpoint

source "$(dirname "$0")/test-helpers.sh"

API_URL="${API_URL:-http://localhost:4321}"
ENDPOINT="$API_URL/api/vacation-requests"

echo "Testing GET /api/vacation-requests endpoint"
echo "=============================================="

# Test 1: Basic request (no filters)
echo -e "\n${BLUE}Test 1: Basic request${NC}"
response=$(curl -s -w "\n%{http_code}" "$ENDPOINT")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
  echo -e "${GREEN}✓ Status: 200 OK${NC}"
  echo "$body" | jq '.'
else
  echo -e "${RED}✗ Expected 200, got $http_code${NC}"
  echo "$body" | jq '.'
fi

# Test 2: With pagination
echo -e "\n${BLUE}Test 2: With pagination (limit=10, offset=0)${NC}"
response=$(curl -s -w "\n%{http_code}" "$ENDPOINT?limit=10&offset=0")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
  echo -e "${GREEN}✓ Status: 200 OK${NC}"
  count=$(echo "$body" | jq '.data | length')
  echo "Returned $count items"
else
  echo -e "${RED}✗ Expected 200, got $http_code${NC}"
fi

# Test 3: Filter by status
echo -e "\n${BLUE}Test 3: Filter by status (SUBMITTED)${NC}"
response=$(curl -s -w "\n%{http_code}" "$ENDPOINT?status=SUBMITTED")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
  echo -e "${GREEN}✓ Status: 200 OK${NC}"
  echo "$body" | jq '.'
else
  echo -e "${RED}✗ Expected 200, got $http_code${NC}"
fi

# Test 4: Invalid limit (too high)
echo -e "\n${BLUE}Test 4: Invalid limit (200)${NC}"
response=$(curl -s -w "\n%{http_code}" "$ENDPOINT?limit=200")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "400" ]; then
  echo -e "${GREEN}✓ Status: 400 Bad Request (as expected)${NC}"
  echo "$body" | jq '.'
else
  echo -e "${RED}✗ Expected 400, got $http_code${NC}"
fi

# Test 5: Invalid date format
echo -e "\n${BLUE}Test 5: Invalid date format${NC}"
response=$(curl -s -w "\n%{http_code}" "$ENDPOINT?startDate=2026-13-01")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "400" ]; then
  echo -e "${GREEN}✓ Status: 400 Bad Request (as expected)${NC}"
  echo "$body" | jq '.'
else
  echo -e "${RED}✗ Expected 400, got $http_code${NC}"
fi

echo -e "\n${BLUE}Testing completed!${NC}"
```

### Etap 6: Weryfikacja błędów i optymalizacja

**Akcje**:

1. **Uruchom serwer deweloperski**:

   ```bash
   npm run dev
   ```

2. **Sprawdź błędy kompilacji**:
   - Otwórz terminal i sprawdź czy są błędy TypeScript
   - Użyj narzędzia do sprawdzenia błędów w IDE

3. **Przetestuj endpoint ręcznie**:

   ```bash
   # Test podstawowy
   curl http://localhost:4321/api/vacation-requests

   # Test z filtrami
   curl "http://localhost:4321/api/vacation-requests?limit=10&status=SUBMITTED"
   ```

4. **Uruchom testy automatyczne** (jeśli utworzone):

   ```bash
   chmod +x tests/api/vacation-requests-list.test.sh
   ./tests/api/vacation-requests-list.test.sh
   ```

5. **Sprawdź wydajność**:
   - Monitoruj czas odpowiedzi w logach
   - Sprawdź plany wykonania zapytań w bazie danych
   - Zoptymalizuj indeksy jeśli potrzebne

6. **Code review**:
   - Sprawdź zgodność z zasadami kodowania z `.github/copilot-instructions.md`
   - Upewnij się, że wszystkie edge cases są obsłużone
   - Zweryfikuj poprawność obsługi błędów

### Etap 7: Dokumentacja

**Akcje**:

1. **Zaktualizuj dokumentację API**:
   - Dodaj przykłady użycia do `docs/API_EXAMPLES.md`
   - Udokumentuj wszystkie parametry zapytania
   - Dodaj przykłady odpowiedzi dla różnych scenariuszy

2. **Dodaj komentarze w kodzie**:
   - Upewnij się, że wszystkie funkcje mają JSDoc comments
   - Dokumentuj skomplikowaną logikę biznesową
   - Dodaj przykłady użycia w komentarzach

3. **Zaktualizuj README** (jeśli potrzebne):
   - Dodaj informacje o nowym endpoincie
   - Zaktualizuj sekcję "Dostępne endpointy"

### Etap 8: Finalizacja i cleanup

**Akcje**:

1. **Przejrzyj cały kod**:
   - Usuń niepotrzebne komentarze
   - Usuń nieużywany kod
   - Upewnij się, że nazwy zmiennych są spójne

2. **Sprawdź linting**:

   ```bash
   npm run lint
   ```

3. **Formatowanie kodu**:

   ```bash
   npm run format  # lub odpowiednia komenda formatowania
   ```

4. **Commit zmian**:

   ```bash
   git add .
   git commit -m "feat: implement GET /api/vacation-requests endpoint"
   ```

5. **Utwórz Pull Request**:
   - Opisz wprowadzone zmiany
   - Wymień wszystkie nowe pliki
   - Dodaj screenshoty testów (jeśli dostępne)
   - Link do specyfikacji API

## 10. Checklist implementacji

- [ ] Dodano nowe typy DTO do `src/types.ts`
- [ ] Utworzono schemat walidacji Zod w `src/lib/schemas/vacation-requests.schema.ts`
- [ ] Utworzono serwis w `src/lib/services/vacation-requests.service.ts`
- [ ] Zaimplementowano logikę RBAC dla trzech ról
- [ ] Utworzono endpoint API w `src/pages/api/vacation-requests/index.ts`
- [ ] Dodano obsługę wszystkich scenariuszy błędów
- [ ] Zaimplementowano paginację
- [ ] Zaimplementowano filtrowanie (status, userId, teamId, dates)
- [ ] Dodano logowanie dostępów i błędów
- [ ] Dodano monitoring wydajności (slow queries)
- [ ] Utworzono testy (opcjonalne)
- [ ] Przetestowano wszystkie scenariusze ręcznie
- [ ] Sprawdzono błędy TypeScript
- [ ] Sprawdzono linting
- [ ] Zaktualizowano dokumentację
- [ ] Wykonano code review
- [ ] Utworzono commit z opisowymi zmianami

## 11. Potencjalne rozszerzenia (przyszłość)

1. **Sortowanie**:
   - Dodać parametr `sortBy` (startDate, endDate, createdAt, status)
   - Dodać parametr `sortOrder` (asc, desc)

2. **Wyszukiwanie**:
   - Dodać parametr `search` dla wyszukiwania po imieniu/nazwisku użytkownika

3. **Eksport danych**:
   - Endpoint do eksportu do CSV/Excel
   - Generowanie raportów

4. **Cache'owanie**:
   - Implementacja cache dla często wykonywanych zapytań
   - Invalidacja cache przy zmianach

5. **Rate limiting**:
   - Ograniczenie liczby requestów per użytkownik

6. **Websockets**:
   - Real-time updates dla nowych wniosków urlopowych

7. **Aggregacje**:
   - Dodatkowe statystyki (np. liczba wniosków per status)
   - Dashboard z wykresami

---

**Data utworzenia**: 2026-01-11
**Wersja**: 1.0
**Status**: Ready for implementation
