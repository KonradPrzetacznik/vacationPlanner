# API Endpoint Implementation Plan: Teams Management

## 1. Przegląd punktów końcowych

Zestaw pięciu endpointów REST API do zarządzania zespołami w systemie:

1. **List Teams** - pobieranie listy zespołów z opcjonalną paginacją i zliczaniem członków
2. **Get Team** - pobieranie szczegółów pojedynczego zespołu wraz z listą członków
3. **Create Team** - tworzenie nowego zespołu (wyłącznie dla HR)
4. **Update Team** - aktualizacja nazwy zespołu (wyłącznie dla HR)
5. **Delete Team** - usuwanie zespołu (wyłącznie dla HR)

Endpointy implementują kontrolę dostępu opartą na rolach:

- **HR i ADMINISTRATOR**: pełny dostęp do wszystkich operacji
- **EMPLOYEE**: dostęp tylko do odczytu zespołów, do których należy

## 2. Szczegóły żądań

### 2.1. List Teams

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/teams`
- **Parametry**:
  - **Opcjonalne**:
    - `limit` (number, 1-100, default: 50) - liczba wyników na stronę
    - `offset` (number, >=0, default: 0) - offset paginacji
    - `includeMemberCount` (boolean, default: false) - czy uwzględnić licznik członków
- **Request Body**: brak
- **Uwierzytelnienie**: wymagane (JWT token w cookie)

### 2.2. Get Team

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/teams/:id`
- **Parametry**:
  - **Wymagane**:
    - `id` (UUID) - identyfikator zespołu w URL
  - **Opcjonalne**: brak
- **Request Body**: brak
- **Uwierzytelnienie**: wymagane (JWT token w cookie)
- **Autoryzacja**: EMPLOYEE może widzieć tylko zespoły, do których należy

### 2.3. Create Team

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/teams`
- **Parametry**: brak
- **Request Body**:

```json
{
  "name": "Engineering"
}
```

- **Walidacja body**:
  - `name`: wymagany, string, niepusty, max 100 znaków, unikalny
- **Uwierzytelnienie**: wymagane (JWT token w cookie)
- **Autoryzacja**: tylko HR lub ADMINISTRATOR

### 2.4. Update Team

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/teams/:id`
- **Parametry**:
  - **Wymagane**:
    - `id` (UUID) - identyfikator zespołu w URL
- **Request Body**:

```json
{
  "name": "Engineering Team"
}
```

- **Walidacja body**:
  - `name`: wymagany, string, niepusty, max 100 znaków, unikalny
- **Uwierzytelnienie**: wymagane (JWT token w cookie)
- **Autoryzacja**: tylko HR lub ADMINISTRATOR

### 2.5. Delete Team

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/teams/:id`
- **Parametry**:
  - **Wymagane**:
    - `id` (UUID) - identyfikator zespołu w URL
- **Request Body**: brak
- **Uwierzytelnienie**: wymagane (JWT token w cookie)
- **Autoryzacja**: tylko HR lub ADMINISTRATOR

## 3. Wykorzystywane typy

### 3.1. Typy do dodania w `src/types.ts`

```typescript
// ============================================================================
// Teams DTOs
// ============================================================================

/**
 * Get teams query parameters DTO
 * Used for filtering and paginating teams lists
 */
export interface GetTeamsQueryDTO {
  limit?: number;
  offset?: number;
  includeMemberCount?: boolean;
}

/**
 * Team list item DTO
 * Derived from teams table, represents a single team in the list
 * Connected to: Database['public']['Tables']['teams']['Row']
 */
