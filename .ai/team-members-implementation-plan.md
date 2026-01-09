# API Endpoint Implementation Plan: Team Members Management & Calendar

## Spis treści
1. [POST /api/teams/:id/members - Dodawanie członków do zespołu](#1-post-apiteamsidmembers---dodawanie-członków-do-zespołu)
2. [DELETE /api/teams/:id/members/:userId - Usuwanie członka z zespołu](#2-delete-apiteamsidmembersuserid---usuwanie-członka-z-zespołu)
3. [GET /api/teams/:id/calendar - Kalendarz urlopów zespołu](#3-get-apiteamsidcalendar---kalendarz-urlopów-zespołu)

---

## 1. POST /api/teams/:id/members - Dodawanie członków do zespołu

### 1.1. Przegląd punktu końcowego
Endpoint umożliwia użytkownikom z rolą HR dodawanie jednego lub więcej użytkowników do zespołu. Operacja jest atomowa - jeśli którykolwiek użytkownik nie może zostać dodany (np. już jest członkiem), cała operacja kończy się błędem. Endpoint wspiera bulk operations dla efektywności.

**Cel biznesowy:** Umożliwienie HR szybkiego zarządzania składem zespołów poprzez dodawanie wielu członków jednocześnie.

### 1.2. Szczegóły żądania

**Metoda HTTP:** `POST`

**Struktura URL:** `/api/teams/:id/members`

**Parametry URL:**
- **Wymagane:**
  - `id` (string, UUID) - Identyfikator zespołu

**Request Body:**
```typescript
{
  "userIds": ["uuid-1", "uuid-2", ...] // Array of user UUIDs
}
```

**Nagłówki:**
- `Content-Type: application/json`
- `Cookie: sb-access-token=...` (session cookie zarządzany przez Supabase)

### 1.3. Wykorzystywane typy

**Nowe typy do dodania w `src/types.ts`:**

```typescript
/**
 * Add team members command DTO
 * Used by HR to add multiple users to a team
 * Connected to: Database['public']['Tables']['team_members']['Insert']
 */
export interface AddTeamMembersDTO {
  userIds: string[];
}

/**
 * Team membership DTO
 * Represents a single team membership record
 * Connected to: Database['public']['Tables']['team_members']['Row']
 */
export interface TeamMembershipDTO {
  id: string;
  userId: string;
  teamId: string;
  createdAt: string;
}

/**
 * Add team members response DTO
 * Returned after successfully adding members to team
 */
export interface AddTeamMembersResponseDTO {
  message: string;
  added: TeamMembershipDTO[];
}
```

**Istniejące typy wykorzystywane:**
- Brak - wszystkie potrzebne typy są nowe

### 1.4. Szczegóły odpowiedzi

**Success Response (200 OK):**
```json
{
  "message": "Members added successfully",
  "added": [
    {
      "id": "member-uuid-1",
      "userId": "user-uuid-1",
      "teamId": "team-uuid",
      "createdAt": "2026-01-09T12:00:00Z"
    },
    {
      "id": "member-uuid-2",
      "userId": "user-uuid-2",
      "teamId": "team-uuid",
      "createdAt": "2026-01-09T12:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Nieprawidłowe dane wejściowe
  ```json
  {
    "error": "Invalid user IDs provided"
  }
  ```
  lub
  ```json
  {
    "error": "User {userId} is already a member of this team"
  }
  ```

- `401 Unauthorized` - Brak autentykacji
  ```json
  {
    "error": "Unauthorized"
  }
  ```

- `403 Forbidden` - Użytkownik nie ma roli HR
  ```json
  {
    "error": "Only HR can add team members"
  }
  ```

- `404 Not Found` - Zespół lub użytkownik nie istnieje
  ```json
  {
    "error": "Team not found"
  }
  ```
  lub
  ```json
  {
    "error": "User {userId} not found"
  }
  ```

- `500 Internal Server Error` - Błąd serwera
  ```json
  {
    "error": "Internal server error"
  }
  ```

### 1.5. Przepływ danych

```
1. Request → Astro API Handler (/api/teams/[id]/members.ts)
   ↓
2. Middleware (src/middleware/index.ts)
   - Weryfikacja sesji Supabase
   - Ustawienie context.locals.supabase i context.locals.user
   ↓
3. Handler POST function
   - Pobranie user z context.locals
   - Sprawdzenie czy user istnieje (401 jeśli nie)
   - Sprawdzenie czy user.role === 'HR' (403 jeśli nie)
   - Pobranie teamId z params
   - Walidacja body przez Zod schema (AddTeamMembersSchema)
   ↓
4. Service Layer (src/lib/services/teams.service.ts)
   - Funkcja: addMembers(supabase, teamId, userIds)
   - Sprawdzenie czy team istnieje (404 jeśli nie)
   - Dla każdego userId:
     * Sprawdzenie czy user istnieje i nie jest usunięty (404 jeśli nie istnieje)
     * Sprawdzenie czy user nie jest już członkiem (400 jeśli jest)
   - Bulk insert do team_members (transakcja)
   - Pobranie utworzonych rekordów
   - Mapowanie do TeamMembershipDTO[]
   ↓
5. Response
   - 200 OK z AddTeamMembersResponseDTO
   - lub odpowiedni błąd (400/401/403/404/500)
```

**Interakcje z bazą danych:**
1. `SELECT id FROM teams WHERE id = $1` - weryfikacja istnienia zespołu
2. `SELECT id, deleted_at FROM profiles WHERE id = ANY($1)` - weryfikacja użytkowników
3. `SELECT user_id FROM team_members WHERE team_id = $1 AND user_id = ANY($2)` - sprawdzenie istniejących członkostwa
4. `INSERT INTO team_members (team_id, user_id) VALUES ... RETURNING *` - dodanie członków (bulk)

### 1.6. Względy bezpieczeństwa

**Autentykacja:**
- Wymagana sesja Supabase (zarządzana przez middleware)
- Token sesji przesyłany w cookie
- Weryfikacja przez `supabase.auth.getUser()`

**Autoryzacja:**
- Tylko użytkownicy z rolą `HR` mogą dodawać członków
- Sprawdzenie: `user.role === 'HR'`
- Zwrócenie 403 dla innych ról

**Walidacja danych:**
- `userIds` musi być niepustą tablicą
- Każdy element musi być prawidłowym UUID
- Użycie Zod schema:
  ```typescript
  z.object({
    userIds: z.array(z.string().uuid()).min(1)
  })
  ```

**Zapobieganie SQL Injection:**
- Użycie Supabase Client z parametryzowanymi zapytaniami
- Wszystkie wartości przekazywane jako parametry, nie konkatenowane

**Ochrona przed CSRF:**
- Astro automatycznie obsługuje same-site cookies
- Dodatkowa walidacja origin dla API endpoints

**Rate Limiting:**
- Rozważenie implementacji rate limiting dla operacji HR (np. max 100 members per request)
- Monitorowanie w audit logs

### 1.7. Obsługa błędów

| Scenariusz | Kod | Komunikat | Akcja |
|------------|-----|-----------|-------|
| Brak autentykacji | 401 | "Unauthorized" | Sprawdzenie context.locals.user |
| Brak roli HR | 403 | "Only HR can add team members" | Sprawdzenie user.role |
| Team nie istnieje | 404 | "Team not found" | Query do teams table |
| User nie istnieje | 404 | "User {userId} not found" | Query do profiles table |
| User usunięty | 404 | "User {userId} not found" | Sprawdzenie deleted_at |
| User już w zespole | 400 | "User {userId} is already a member of this team" | Query do team_members |
| Nieprawidłowe UUID | 400 | "Invalid user IDs provided" | Zod validation |
| Pusta tablica userIds | 400 | "At least one user ID is required" | Zod validation |
| Błąd bazy danych | 500 | "Internal server error" | Logging + generic message |
| Timeout | 500 | "Request timeout" | Retry logic |

**Strategia logowania błędów:**
- Błędy 4xx: Info level (oczekiwane błędy użytkownika)
- Błędy 5xx: Error level (problemy systemowe)
- Logowanie szczegółów: user.id, teamId, userIds, error message, stack trace

### 1.8. Wydajność

**Optymalizacje:**
1. **Bulk Insert:** Użycie pojedynczego INSERT dla wszystkich członków zamiast N osobnych
2. **Single Transaction:** Wszystkie operacje w jednej transakcji
3. **Batch Validation:** Sprawdzenie wszystkich userIds jednym zapytaniem z ANY($1)
4. **Index Usage:** Wykorzystanie istniejących indexów:
   - `team_members(team_id, user_id)` UNIQUE constraint
   - `profiles(id)` PRIMARY KEY
   - `teams(id)` PRIMARY KEY

**Potencjalne wąskie gardła:**
- Duże tablice userIds (>100): rozważenie limitu
- Konflikt UNIQUE constraint przy concurrent requests: proper error handling
- Timeout przy bardzo dużych batch: implementacja timeout

**Szacowany czas odpowiedzi:**
- Typowy case (1-10 users): <200ms
- Bulk operation (50-100 users): <500ms

### 1.9. Etapy wdrożenia

#### Krok 1: Definicja typów (src/types.ts)
```typescript
// Dodać nowe typy DTO:
// - AddTeamMembersDTO
// - TeamMembershipDTO
// - AddTeamMembersResponseDTO
```

#### Krok 2: Walidacja schema (src/lib/schemas/teams.schema.ts)
```typescript
export const addTeamMembersSchema = z.object({
  userIds: z
    .array(z.string().uuid("Each user ID must be a valid UUID"))
    .min(1, "At least one user ID is required")
    .max(100, "Cannot add more than 100 members at once"),
});
```

#### Krok 3: Rozszerzenie service (src/lib/services/teams.service.ts)
```typescript
export async function addMembers(
  supabase: SupabaseClient,
  teamId: string,
  userIds: string[]
): Promise<TeamMembershipDTO[]> {
  // 1. Sprawdzenie istnienia zespołu
  // 2. Walidacja użytkowników (istnienie, deleted_at)
  // 3. Sprawdzenie istniejących członkostwa
  // 4. Bulk insert
  // 5. Mapowanie do DTO
}
```

#### Krok 4: Implementacja API handler (src/pages/api/teams/[id]/members.ts)
```typescript
export const prerender = false;

import type { APIRoute } from "astro";
import { addTeamMembersSchema } from "@/lib/schemas/teams.schema";
import { addMembers } from "@/lib/services/teams.service";

export const POST: APIRoute = async (context) => {
  // 1. Weryfikacja autentykacji
  // 2. Sprawdzenie roli HR
  // 3. Walidacja input
  // 4. Wywołanie service
  // 5. Zwrócenie response
};
```

#### Krok 5: Testy
- Unit testy dla service layer
- Integration testy dla API endpoint
- Edge cases: empty array, invalid UUIDs, duplicate users, non-existent team/users

#### Krok 6: Dokumentacja
- Aktualizacja API_EXAMPLES.md z przykładami curl
- Dodanie komentarzy JSDoc w kodzie

---

## 2. DELETE /api/teams/:id/members/:userId - Usuwanie członka z zespołu

### 2.1. Przegląd punktu końcowego
Endpoint umożliwia użytkownikom z rolą HR usuwanie pojedynczego użytkownika z zespołu. Operacja jest nieodwracalna i natychmiast usuwa powiązanie między użytkownikiem a zespołem. W przypadku gdy użytkownik ma zaplanowane urlopy jako członek zespołu, mogą być wymagane dodatkowe akcje biznesowe (do rozważenia w przyszłości).

**Cel biznesowy:** Umożliwienie HR zarządzania składem zespołów poprzez usuwanie członków, którzy zmienili zespół lub opuścili organizację.

### 2.2. Szczegóły żądania

**Metoda HTTP:** `DELETE`

**Struktura URL:** `/api/teams/:id/members/:userId`

**Parametry URL:**
- **Wymagane:**
  - `id` (string, UUID) - Identyfikator zespołu
  - `userId` (string, UUID) - Identyfikator użytkownika do usunięcia

**Request Body:** Brak (DELETE request)

**Nagłówki:**
- `Cookie: sb-access-token=...` (session cookie zarządzany przez Supabase)

### 2.3. Wykorzystywane typy

**Nowe typy do dodania w `src/types.ts`:**

```typescript
/**
 * Remove team member response DTO
 * Returned after successfully removing a member from team
 */
export interface RemoveTeamMemberResponseDTO {
  message: string;
}
```

**Istniejące typy wykorzystywane:**
- Brak dodatkowych typów command (DELETE nie przyjmuje body)

### 2.4. Szczegóły odpowiedzi

**Success Response (200 OK):**
```json
{
  "message": "Member removed successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Brak autentykacji
  ```json
  {
    "error": "Unauthorized"
  }
  ```

- `403 Forbidden` - Użytkownik nie ma roli HR
  ```json
  {
    "error": "Only HR can remove team members"
  }
  ```

- `404 Not Found` - Zespół, użytkownik lub członkostwo nie istnieje
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
  lub
  ```json
  {
    "error": "User is not a member of this team"
  }
  ```

- `500 Internal Server Error` - Błąd serwera
  ```json
  {
    "error": "Internal server error"
  }
  ```

### 2.5. Przepływ danych

```
1. Request → Astro API Handler (/api/teams/[id]/members/[userId].ts)
   ↓
2. Middleware (src/middleware/index.ts)
   - Weryfikacja sesji Supabase
   - Ustawienie context.locals.supabase i context.locals.user
   ↓
3. Handler DELETE function
   - Pobranie user z context.locals
   - Sprawdzenie czy user istnieje (401 jeśli nie)
   - Sprawdzenie czy user.role === 'HR' (403 jeśli nie)
   - Pobranie teamId i userId z params
   - Walidacja UUID format dla obu parametrów
   ↓
4. Service Layer (src/lib/services/teams.service.ts)
   - Funkcja: removeMember(supabase, teamId, userId)
   - Sprawdzenie czy team istnieje (404 jeśli nie)
   - Sprawdzenie czy user istnieje (404 jeśli nie)
   - Sprawdzenie czy membership istnieje (404 jeśli nie)
   - DELETE z team_members
   - Zwrócenie sukcesu
   ↓
5. Response
   - 200 OK z RemoveTeamMemberResponseDTO
   - lub odpowiedni błąd (401/403/404/500)
```

**Interakcje z bazą danych:**
1. `SELECT id FROM teams WHERE id = $1` - weryfikacja istnienia zespołu
2. `SELECT id FROM profiles WHERE id = $1` - weryfikacja istnienia użytkownika
3. `DELETE FROM team_members WHERE team_id = $1 AND user_id = $2 RETURNING id` - usunięcie członkostwa

### 2.6. Względy bezpieczeństwa

**Autentykacja:**
- Wymagana sesja Supabase (zarządzana przez middleware)
- Token sesji przesyłany w cookie
- Weryfikacja przez `supabase.auth.getUser()`

**Autoryzacja:**
- Tylko użytkownicy z rolą `HR` mogą usuwać członków
- Sprawdzenie: `user.role === 'HR'`
- Zwrócenie 403 dla innych ról

**Walidacja danych:**
- `teamId` musi być prawidłowym UUID
- `userId` musi być prawidłowym UUID
- Użycie Zod schema dla walidacji params:
  ```typescript
  z.object({
    id: z.string().uuid(),
    userId: z.string().uuid()
  })
  ```

**Zapobieganie SQL Injection:**
- Użycie Supabase Client z parametryzowanymi zapytaniami
- Wszystkie wartości przekazywane jako parametry

**Audit Trail:**
- Logowanie operacji usunięcia w audit logs
- Zapisanie: kto, kiedy, którego użytkownika usunął z jakiego zespołu

**Ochrona przed nadużyciem:**
- Rate limiting dla operacji DELETE (np. max 100 per minute per HR user)
- Monitoring masowych usunięć

### 2.7. Obsługa błędów

| Scenariusz | Kod | Komunikat | Akcja |
|------------|-----|-----------|-------|
| Brak autentykacji | 401 | "Unauthorized" | Sprawdzenie context.locals.user |
| Brak roli HR | 403 | "Only HR can remove team members" | Sprawdzenie user.role |
| Team nie istnieje | 404 | "Team not found" | Query do teams table |
| User nie istnieje | 404 | "User not found" | Query do profiles table |
| Membership nie istnieje | 404 | "User is not a member of this team" | Query do team_members |
| Nieprawidłowe UUID (teamId) | 400 | "Invalid team ID" | Zod validation |
| Nieprawidłowe UUID (userId) | 400 | "Invalid user ID" | Zod validation |
| Błąd bazy danych | 500 | "Internal server error" | Logging + generic message |
| Cascade delete failure | 500 | "Failed to remove member" | Rollback transaction |

**Strategia logowania błędów:**
- Błędy 4xx: Info level (oczekiwane błędy użytkownika)
- Błędy 5xx: Error level (problemy systemowe)
- Logowanie szczegółów: user.id, teamId, userId, error message, stack trace

### 2.8. Wydajność

**Optymalizacje:**
1. **Single Query Delete:** Użycie DELETE z WHERE na dwóch kolumnach
2. **Index Usage:** Wykorzystanie UNIQUE index na (team_id, user_id)
3. **CASCADE Delete:** Relacyjna baza automatycznie obsługuje powiązane rekordy (jeśli będą w przyszłości)

**Potencjalne wąskie gardła:**
- Brak znaczących wąskich gardeł - prosta operacja DELETE
- Foreign key constraints validation: minimalne opóźnienie

**Szacowany czas odpowiedzi:**
- Typowy case: <100ms
- Z weryfikacją wszystkich constraints: <150ms

### 2.9. Etapy wdrożenia

#### Krok 1: Definicja typów (src/types.ts)
```typescript
// Dodać nowy typ DTO:
// - RemoveTeamMemberResponseDTO
```

#### Krok 2: Walidacja schema (src/lib/schemas/teams.schema.ts)
```typescript
export const removeTeamMemberParamsSchema = z.object({
  id: z.string().uuid("Team ID must be a valid UUID"),
  userId: z.string().uuid("User ID must be a valid UUID"),
});
```

#### Krok 3: Rozszerzenie service (src/lib/services/teams.service.ts)
```typescript
export async function removeMember(
  supabase: SupabaseClient,
  teamId: string,
  userId: string
): Promise<void> {
  // 1. Sprawdzenie istnienia zespołu
  // 2. Sprawdzenie istnienia użytkownika
  // 3. Sprawdzenie istnienia członkostwa
  // 4. DELETE z team_members
}
```

#### Krok 4: Implementacja API handler (src/pages/api/teams/[id]/members/[userId].ts)
```typescript
export const prerender = false;

import type { APIRoute } from "astro";
import { removeTeamMemberParamsSchema } from "@/lib/schemas/teams.schema";
import { removeMember } from "@/lib/services/teams.service";

export const DELETE: APIRoute = async (context) => {
  // 1. Weryfikacja autentykacji
  // 2. Sprawdzenie roli HR
  // 3. Walidacja params
  // 4. Wywołanie service
  // 5. Zwrócenie response
};
```

#### Krok 5: Testy
- Unit testy dla service layer
- Integration testy dla API endpoint
- Edge cases: non-existent team, non-existent user, non-existent membership

#### Krok 6: Dokumentacja
- Aktualizacja API_EXAMPLES.md z przykładami curl
- Dodanie komentarzy JSDoc w kodzie

---

## 3. GET /api/teams/:id/calendar - Kalendarz urlopów zespołu

### 3.1. Przegląd punktu końcowego
Endpoint udostępnia kalendarz urlopów dla zespołu, pokazując wszystkich członków zespołu wraz z ich zaplanowanymi urlopami w określonym przedziale czasowym. Endpoint wspiera różne strategie filtrowania (daty, miesiąc, status) i jest dostępny dla członków zespołu (którzy widzą tylko swój zespół) oraz HR/ADMIN (którzy widzą wszystkie zespoły).

**Cel biznesowy:** Umożliwienie zespołom planowania i koordynowania urlopów poprzez wizualizację dostępności członków zespołu w danym okresie.

### 3.2. Szczegóły żądania

**Metoda HTTP:** `GET`

**Struktura URL:** `/api/teams/:id/calendar`

**Parametry URL:**
- **Wymagane:**
  - `id` (string, UUID) - Identyfikator zespołu

**Query Parameters:**
- **Opcjonalne:**
  - `startDate` (string, ISO date) - Data początkowa dla widoku kalendarza
    - Format: `YYYY-MM-DD`
    - Default: 1 tydzień wstecz od dzisiaj
    - Przykład: `2026-01-01`
  
  - `endDate` (string, ISO date) - Data końcowa dla widoku kalendarza
    - Format: `YYYY-MM-DD`
    - Default: 2 tygodnie do przodu od dzisiaj
    - Przykład: `2026-01-31`
  
  - `month` (string) - Filtrowanie po miesiącu (zastępuje startDate/endDate)
    - Format: `YYYY-MM`
    - Przykład: `2026-01`
    - Jeśli podany, ustawia startDate na 1. dzień miesiąca i endDate na ostatni dzień
  
  - `includeStatus` (string[]) - Filtrowanie po statusach wniosków
    - Wartości: `SUBMITTED`, `APPROVED`, `REJECTED`, `CANCELLED`
    - Default: wszystkie statusy
    - Multiple values: `?includeStatus=APPROVED&includeStatus=SUBMITTED`
    - Przykład: `includeStatus=APPROVED` (tylko zatwierdzone urlopy)

**Przykładowe URL:**
```
GET /api/teams/123e4567-e89b-12d3-a456-426614174000/calendar
GET /api/teams/123e4567-e89b-12d3-a456-426614174000/calendar?month=2026-01
GET /api/teams/123e4567-e89b-12d3-a456-426614174000/calendar?startDate=2026-01-01&endDate=2026-01-31
GET /api/teams/123e4567-e89b-12d3-a456-426614174000/calendar?includeStatus=APPROVED&includeStatus=SUBMITTED
```

**Nagłówki:**
- `Cookie: sb-access-token=...` (session cookie zarządzany przez Supabase)

### 3.3. Wykorzystywane typy

**Nowe typy do dodania w `src/types.ts`:**

```typescript
/**
 * Get team calendar query parameters DTO
 * Used for filtering team vacation calendar
 */
export interface GetTeamCalendarQueryDTO {
  startDate?: string; // ISO date format YYYY-MM-DD
  endDate?: string; // ISO date format YYYY-MM-DD
  month?: string; // Format YYYY-MM
  includeStatus?: ("SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED")[];
}

/**
 * Team calendar vacation DTO
 * Represents a vacation period for a team member
 * Connected to: Database['public']['Tables']['vacation_requests']['Row']
 */
export interface TeamCalendarVacationDTO {
  id: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  businessDaysCount: number;
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
}

/**
 * Team calendar member DTO
 * Represents a team member with their vacations
 * Connected to: Database['public']['Tables']['profiles']['Row']
 * Connected to: Database['public']['Tables']['vacation_requests']['Row']
 */
export interface TeamCalendarMemberDTO {
  id: string;
  firstName: string;
  lastName: string;
  vacations: TeamCalendarVacationDTO[];
}

/**
 * Get team calendar response DTO
 * Complete calendar view for a team
 */
export interface GetTeamCalendarResponseDTO {
  teamId: string;
  teamName: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  members: TeamCalendarMemberDTO[];
}
```

**Istniejące typy wykorzystywane:**
- Typy database z `database.types.ts` (profiles, teams, vacation_requests, team_members)

### 3.4. Szczegóły odpowiedzi

**Success Response (200 OK):**
```json
{
  "teamId": "123e4567-e89b-12d3-a456-426614174000",
  "teamName": "Engineering",
  "startDate": "2026-01-01",
  "endDate": "2026-01-31",
  "members": [
    {
      "id": "user-uuid-1",
      "firstName": "John",
      "lastName": "Doe",
      "vacations": [
        {
          "id": "vacation-uuid-1",
          "startDate": "2026-01-10",
          "endDate": "2026-01-15",
          "businessDaysCount": 4,
          "status": "APPROVED"
        },
        {
          "id": "vacation-uuid-2",
          "startDate": "2026-01-25",
          "endDate": "2026-01-26",
          "businessDaysCount": 2,
          "status": "SUBMITTED"
        }
      ]
    },
    {
      "id": "user-uuid-2",
      "firstName": "Jane",
      "lastName": "Smith",
      "vacations": []
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Nieprawidłowe parametry zapytania
  ```json
  {
    "error": "Invalid date format. Expected YYYY-MM-DD"
  }
  ```
  lub
  ```json
  {
    "error": "Start date must be before or equal to end date"
  }
  ```
  lub
  ```json
  {
    "error": "Invalid month format. Expected YYYY-MM"
  }
  ```
  lub
  ```json
  {
    "error": "Invalid status value. Allowed: SUBMITTED, APPROVED, REJECTED, CANCELLED"
  }
  ```

- `401 Unauthorized` - Brak autentykacji
  ```json
  {
    "error": "Unauthorized"
  }
  ```

- `403 Forbidden` - Użytkownik EMPLOYEE nie jest członkiem zespołu
  ```json
  {
    "error": "You are not a member of this team"
  }
  ```

- `404 Not Found` - Zespół nie istnieje
  ```json
  {
    "error": "Team not found"
  }
  ```

- `500 Internal Server Error` - Błąd serwera
  ```json
  {
    "error": "Internal server error"
  }
  ```

### 3.5. Przepływ danych

```
1. Request → Astro API Handler (/api/teams/[id]/calendar.ts)
   ↓
2. Middleware (src/middleware/index.ts)
   - Weryfikacja sesji Supabase
   - Ustawienie context.locals.supabase i context.locals.user
   ↓
3. Handler GET function
   - Pobranie user z context.locals
   - Sprawdzenie czy user istnieje (401 jeśli nie)
   - Pobranie teamId z params
   - Pobranie query parameters z URL
   - Walidacja query parameters przez Zod schema
   ↓
4. Przetworzenie parametrów dat
   - Jeśli month podany: obliczenie startDate i endDate dla miesiąca
   - Jeśli startDate/endDate nie podane: ustawienie default (1 tydzień wstecz, 2 tygodnie do przodu)
   - Walidacja: startDate <= endDate
   ↓
5. Service Layer (src/lib/services/teams.service.ts)
   - Funkcja: getCalendar(supabase, userId, userRole, teamId, filters)
   - Sprawdzenie czy team istnieje (404 jeśli nie)
   - Jeśli user.role === 'EMPLOYEE':
     * Sprawdzenie czy user jest członkiem zespołu (403 jeśli nie)
   - Pobranie wszystkich członków zespołu (z team_members join profiles)
   - Dla każdego członka:
     * Pobranie vacation_requests w zakresie dat z odpowiednimi statusami
     * Mapowanie do TeamCalendarVacationDTO[]
   - Złożenie danych w TeamCalendarMemberDTO[]
   - Zwrócenie GetTeamCalendarResponseDTO
   ↓
6. Response
   - 200 OK z GetTeamCalendarResponseDTO
   - lub odpowiedni błąd (400/401/403/404/500)
```

**Interakcje z bazą danych:**

1. Weryfikacja zespołu i pobranie nazwy:
```sql
SELECT id, name FROM teams WHERE id = $1
```

2. Sprawdzenie członkostwa (tylko dla EMPLOYEE):
```sql
SELECT id FROM team_members 
WHERE team_id = $1 AND user_id = $2
```

3. Pobranie członków zespołu:
```sql
SELECT 
  p.id,
  p.first_name,
  p.last_name
FROM team_members tm
JOIN profiles p ON tm.user_id = p.id
WHERE tm.team_id = $1 
  AND p.deleted_at IS NULL
ORDER BY p.last_name, p.first_name
```

4. Pobranie urlopów dla członków (dla każdego członka lub w jednym zapytaniu z grupowaniem):
```sql
SELECT 
  vr.id,
  vr.user_id,
  vr.start_date,
  vr.end_date,
  vr.business_days_count,
  vr.status
FROM vacation_requests vr
WHERE vr.user_id = ANY($1) -- array of user IDs
  AND vr.start_date <= $2 -- endDate
  AND vr.end_date >= $3 -- startDate
  AND ($4::text[] IS NULL OR vr.status = ANY($4)) -- optional status filter
ORDER BY vr.start_date
```

**Optymalizacja:** Użycie single query z JOIN i GROUP BY zamiast N+1 queries dla urlopów.

### 3.6. Względy bezpieczeństwa

**Autentykacja:**
- Wymagana sesja Supabase (zarządzana przez middleware)
- Token sesji przesyłany w cookie
- Weryfikacja przez `supabase.auth.getUser()`

**Autoryzacja - wielopoziomowa:**
- **HR i ADMINISTRATOR:** Dostęp do kalendarza każdego zespołu
- **EMPLOYEE:** Dostęp tylko do kalendarza zespołów, do których należy
- Sprawdzenie:
  ```typescript
  if (user.role === 'EMPLOYEE') {
    // Sprawdzenie członkostwa w team_members
    if (!isMember) return 403;
  }
  // HR i ADMIN przechodzą bez sprawdzenia członkostwa
  ```

**Walidacja danych:**
- Wszystkie daty w formacie ISO (YYYY-MM-DD)
- month w formacie YYYY-MM
- includeStatus tylko z dozwolonych wartości
- startDate <= endDate
- Użycie Zod schema:
  ```typescript
  z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    includeStatus: z.array(z.enum(['SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'])).optional()
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  })
  ```

**Zapobieganie wyciekowi danych:**
- EMPLOYEE widzi tylko dane zespołów, do których należy
- Brak wyświetlania danych usuniętych użytkowników (deleted_at IS NULL)
- Tylko niezbędne pola w response (nie ma wrażliwych danych typu notes, processed_by)

**Zapobieganie SQL Injection:**
- Użycie Supabase Client z parametryzowanymi zapytaniami
- Wszystkie wartości przekazywane jako parametry

**Rate Limiting:**
- Rozważenie cache dla często zapytywanych zakresów dat
- Rate limiting: np. max 100 requests per minute per user

### 3.7. Obsługa błędów

| Scenariusz | Kod | Komunikat | Akcja |
|------------|-----|-----------|-------|
| Brak autentykacji | 401 | "Unauthorized" | Sprawdzenie context.locals.user |
| EMPLOYEE nie jest członkiem | 403 | "You are not a member of this team" | Query do team_members |
| Team nie istnieje | 404 | "Team not found" | Query do teams table |
| Nieprawidłowy format daty | 400 | "Invalid date format. Expected YYYY-MM-DD" | Zod validation |
| Nieprawidłowy format month | 400 | "Invalid month format. Expected YYYY-MM" | Zod validation |
| startDate > endDate | 400 | "Start date must be before or equal to end date" | Zod refinement |
| Nieprawidłowy status | 400 | "Invalid status value" | Zod validation |
| Nieprawidłowe UUID (teamId) | 400 | "Invalid team ID" | Zod validation |
| Zbyt duży zakres dat | 400 | "Date range cannot exceed 1 year" | Custom validation |
| Błąd bazy danych | 500 | "Internal server error" | Logging + generic message |

**Strategia logowania błędów:**
- Błędy 4xx: Info level
- Błędy 5xx: Error level
- Logowanie szczegółów: user.id, user.role, teamId, filters, error message

### 3.8. Wydajność

**Optymalizacje:**

1. **Single Query dla urlopów:** Zamiast N queries (jeden per członek), użycie jednego zapytania z `user_id = ANY($1)` i grupowanie wyników w kodzie
   ```sql
   SELECT ... WHERE user_id = ANY(ARRAY['id1', 'id2', ...])
   ```

2. **Index Usage:**
   - `team_members(team_id, user_id)` UNIQUE index
   - `vacation_requests(user_id, start_date, end_date)` composite index (do utworzenia)
   - `profiles(id)` PRIMARY KEY

3. **Caching strategia:**
   - Cache dla często zapytywanych zakresów (bieżący miesiąc, następny miesiąc)
   - TTL: 5-15 minut
   - Invalidacja przy zmianie vacation_requests

4. **Pagination (future enhancement):**
   - Jeśli zespół ma >100 członków, rozważenie paginacji członków

5. **Database View (opcjonalnie):**
   - Materialized view dla często zapytywanych kombinacji (current month per team)

**Potencjalne wąskie gardła:**
- Duże zespoły (>100 członków): długie czasy odpowiedzi
- Długie zakresy dat (>1 rok): wiele rekordów vacation_requests
- Brak odpowiednich indexów na vacation_requests

**Zalecenia:**
- Limit zakresu dat do maksymalnie 1 rok
- Utworzenie composite index:
  ```sql
  CREATE INDEX idx_vacation_requests_user_dates 
  ON vacation_requests(user_id, start_date, end_date);
  ```

**Szacowany czas odpowiedzi:**
- Mały zespół (5-10 członków), 1 miesiąc: <200ms
- Średni zespół (20-50 członków), 1 miesiąc: <500ms
- Duży zespół (100+ członków), 1 miesiąc: <1s

### 3.9. Etapy wdrożenia

#### Krok 1: Definicja typów (src/types.ts)
```typescript
// Dodać nowe typy DTO:
// - GetTeamCalendarQueryDTO
// - TeamCalendarVacationDTO
// - TeamCalendarMemberDTO
// - GetTeamCalendarResponseDTO
```

#### Krok 2: Database migration - dodanie index (supabase/migrations/)
```sql
-- Migracja: add_vacation_requests_composite_index.sql
CREATE INDEX IF NOT EXISTS idx_vacation_requests_user_dates 
ON vacation_requests(user_id, start_date, end_date)
WHERE deleted_at IS NULL;

-- Index dla szybkiego filtrowania po statusie
CREATE INDEX IF NOT EXISTS idx_vacation_requests_status 
ON vacation_requests(status)
WHERE deleted_at IS NULL;
```

#### Krok 3: Walidacja schema (src/lib/schemas/teams.schema.ts)
```typescript
const vacationStatusEnum = z.enum(['SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED']);

export const getTeamCalendarQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD")
    .optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Invalid month format. Expected YYYY-MM")
    .optional(),
  includeStatus: z.array(vacationStatusEnum).optional()
})
.refine(data => {
  // month i startDate/endDate są wzajemnie wykluczające się
  if (data.month && (data.startDate || data.endDate)) {
    return false;
  }
  return true;
}, {
  message: "Cannot use 'month' together with 'startDate' or 'endDate'"
})
.refine(data => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  }
  return true;
}, {
  message: "Start date must be before or equal to end date"
})
.refine(data => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 365;
  }
  return true;
}, {
  message: "Date range cannot exceed 1 year"
});

export const getTeamCalendarParamsSchema = z.object({
  id: z.string().uuid("Team ID must be a valid UUID")
});
```

#### Krok 4: Helper functions dla dat (src/lib/services/teams.service.ts)
```typescript
function getDefaultDateRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  const twoWeeksAhead = new Date(today);
  twoWeeksAhead.setDate(today.getDate() + 14);
  
  return {
    startDate: oneWeekAgo.toISOString().split('T')[0],
    endDate: twoWeeksAhead.toISOString().split('T')[0]
  };
}

function getMonthDateRange(month: string): { startDate: string; endDate: string } {
  const [year, monthNum] = month.split('-').map(Number);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0); // Last day of month
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}
```

#### Krok 5: Implementacja service (src/lib/services/teams.service.ts)
```typescript
export async function getCalendar(
  supabase: SupabaseClient,
  userId: string,
  userRole: string,
  teamId: string,
  filters: GetTeamCalendarQueryDTO
): Promise<GetTeamCalendarResponseDTO> {
  // 1. Sprawdzenie istnienia zespołu i pobranie nazwy
  // 2. Jeśli EMPLOYEE: sprawdzenie członkostwa
  // 3. Obliczenie finalnego zakresu dat
  // 4. Pobranie członków zespołu
  // 5. Pobranie urlopów dla członków (single query z ANY)
  // 6. Grupowanie urlopów per user
  // 7. Mapowanie do DTO
  // 8. Zwrócenie response
}
```

#### Krok 6: Implementacja API handler (src/pages/api/teams/[id]/calendar.ts)
```typescript
export const prerender = false;