export interface TeamListItemDTO {
  id: string;
  name: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pagination metadata for teams list
 */
export interface TeamsPaginationDTO {
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get teams response DTO
 * Complete response with data and pagination
 */
export interface GetTeamsResponseDTO {
  data: TeamListItemDTO[];
  pagination: TeamsPaginationDTO;
}

/**
 * Team member DTO
 * Simplified user information for team details
 * Connected to: Database['public']['Tables']['profiles']['Row']
 * Connected to: Database['public']['Tables']['team_members']['Row']
 */
export interface TeamMemberDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  joinedAt: string;
}

/**
 * Team details DTO
 * Extended team information with members list
 * Connected to: Database['public']['Tables']['teams']['Row']
 */
export interface TeamDetailsDTO {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMemberDTO[];
}

/**
 * Get team by ID response DTO
 * Complete response with team details
 */
export interface GetTeamByIdResponseDTO {
  data: TeamDetailsDTO;
}

/**
 * Create team command DTO
 * Used by HR to create new teams
 * Connected to: Database['public']['Tables']['teams']['Insert']
 */
export interface CreateTeamDTO {
  name: string;
}

/**
 * Create team response DTO
 * Returned after successful team creation
 */
export interface CreateTeamResponseDTO {
  id: string;
  name: string;
  createdAt: string;
}

/**
 * Update team command DTO
 * Used to update team information
 */
export interface UpdateTeamDTO {
  name: string;
}

/**
 * Update team response DTO
 * Returned after successful team update
 */
export interface UpdateTeamResponseDTO {
  id: string;
  name: string;
  updatedAt: string;
}

/**
 * Delete team response DTO
 * Returned after successful team deletion
 */
export interface DeleteTeamResponseDTO {
  message: string;
  id: string;
}
```

## 4. Szczegóły odpowiedzi

### 4.1. List Teams - 200 OK

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Engineering",
      "memberCount": 15,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 50,
    "offset": 0
  }
}
```

### 4.2. Get Team - 200 OK

```json
{
  "data": {
    "id": "uuid",
    "name": "Engineering",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
    "members": [
      {
        "id": "user-uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "role": "EMPLOYEE",
        "joinedAt": "2026-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 4.3. Create Team - 201 Created

```json
{
  "id": "uuid",
  "name": "Engineering",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

### 4.4. Update Team - 200 OK

```json
{
  "id": "uuid",
  "name": "Engineering Team",
  "updatedAt": "2026-01-01T12:00:00Z"
}
```

### 4.5. Delete Team - 200 OK

```json
{
  "message": "Team deleted successfully",
  "id": "uuid"
}
```

### 4.6. Odpowiedzi błędów

**400 Bad Request:**

```json
{
  "success": false,
  "error": "Invalid query parameters" | "Invalid team name" | "Team name already exists"
}
```

**401 Unauthorized:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

**403 Forbidden:**

```json
{
  "success": false,
  "error": "Insufficient permissions" | "Not a member of this team"
}
```

**404 Not Found:**

```json
{
  "success": false,
  "error": "Team not found"
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "error": "Internal server error"
}
```

## 5. Przepływ danych

### 5.1. List Teams

```
1. Request → API Route (/api/teams/index.ts GET handler)
2. Walidacja query params (Zod schema)
3. Pobranie user_id i role z context.locals.user
4. Wywołanie teams.service.getTeams(query, user_id, role)
5. Service:
   a. Jeśli EMPLOYEE: query do team_members dla user_id → lista team_id
   b. Query do teams z filtrem (jeśli EMPLOYEE: WHERE id IN team_ids)
   c. Jeśli includeMemberCount: JOIN z team_members + COUNT
   d. Zastosowanie limit i offset
   e. COUNT(*) OVER() dla total
6. Mapowanie database rows → TeamListItemDTO[]
7. Return GetTeamsResponseDTO
8. API Route → Response 200 JSON
```

### 5.2. Get Team

```
1. Request → API Route (/api/teams/[id].ts GET handler)
2. Walidacja id param (UUID)
3. Pobranie user_id i role z context.locals.user
4. Wywołanie teams.service.getTeamById(team_id, user_id, role)
5. Service:
   a. Query do teams WHERE id = team_id
   b. Jeśli nie znaleziono → throw 404
   c. Jeśli EMPLOYEE: sprawdzenie członkostwa w team_members
   d. Jeśli nie jest członkiem → throw 403
   e. Query do team_members JOIN profiles WHERE team_id = team_id
   f. Mapowanie members → TeamMemberDTO[]
6. Mapowanie → TeamDetailsDTO
7. Return GetTeamByIdResponseDTO
8. API Route → Response 200 JSON
```

### 5.3. Create Team

```
1. Request → API Route (/api/teams/index.ts POST handler)
2. Parsowanie body JSON
3. Walidacja body (Zod schema)
4. Pobranie user_id i role z context.locals.user
5. Sprawdzenie role === HR lub ADMINISTRATOR → jeśli nie throw 403
6. Wywołanie teams.service.createTeam(data)
7. Service:
   a. Sprawdzenie unikalności name w teams
   b. Jeśli istnieje → throw 400 "Team name already exists"
   c. INSERT INTO teams (name) VALUES (data.name) RETURNING *
8. Mapowanie → CreateTeamResponseDTO
9. API Route → Response 201 JSON
```

### 5.4. Update Team

```
1. Request → API Route (/api/teams/[id].ts PATCH handler)
2. Walidacja id param (UUID)
3. Parsowanie body JSON
4. Walidacja body (Zod schema)
5. Pobranie user_id i role z context.locals.user
6. Sprawdzenie role === HR lub ADMINISTRATOR → jeśli nie throw 403
7. Wywołanie teams.service.updateTeam(team_id, data)
8. Service:
   a. Sprawdzenie czy zespół istnieje
   b. Jeśli nie → throw 404
   c. Sprawdzenie unikalności name (wykluczając current team)
   d. Jeśli istnieje → throw 400 "Team name already exists"
   e. UPDATE teams SET name = data.name, updated_at = NOW() WHERE id = team_id RETURNING *
9. Mapowanie → UpdateTeamResponseDTO
10. API Route → Response 200 JSON
```

### 5.5. Delete Team

```
1. Request → API Route (/api/teams/[id].ts DELETE handler)
2. Walidacja id param (UUID)
3. Pobranie user_id i role z context.locals.user
4. Sprawdzenie role === HR lub ADMINISTRATOR → jeśli nie throw 403
5. Wywołanie teams.service.deleteTeam(team_id)
6. Service:
   a. Sprawdzenie czy zespół istnieje
   b. Jeśli nie → throw 404
   c. DELETE FROM teams WHERE id = team_id
   d. CASCADE automatycznie usunie rekordy z team_members
7. Return DeleteTeamResponseDTO
8. API Route → Response 200 JSON
```

## 6. Względy bezpieczeństwa

### 6.1. Uwierzytelnianie

- Wszystkie endpointy wymagają uwierzytelnienia
- Token JWT przechowywany w cookie
- Weryfikacja tokenu w middleware Astro (`src/middleware/index.ts`)
- User ID i role dostępne w `context.locals.user`

### 6.2. Autoryzacja

**Kontrola dostępu oparta na rolach:**

| Endpoint    | ADMINISTRATOR     | HR                | EMPLOYEE            |
| ----------- | ----------------- | ----------------- | ------------------- |
| List Teams  | Wszystkie zespoły | Wszystkie zespoły | Tylko swoje zespoły |
| Get Team    | Wszystkie zespoły | Wszystkie zespoły | Tylko swoje zespoły |
| Create Team | ✓                 | ✓                 | ✗ (403)             |
| Update Team | ✓                 | ✓                 | ✗ (403)             |
| Delete Team | ✓                 | ✓                 | ✗ (403)             |

**Implementacja:**

- Sprawdzenie roli w API route przed wywołaniem service
- EMPLOYEE: dodatkowe sprawdzenie członkostwa w zespole
- Return 403 Forbidden przy braku uprawnień

### 6.3. Walidacja danych

**Zod schemas (`src/lib/schemas/teams.schema.ts`):**

```typescript
// Query parameters dla List Teams
- limit: z.number().int().min(1).max(100).default(50)
- offset: z.number().int().min(0).default(0)
- includeMemberCount: z.boolean().default(false)

// Team ID param
- id: z.string().uuid()

// Create/Update Team
- name: z.string().min(1).max(100).trim()
```

### 6.4. Zapobieganie atakom

**SQL Injection:**

- Używanie Supabase client z prepared statements
- Parametryzowane zapytania
- Walidacja UUID przed queries

**IDOR (Insecure Direct Object Reference):**

- Weryfikacja członkostwa dla EMPLOYEE przed zwróceniem danych
- Sprawdzenie istnienia zasobu przed operacjami

**Mass Assignment:**

- Tylko pole `name` może być modyfikowane
- Zod schemas zapewniają strict validation
- Ignorowanie dodatkowych pól w request body

**Information Disclosure:**

- EMPLOYEE nie widzi zespołów, do których nie należy
- Errory nie ujawniają szczegółów implementacji
- Generic error messages dla użytkowników

### 6.5. Rate Limiting

- Implementacja rate limiting w middleware (jeśli jeszcze nie istnieje)
- Sugerowane limity:
  - GET endpoints: 100 req/min per user
  - POST/PATCH/DELETE: 20 req/min per user

## 7. Obsługa błędów

### 7.1. Lista błędów według endpointu

**List Teams:**

- `400`: Nieprawidłowe parametry query (limit poza zakresem, offset ujemny, nieprawidłowy typ)
- `401`: Brak tokenu autentykacji lub token wygasł
- `500`: Błąd bazy danych, błąd serwera

**Get Team:**

- `400`: Nieprawidłowy UUID w parametrze id
- `401`: Brak tokenu autentykacji lub token wygasł
- `403`: EMPLOYEE próbuje dostać się do zespołu, do którego nie należy
- `404`: Zespół o podanym ID nie istnieje
- `500`: Błąd bazy danych, błąd serwera

**Create Team:**

- `400`: Brak pola name, pusta nazwa, nazwa za długa (>100 znaków), nazwa już istnieje
- `401`: Brak tokenu autentykacji lub token wygasł
- `403`: Użytkownik nie ma roli HR ani ADMINISTRATOR
- `500`: Błąd bazy danych, błąd serwera

**Update Team:**

- `400`: Nieprawidłowy UUID, brak pola name, pusta nazwa, nazwa za długa, nazwa już istnieje
- `401`: Brak tokenu autentykacji lub token wygasł
- `403`: Użytkownik nie ma roli HR ani ADMINISTRATOR
- `404`: Zespół o podanym ID nie istnieje
- `500`: Błąd bazy danych, błąd serwera

**Delete Team:**

- `400`: Nieprawidłowy UUID w parametrze id
- `401`: Brak tokenu autentykacji lub token wygasł
- `403`: Użytkownik nie ma roli HR ani ADMINISTRATOR
- `404`: Zespół o podanym ID nie istnieje
- `500`: Błąd bazy danych, błąd serwera

### 7.2. Strategia obsługi błędów

**W API Routes:**

```typescript
try {
  // Walidacja Zod
  // Sprawdzenie autoryzacji
  // Wywołanie service
  // Return response
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid input data",
      }),
      { status: 400 }
    );
  }

  if (error.message === "Team not found") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Team not found",
      }),
      { status: 404 }
    );
  }

  if (error.message === "Team name already exists") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Team name already exists",
      }),
      { status: 400 }
    );
  }

  if (error.message === "Not a member of this team") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Not a member of this team",
      }),
      { status: 403 }
    );
  }

  console.error("Teams API error:", error);
  return new Response(
    JSON.stringify({
      success: false,
      error: "Internal server error",
    }),
    { status: 500 }
  );
}
```

**W Service:**

- Rzucanie custom errors z opisowymi messages
- Nie logowanie wrażliwych danych
- Przekazywanie błędów Supabase z odpowiednim contextm

### 7.3. Logging

- Console.error dla błędów 500
- Nie logowanie danych osobowych (email, nazwiska)
- Logowanie: timestamp, endpoint, user_id, error type, error message (bez stack trace dla produkcji)

## 8. Rozważania dotyczące wydajności

### 8.1. Optymalizacje zapytań

**List Teams:**

- Index na `teams.name` dla sortowania
- Conditional JOIN dla memberCount (tylko gdy includeMemberCount=true)
- Limit query results (max 100)
- COUNT(\*) OVER() dla total bez dodatkowego query

**Get Team:**

- Index na `team_members.team_id` dla szybkiego JOIN
- Index na `team_members.user_id` dla sprawdzenia członkostwa
- Single query z JOIN zamiast N+1 queries

**Create/Update Team:**

- Index na `teams.name` dla sprawdzenia unikalności (już istnieje UNIQUE constraint)

### 8.2. Caching

- **List Teams**: Cache na 5 minut (invalidacja przy create/update/delete)
- **Get Team**: Cache na 10 minut (invalidacja przy update team lub zmianie członków)
- Cache key: `teams:list:{role}:{userId}:{limit}:{offset}:{includeMemberCount}`
- Cache key: `teams:details:{teamId}`

### 8.3. Paginacja

- Default limit: 50
- Max limit: 100
- Używanie offset-based pagination (wystarczające dla małych/średnich dataset'ów)
- Rozważenie cursor-based pagination w przyszłości dla większych dataset'ów

### 8.4. N+1 Query Prevention

- List Teams: Single query z optional COUNT subquery
- Get Team: Single query z JOIN dla members
- Unikanie iteracji po results z dodatkowymi queries

### 8.5. Database Indexes

Wymagane indexes (sprawdzić czy istnieją, jeśli nie - dodać w migracji):

```sql
-- teams table
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON teams(created_at);

-- team_members table
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_user ON team_members(team_id, user_id);
```

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie typów i schematów

**1.1. Dodanie typów DTO do `src/types.ts`**

- Dodać wszystkie typy z sekcji "3. Wykorzystywane typy"
- Umieścić w sekcji "Teams DTOs" przed końcem pliku
- Dodać komentarze opisujące połączenia z database entities

**1.2. Utworzenie Zod schemas w `src/lib/schemas/teams.schema.ts`**

```typescript
import { z } from "zod";

export const getTeamsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  includeMemberCount: z.coerce.boolean().default(false),
});

export const teamIdParamSchema = z.object({
  id: z.string().uuid("Invalid team ID format"),
});

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100, "Team name too long").trim(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100, "Team name too long").trim(),
});
```

### Krok 2: Implementacja serwisu

**2.1. Utworzenie `src/lib/services/teams.service.ts`**

Implementacja następujących metod:

```typescript
import type { SupabaseClient } from "../db/supabase.client";
import type {
  GetTeamsQueryDTO,
  GetTeamsResponseDTO,
  TeamListItemDTO,
  TeamDetailsDTO,
  CreateTeamDTO,
  CreateTeamResponseDTO,
  UpdateTeamDTO,
  UpdateTeamResponseDTO,
  DeleteTeamResponseDTO,
} from "../../types";

export async function getTeams(
  supabase: SupabaseClient,
  query: GetTeamsQueryDTO,
  userId: string,
  userRole: string
): Promise<GetTeamsResponseDTO>;

export async function getTeamById(
  supabase: SupabaseClient,
  teamId: string,
  userId: string,
  userRole: string
): Promise<TeamDetailsDTO>;

export async function createTeam(supabase: SupabaseClient, data: CreateTeamDTO): Promise<CreateTeamResponseDTO>;

export async function updateTeam(
  supabase: SupabaseClient,
  teamId: string,
  data: UpdateTeamDTO
): Promise<UpdateTeamResponseDTO>;

export async function deleteTeam(supabase: SupabaseClient, teamId: string): Promise<DeleteTeamResponseDTO>;
```

**Szczegóły implementacji:**

- `getTeams`:
  - Sprawdzenie roli: jeśli EMPLOYEE → query do team_members dla userId
  - Query do teams z filtrem (dla EMPLOYEE: WHERE id IN)
  - Optional LEFT JOIN + COUNT dla memberCount
  - Zastosowanie limit, offset
  - COUNT(\*) OVER() dla total
  - Mapowanie do TeamListItemDTO[]

- `getTeamById`:
  - Query do teams WHERE id = teamId
  - Jeśli nie znaleziono → throw Error("Team not found")
  - Jeśli EMPLOYEE → sprawdzenie członkostwa w team_members
  - Jeśli nie jest członkiem → throw Error("Not a member of this team")
  - Query members: SELECT profiles.\*, team_members.created_at FROM team_members JOIN profiles
  - Mapowanie do TeamDetailsDTO

- `createTeam`:
  - Sprawdzenie unikalności: SELECT COUNT(\*) FROM teams WHERE name = data.name
  - Jeśli > 0 → throw Error("Team name already exists")
  - INSERT INTO teams RETURNING \*
  - Mapowanie do CreateTeamResponseDTO

- `updateTeam`:
  - Query SELECT \* FROM teams WHERE id = teamId
  - Jeśli nie znaleziono → throw Error("Team not found")
  - Sprawdzenie unikalności (wykluczając current): SELECT COUNT(\*) WHERE name = data.name AND id != teamId
  - Jeśli > 0 → throw Error("Team name already exists")
  - UPDATE teams SET name, updated_at RETURNING \*
  - Mapowanie do UpdateTeamResponseDTO

- `deleteTeam`:
  - Query SELECT \* FROM teams WHERE id = teamId
  - Jeśli nie znaleziono → throw Error("Team not found")
  - DELETE FROM teams WHERE id = teamId
  - Return DeleteTeamResponseDTO

### Krok 3: Implementacja API routes

**3.1. Utworzenie struktury folderów**

```
src/pages/api/teams/
  ├── index.ts         (GET List, POST Create)
  └── [id].ts          (GET Details, PATCH Update, DELETE)
```

**3.2. Implementacja `src/pages/api/teams/index.ts`**

```typescript
export const prerender = false;

import type { APIRoute } from "astro";
import { getTeamsQuerySchema, createTeamSchema } from "../../../lib/schemas/teams.schema";
import { getTeams, createTeam } from "../../../lib/services/teams.service";

// GET /api/teams - List Teams
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Sprawdzenie autentykacji
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication required",
        }),
        { status: 401 }
      );
    }

    // 2. Parsowanie i walidacja query params
    const url = new URL(request.url);
    const queryParams = {
      limit: url.searchParams.get("limit"),
      offset: url.searchParams.get("offset"),
      includeMemberCount: url.searchParams.get("includeMemberCount"),
    };

    const validatedQuery = getTeamsQuerySchema.parse(queryParams);

    // 3. Wywołanie service
    const result = await getTeams(locals.supabase, validatedQuery, locals.user.id, locals.user.role);

    // 4. Zwrócenie odpowiedzi
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Obsługa błędów (patrz sekcja 7.2)
  }
};

// POST /api/teams - Create Team
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Sprawdzenie autentykacji
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication required",
        }),
        { status: 401 }
      );
    }

    // 2. Sprawdzenie autoryzacji
    if (locals.user.role !== "HR" && locals.user.role !== "ADMINISTRATOR") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Insufficient permissions",
        }),
        { status: 403 }
      );
    }

    // 3. Parsowanie i walidacja body
    const body = await request.json();
    const validatedData = createTeamSchema.parse(body);

    // 4. Wywołanie service
    const result = await createTeam(locals.supabase, validatedData);

    // 5. Zwrócenie odpowiedzi
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Obsługa błędów (patrz sekcja 7.2)
  }
};
```

**3.3. Implementacja `src/pages/api/teams/[id].ts`**

```typescript
export const prerender = false;

import type { APIRoute } from "astro";
import { teamIdParamSchema, updateTeamSchema } from "../../../lib/schemas/teams.schema";
import { getTeamById, updateTeam, deleteTeam } from "../../../lib/services/teams.service";

// GET /api/teams/:id - Get Team Details
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Sprawdzenie autentykacji
    // 2. Walidacja id param
    // 3. Wywołanie service
    // 4. Zwrócenie odpowiedzi w formacie GetTeamByIdResponseDTO
  } catch (error) {
    // Obsługa błędów
  }
};

// PATCH /api/teams/:id - Update Team
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Sprawdzenie autentykacji
    // 2. Sprawdzenie autoryzacji (HR/ADMIN)
    // 3. Walidacja id param
    // 4. Parsowanie i walidacja body
    // 5. Wywołanie service
    // 6. Zwrócenie odpowiedzi
  } catch (error) {
    // Obsługa błędów
  }
};

// DELETE /api/teams/:id - Delete Team
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Sprawdzenie autentykacji
    // 2. Sprawdzenie autoryzacji (HR/ADMIN)
    // 3. Walidacja id param
    // 4. Wywołanie service
    // 5. Zwrócenie odpowiedzi
  } catch (error) {
    // Obsługa błędów
  }
};
```

### Krok 4: Testy API

**4.1. Utworzenie testów w `tests/api/`**

Utworzyć następujące pliki testowe:

- `teams-list.test.sh` - test GET /api/teams
- `teams-get.test.sh` - test GET /api/teams/:id
- `teams-create.test.sh` - test POST /api/teams
- `teams-update.test.sh` - test PATCH /api/teams/:id
- `teams-delete.test.sh` - test DELETE /api/teams/:id

**4.2. Scenariusze testowe dla każdego endpointu**

**List Teams:**

- ✓ 200: Lista zespołów dla HR
- ✓ 200: Lista zespołów dla EMPLOYEE (tylko swoje)
- ✓ 200: Z includeMemberCount=true
- ✓ 200: Z custom limit/offset
- ✗ 400: Invalid limit (>100)
- ✗ 400: Invalid offset (<0)
- ✗ 401: Brak tokenu

**Get Team:**

- ✓ 200: Szczegóły zespołu dla HR
- ✓ 200: Szczegóły zespołu dla EMPLOYEE (członek)
- ✗ 400: Invalid UUID
- ✗ 401: Brak tokenu
- ✗ 403: EMPLOYEE nie należy do zespołu
- ✗ 404: Team not found

**Create Team:**

- ✓ 201: Utworzenie zespołu przez HR
- ✗ 400: Pusta nazwa
- ✗ 400: Nazwa już istnieje
- ✗ 400: Nazwa za długa
- ✗ 401: Brak tokenu
- ✗ 403: EMPLOYEE próbuje utworzyć

**Update Team:**

- ✓ 200: Aktualizacja przez HR
- ✗ 400: Invalid UUID
- ✗ 400: Pusta nazwa
- ✗ 400: Nazwa już istnieje
- ✗ 401: Brak tokenu
- ✗ 403: EMPLOYEE próbuje zaktualizować
- ✗ 404: Team not found

**Delete Team:**

- ✓ 200: Usunięcie przez HR
- ✗ 400: Invalid UUID
- ✗ 401: Brak tokenu
- ✗ 403: EMPLOYEE próbuje usunąć
- ✗ 404: Team not found

**4.3. Dodanie do `tests/api/run-all.sh`**

```bash
# Dodać wywołania nowych testów:
./tests/api/teams-list.test.sh
./tests/api/teams-get.test.sh
./tests/api/teams-create.test.sh
./tests/api/teams-update.test.sh
./tests/api/teams-delete.test.sh
```

### Krok 5: Dokumentacja API

**5.1. Aktualizacja `docs/API_EXAMPLES.md`**

Dodać sekcję "Teams API" z przykładami:

- Request/Response dla każdego endpointu
- Przykłady błędów
- Przykłady użycia curl

**5.2. Przykładowa struktura dokumentacji**

```markdown
## Teams API

### List Teams

GET /api/teams?limit=10&offset=0&includeMemberCount=true

### Get Team

GET /api/teams/{team-id}

### Create Team

POST /api/teams
Content-Type: application/json
{
"name": "Engineering"
}

### Update Team

PATCH /api/teams/{team-id}
Content-Type: application/json
{
"name": "Engineering Team"
}

### Delete Team

DELETE /api/teams/{team-id}
```

### Krok 6: Weryfikacja i optymalizacja

**6.1. Sprawdzenie indexes w bazie danych**

- Uruchomić query sprawdzający indexes na teams i team_members
- Jeśli brakuje - utworzyć migrację (patrz sekcja 8.5)

**6.2. Testowanie wydajności**

- Test z 100+ teams
- Test z teams z 50+ members
- Zmierzyć czas response dla każdego endpointu
- Cel: <200ms dla List, <100ms dla Get

**6.3. Code review checklist**

- [ ] Wszystkie endpointy zwracają poprawne status codes
- [ ] Walidacja wszystkich inputs (params, query, body)
- [ ] Autoryzacja implementowana zgodnie z requirements
- [ ] Error handling covers wszystkie scenariusze
- [ ] Service methods są reusable i testowalne
- [ ] Brak N+1 queries
- [ ] Typy TypeScript są poprawne i kompletne
- [ ] Testy API przechodzą dla wszystkich scenariuszy
- [ ] Dokumentacja jest aktualna

**6.4. Uruchomienie wszystkich testów**

```bash
./tests/api/run-all.sh
```

**6.5. Sprawdzenie błędów TypeScript i Linter**

```bash
npm run type-check
npm run lint
```

### Krok 7: Deployment checklist

- [ ] Wszystkie testy przechodzą
- [ ] Brak błędów TypeScript
- [ ] Brak błędów linter
- [ ] Dokumentacja API zaktualizowana
- [ ] Indexes utworzone w bazie danych
- [ ] Code review completed
- [ ] Security review completed
- [ ] Performance testing completed

---

## Dodatkowe uwagi

### Przyszłe usprawnienia

1. **Caching**: Implementacja Redis cache dla często odpytywanych zespołów
2. **Search**: Dodanie możliwości wyszukiwania zespołów po nazwie
3. **Sorting**: Dodanie parametru sort_by (name, created_at, member_count)
4. **Filtering**: Dodanie filtrowania po liczbie członków (min/max)
5. **Bulk operations**: Endpoint do bulk assign/remove members
6. **Team archiving**: Soft-delete dla teams zamiast hard-delete
7. **Audit log**: Logowanie wszystkich operacji na zespołach
8. **Webhooks**: Powiadomienia o zmianach w zespołach
9. **Export**: Endpoint do exportu listy zespołów (CSV/Excel)

### Zależności z innymi endpointami

- **Users API**: Team members są pobierani z profiles
- **Vacation Requests API**: Będzie wykorzystywać team_id dla workflow approvals
- **Notifications API**: Powiadomienia o dodaniu/usunięciu z zespołu

### Database migrations

Jeśli brakuje indexes, utworzyć migrację:

```sql
-- migrations/YYYYMMDDHHMMSS_add_teams_indexes.sql

CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON teams(created_at);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_created_at ON team_members(created_at);

-- Composite index dla frequent queries
CREATE INDEX IF NOT EXISTS idx_team_members_team_user ON team_members(team_id, user_id);
```