import type { APIRoute } from "astro";
import { 
  getTeamCalendarQuerySchema, 
  getTeamCalendarParamsSchema 
} from "@/lib/schemas/teams.schema";
import { getCalendar } from "@/lib/services/teams.service";

export const GET: APIRoute = async (context) => {
  // 1. Weryfikacja autentykacji
  // 2. Walidacja params i query
  // 3. Wywołanie service
  // 4. Zwrócenie response
};
```

#### Krok 7: Testy
- Unit testy dla service layer:
  - getDefaultDateRange()
  - getMonthDateRange()
  - getCalendar() z różnymi filtrami
- Integration testy dla API endpoint:
  - HR dostęp do każdego zespołu
  - EMPLOYEE dostęp tylko do swojego zespołu
  - EMPLOYEE 403 dla obcego zespołu
  - Filtrowanie po month
  - Filtrowanie po startDate/endDate
  - Filtrowanie po includeStatus
- Edge cases:
  - Zespół bez członków
  - Członkowie bez urlopów
  - Nieprawidłowe zakresy dat
  - Bardzo duże zespoły

#### Krok 8: Dokumentacja
- Aktualizacja API_EXAMPLES.md z przykładami curl dla wszystkich wariantów filtrowania
- Dodanie komentarzy JSDoc w kodzie
- Dokumentacja format daty i możliwości filtrowania

---

## Podsumowanie i kolejność implementacji

### Zalecana kolejność implementacji:

1. **POST /api/teams/:id/members** (najprostszy, podstawowa funkcjonalność)
2. **DELETE /api/teams/:id/members/:userId** (prosty, komplementarny do POST)
3. **GET /api/teams/:id/calendar** (najbardziej złożony, wymaga wcześniejszych endpointów)

### Wspólne elementy do implementacji przed wszystkimi endpointami:

1. **Definicja wszystkich typów DTO w src/types.ts**
2. **Walidacja schemas w src/lib/schemas/teams.schema.ts**
3. **Database migration dla indexów (dla calendar endpoint)**

### Wspólne zależności:

- Middleware autentykacji (już istniejący)
- Supabase client configuration (już istniejący)
- teams.service.ts (rozszerzenie o nowe funkcje)

### Checklist przed rozpoczęciem implementacji:

- [ ] Review istniejącego kodu teams service
- [ ] Review istniejących API handlers dla teams
- [ ] Określenie konwencji nazewnictwa plików dla nested routes
- [ ] Przygotowanie środowiska testowego
- [ ] Przygotowanie test data w bazie danych

### Szacowany czas implementacji:

- **POST /api/teams/:id/members:** 4-6 godzin (typy, schema, service, handler, testy)
- **DELETE /api/teams/:id/members/:userId:** 3-4 godziny (typy, schema, service, handler, testy)
- **GET /api/teams/:id/calendar:** 8-10 godzin (typy, schema, service z złożoną logiką, handler, testy, optimizations)

**Łącznie:** ~15-20 godzin roboczych

