# API Endpoint Implementation Plan: GET /api/users/:id

## 1. Przegląd punktu końcowego

Endpoint służy do pobierania szczegółowych danych pojedynczego użytkownika na podstawie jego ID. Zwraca profil użytkownika wraz z listą zespołów, do których należy. Endpoint wspiera autoryzację opartą na rolach:
- **Administratorzy** mogą pobierać dane wszystkich użytkowników (włącznie z soft-deleted)
- **HR** może pobierać dane aktywnych użytkowników
- **Pracownicy (EMPLOYEE)** mogą pobierać tylko własne dane

Endpoint wykorzystuje pattern już zaimplementowany w GET /api/users (lista użytkowników) i rozszerza go o pobieranie pojedynczego użytkownika wraz z jego zespołami.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/users/:id`
  - `:id` - UUID użytkownika do pobrania
- **Parametry**:
  - **Wymagane**:
    - `id` (path parameter) - UUID użytkownika, format: `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`
  - **Opcjonalne**: brak
- **Request Body**: brak (metoda GET)
- **Headers**:
  - `Authorization: Bearer <token>` (planowane - obecnie używany DEFAULT_USER_ID)
- **Query Parameters**: brak

## 3. Wykorzystywane typy

### Nowe typy do dodania w `src/types.ts`:

```typescript
/**
 * Team reference DTO
 * Simplified team information for user details
 */
export interface TeamReferenceDTO {
  id: string;
  name: string;
}

/**
 * User details DTO
 * Extended user information with team memberships
 * Derived from Users entity with teams relationship
 */
export interface UserDetailsDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  teams: TeamReferenceDTO[];
}

/**
 * Get user by ID response DTO
 * Wraps user details in API response format
 */
export interface GetUserByIdResponseDTO {
  data: UserDetailsDTO;
}
```

### Schemat walidacji Zod (w pliku endpointu):

```typescript
const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK):

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "EMPLOYEE",
    "deletedAt": null,
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
    "teams": [
      {
        "id": "650e8400-e29b-41d4-a716-446655440001",
        "name": "Engineering"
      },
      {
        "id": "750e8400-e29b-41d4-a716-446655440002",
        "name": "Product"
      }
    ]
  }
}
```

### Błąd walidacji parametru (400 Bad Request):

```json
{
  "error": "Invalid user ID format",
  "details": {
    "id": ["Invalid UUID"]
  }
}
```

### Nieautoryzowany dostęp (401 Unauthorized):

```json
{
  "error": "Authentication required"
}
```

**Uwaga**: Obecnie w projekcie używany jest `DEFAULT_USER_ID`, więc 401 nie jest aktywnie sprawdzane. Ten kod zostanie wykorzystany po implementacji pełnej autentykacji.

### Brak uprawnień (403 Forbidden):

```json
{
  "error": "Insufficient permissions to view this user"
}
```

Zwracane gdy:
- Pracownik (EMPLOYEE) próbuje pobrać dane innego użytkownika
- HR próbuje pobrać dane soft-deleted użytkownika

### Użytkownik nie istnieje (404 Not Found):

```json
{
  "error": "User not found"
}
```

### Błąd serwera (500 Internal Server Error):

```json
{
  "error": "Internal server error"
}
```

## 5. Przepływ danych

### 5.1. Walidacja żądania

1. Endpoint odbiera żądanie GET na `/api/users/:id`
2. Parametr `:id` jest wyodrębniany z URL
3. Walidacja UUID za pomocą schematu Zod `userIdParamSchema`
4. Jeśli walidacja się nie powiedzie → 400 Bad Request

### 5.2. Autoryzacja

1. Pobranie `currentUserId` z `DEFAULT_USER_ID` (później z tokenu)
2. Pobranie roli aktualnego użytkownika z bazy danych
3. Sprawdzenie uprawnień:
   - Jeśli ADMINISTRATOR → dostęp do wszystkich użytkowników
   - Jeśli HR → dostęp do aktywnych użytkowników (deleted_at IS NULL)
   - Jeśli EMPLOYEE → dostęp tylko gdy `id === currentUserId`
4. Jeśli brak uprawnień → 403 Forbidden

### 5.3. Pobieranie danych

1. Wywołanie funkcji RPC `get_user_by_id_with_teams(p_user_id, p_current_user_id, p_current_user_role)`
2. Funkcja RPC wykonuje:
   ```sql
   SELECT 
     prof.id,
     prof.first_name,
     prof.last_name,
     au.email,
     prof.role,
     prof.deleted_at,
     prof.created_at,
     prof.updated_at,
     COALESCE(
       json_agg(
         json_build_object('id', t.id, 'name', t.name)
         ORDER BY t.name
       ) FILTER (WHERE t.id IS NOT NULL),
       '[]'
     ) as teams
   FROM profiles prof
   LEFT JOIN auth.users au ON prof.id = au.id
   LEFT JOIN team_members tm ON prof.id = tm.user_id
   LEFT JOIN teams t ON tm.team_id = t.id
   WHERE prof.id = p_user_id
     AND (
       p_current_user_role = 'ADMINISTRATOR'
       OR (p_current_user_role = 'HR' AND prof.deleted_at IS NULL)
       OR (p_current_user_role = 'EMPLOYEE' AND prof.id = p_current_user_id AND prof.deleted_at IS NULL)
     )
   GROUP BY prof.id, au.email
   ```
3. Jeśli wynik pusty → 404 Not Found
4. Jeśli błąd SQL → logowanie i 500 Internal Server Error

### 5.4. Transformacja danych

1. Mapowanie wyniku SQL do DTO:
   - Snake_case → camelCase
   - Parsowanie JSON dla tablicy teams
   - Walidacja typów (role jako enum)
2. Utworzenie obiektu odpowiedzi `GetUserByIdResponseDTO`

### 5.5. Zwrot odpowiedzi

1. Serialization JSON
2. Ustawienie nagłówków: `Content-Type: application/json`
3. Zwrot odpowiedzi 200 OK

## 6. Względy bezpieczeństwa

### 6.1. Autoryzacja oparta na rolach (RBAC)

- **ADMINISTRATOR**: Pełny dostęp do wszystkich użytkowników (włącznie z soft-deleted)
- **HR**: Dostęp tylko do aktywnych użytkowników (deleted_at IS NULL)
- **EMPLOYEE**: Dostęp tylko do własnych danych

**Implementacja**: Logika autoryzacji jest w funkcji RPC (SECURITY DEFINER), co zapewnia, że sprawdzenia są egzekwowane na poziomie bazy danych.

### 6.2. Walidacja danych wejściowych

- **UUID**: Walidacja formatu UUID za pomocą Zod (`z.string().uuid()`)
- **SQL Injection**: Używanie parametryzowanych zapytań w RPC, brak bezpośredniego konkatenowania stringów
- **Path Traversal**: Walidacja UUID uniemożliwia injection typu `../`, `../../etc/passwd`

### 6.3. Ochrona danych osobowych

- **Email**: Pobierane z `auth.users` (zarządzane przez Supabase Auth) za pomocą funkcji SECURITY DEFINER
- **Soft-deleted users**: Niewidoczne dla użytkowników niebędących administratorami
- **PII Logging**: Unikanie logowania emaili i innych danych osobowych w logach (tylko ID użytkowników)

### 6.4. Rate Limiting (planowane)

- Obecnie brak implementacji
- **Rekomendacja**: Dodać middleware z rate limiting (np. 100 zapytań/minutę na użytkownika)
- Implementacja w `src/middleware/index.ts`

### 6.5. Audyt dostępu (planowane)

- Obecnie brak implementacji
- **Rekomendacja**: Logowanie dostępu do danych użytkowników (szczególnie przez administratorów) w tabeli `audit_logs`

## 7. Obsługa błędów

### 7.1. Błędy walidacji (400 Bad Request)

**Scenariusze**:
- Nieprawidłowy format UUID w parametrze `:id`
- Brak parametru `:id`

**Obsługa**:
```typescript
if (!validationResult.success) {
  return new Response(
    JSON.stringify({
      error: "Invalid user ID format",
      details: validationResult.error.flatten().fieldErrors,
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}
```

**Logowanie**: Brak (błędy walidacji są oczekiwane)

### 7.2. Błędy autoryzacji (401 Unauthorized)

**Scenariusze**:
- Brak tokenu autentykacji (planowane, obecnie nie implementowane)
- Nieprawidłowy lub wygasły token

**Obsługa**:
```typescript
if (!currentUserId) {
  return new Response(
    JSON.stringify({ error: "Authentication required" }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

**Logowanie**: Brak (normalne zachowanie dla nieautoryzowanych żądań)

**Uwaga**: Obecnie endpoint używa `DEFAULT_USER_ID`, więc 401 nie jest zwracane.

### 7.3. Błędy uprawnień (403 Forbidden)

**Scenariusze**:
- Pracownik próbuje pobrać dane innego użytkownika
- HR próbuje pobrać soft-deleted użytkownika
- Brak wymaganej roli

**Obsługa**:
```typescript
if (error.message.includes("Insufficient permissions")) {
  return new Response(
    JSON.stringify({ error: error.message }),
    { status: 403, headers: { "Content-Type": "application/json" } }
  );
}
```

**Logowanie**: Warning level z informacją o próbie nieautoryzowanego dostępu (userId, targetUserId, role)

### 7.4. Błędy nie znalezionego zasobu (404 Not Found)

**Scenariusze**:
- Użytkownik o podanym ID nie istnieje
- Użytkownik jest soft-deleted i current user nie ma uprawnień

**Obsługa**:
```typescript
if (!userData) {
  return new Response(
    JSON.stringify({ error: "User not found" }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}
```

**Logowanie**: Debug level (może być normalne zachowanie)

### 7.5. Błędy serwera (500 Internal Server Error)

**Scenariusze**:
- Błąd połączenia z bazą danych
- Błąd w funkcji RPC
- Nieoczekiwany błąd w kodzie aplikacji

**Obsługa**:
```typescript
catch (error) {
  console.error("[GET /api/users/:id] Error:", {
    timestamp: new Date().toISOString(),
    userId: id,
    currentUserId,
    error: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
  });
  
  return new Response(
    JSON.stringify({ error: "Internal server error" }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

**Logowanie**: Error level z pełnym stack trace

## 8. Rozważania dotyczące wydajności

### 8.1. Indeksy bazy danych

**Istniejące** (z migracji `20260103000000_add_users_list_indexes.sql`):
- `idx_profiles_role` na `profiles(role)`
- `idx_profiles_deleted_at` na `profiles(deleted_at)`
- `idx_team_members_user_id` na `team_members(user_id)`
- `idx_team_members_team_id` na `team_members(team_id)`

**Niezbędne dla tego endpointu**:
- ✅ Primary key na `profiles(id)` (już istnieje)
- ✅ Index na `team_members(user_id)` (już istnieje jako `idx_team_members_user_id`)

**Komentarz**: Istniejące indeksy są wystarczające. Query pobiera pojedynczy wiersz po PK (`profiles.id`) i wykonuje LEFT JOIN z `team_members` po indeksowanym `user_id`.

### 8.2. Optymalizacja zapytań SQL

**Strategia**:
1. **Single query**: Wszystkie dane pobierane w jednym zapytaniu RPC (unikanie N+1)
2. **JSON aggregation**: Użycie `json_agg()` do agregacji teams w pojedynczym wierszu
3. **LEFT JOIN**: Użytkownik bez zespołów zwraca pustą tablicę zamiast NULL
4. **FILTER clause**: `FILTER (WHERE t.id IS NOT NULL)` zapobiega dodawaniu NULL do tablicy teams

**Analiza EXPLAIN ANALYZE** (oczekiwana):
```
Index Scan using profiles_pkey on profiles (cost=0.28..8.30 rows=1) (actual time=0.05..0.05 rows=1)
  -> Nested Loop Left Join on team_members (cost=0.28..16.60 rows=5) (actual time=0.10..0.15 rows=2)
    -> Index Scan using idx_team_members_user_id on team_members (cost=0.28..8.30 rows=5)
    -> Index Scan using teams_pkey on teams (cost=0.28..1.65 rows=1)
```

**Złożoność**: O(1) dla pojedynczego użytkownika + O(k) dla k zespołów → bardzo szybkie

### 8.3. Caching (planowane)

**Obecnie**: Brak cachowania

**Rekomendacje**:
1. **Response caching**: Cache-Control header dla niezmiennych danych
   ```typescript
   headers: {
     "Content-Type": "application/json",
     "Cache-Control": "private, max-age=60" // 1 minuta
   }
   ```
2. **Application-level cache**: Redis/Memcached dla często pobieranych użytkowników (np. admini)
3. **Invalidation**: Cache invalidation przy UPDATE/DELETE użytkownika lub zmianach w team_members

### 8.4. Monitoring wydajności

**Implementacja**:
```typescript
const startTime = Date.now();
const result = await getUserById(locals.supabase, currentUserId, id);
const duration = Date.now() - startTime;

if (duration > 500) {
  console.warn("[GET /api/users/:id] Slow query detected:", {
    duration,
    userId: id,
    currentUserId,
  });
}
```

**Progi**:
- < 100ms: Bardzo dobra
- 100-500ms: Dobra
- 500-1000ms: Warning
- > 1000ms: Critical (wymaga optymalizacji)

**Oczekiwana wydajność**: 10-50ms dla typowych zapytań (1 użytkownik + 2-5 zespołów)

### 8.5. Connection pooling

**Supabase**: Automatyczne connection pooling (PgBouncer)

**Konfiguracja**: Brak dodatkowych działań wymaganych, Supabase zarządza poolem połączeń

## 9. Etapy wdrożenia

### Krok 1: Dodanie typów DTO do `src/types.ts`

**Plik**: `src/types.ts`

**Działanie**: Dodać nowe typy na końcu sekcji "Users List DTOs":

```typescript
/**
 * Team reference DTO
 * Simplified team information for user details
 */
export interface TeamReferenceDTO {
  id: string;
  name: string;
}

/**
 * User details DTO
 * Extended user information with team memberships
 * Connected to: Database['public']['Tables']['profiles']['Row']
 * Connected to: Database['public']['Tables']['teams']['Row'] (through team_members)
 */
export interface UserDetailsDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  teams: TeamReferenceDTO[];
}

/**
 * Get user by ID response DTO
 * Complete response with user details
 */
export interface GetUserByIdResponseDTO {
  data: UserDetailsDTO;
}
```

**Walidacja**: 
- Uruchomić `npm run build` aby sprawdzić czy TypeScript kompiluje się bez błędów
- Sprawdzić czy nie ma duplikatów nazw typów

### Krok 2: Utworzenie migracji SQL dla funkcji RPC

**Plik**: `supabase/migrations/20260104000000_add_get_user_by_id_rpc.sql`

**Działanie**: Utworzyć nową migrację z funkcją RPC:

```sql
-- =====================================================
-- Migration: Add RPC function to get user by ID with teams
-- Description: Creates a secure function to fetch a single user with their teams
-- Date: 2026-01-04
-- =====================================================

-- Function to get user by ID with teams
-- This function safely joins profiles with auth.users and teams
-- Includes RBAC checks: ADMINISTRATOR (all users), HR (active only), EMPLOYEE (self only)
create or replace function get_user_by_id_with_teams(
  p_user_id uuid,
  p_current_user_id uuid,
  p_current_user_role user_role
)
returns table (
  id uuid,
  first_name text,
  last_name text,
  email text,
  role user_role,
  deleted_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  teams jsonb
)
security definer
set search_path = public
language plpgsql
as $$
begin
  return query
  select
    prof.id,
    prof.first_name,
    prof.last_name,
    coalesce(au.email::text, '') as email,
    prof.role,
    prof.deleted_at,
    prof.created_at,
    prof.updated_at,
    coalesce(
      jsonb_agg(
        jsonb_build_object('id', t.id, 'name', t.name)
        order by t.name
      ) filter (where t.id is not null),
      '[]'::jsonb
    ) as teams
  from profiles prof
  left join auth.users au on prof.id = au.id
  left join team_members tm on prof.id = tm.user_id
  left join teams t on tm.team_id = t.id
  where prof.id = p_user_id
    and (
      -- ADMINISTRATOR can view all users
      p_current_user_role = 'ADMINISTRATOR'
      -- HR can view active users only
      or (p_current_user_role = 'HR' and prof.deleted_at is null)
      -- EMPLOYEE can view only themselves (active only)
      or (p_current_user_role = 'EMPLOYEE' and prof.id = p_current_user_id and prof.deleted_at is null)
    )
  group by prof.id, au.email;
end;
$$;

-- Add comment
comment on function get_user_by_id_with_teams is 'Fetches a single user with their teams, includes RBAC checks';

-- Grant execute permission to authenticated users
grant execute on function get_user_by_id_with_teams to authenticated;
```

**Walidacja**:
- Uruchomić migrację: `npx supabase migration up` (lokalnie) lub deploy (produkcja)
- Przetestować funkcję bezpośrednio w Supabase SQL Editor:
  ```sql
  SELECT * FROM get_user_by_id_with_teams(
    '<valid-user-uuid>'::uuid,
    '<admin-user-uuid>'::uuid,
    'ADMINISTRATOR'::user_role
  );
  ```

### Krok 3: Dodanie funkcji service `getUserById`

**Plik**: `src/lib/services/users.service.ts`

**Działanie**: Dodać nową funkcję na końcu pliku:

```typescript
/**
 * Get single user by ID with team memberships
 *
 * @param supabase - Supabase client from context.locals
 * @param currentUserId - ID of the current user (for RBAC)
 * @param currentUserRole - Role of the current user (for RBAC)
 * @param userId - ID of the user to retrieve
 * @returns Promise with user details including teams
 * @throws Error if user not found or insufficient permissions
 */
export async function getUserById(
  supabase: SupabaseClient,
  currentUserId: string,
  currentUserRole: "ADMINISTRATOR" | "HR" | "EMPLOYEE",
  userId: string
): Promise<UserDetailsDTO> {
  // Call RPC function to get user with teams
  const { data, error } = await supabase.rpc("get_user_by_id_with_teams", {
    p_user_id: userId,
    p_current_user_id: currentUserId,
    p_current_user_role: currentUserRole,
  });

  if (error) {
    console.error("[UsersService] Failed to fetch user:", error);
    throw new Error("Failed to fetch user");
  }

  // Check if user was found (RPC returns empty array if no access or user doesn't exist)
  if (!data || data.length === 0) {
    throw new Error("User not found");
  }

  const user = data[0];

  // Map result to DTO (snake_case to camelCase)
  const userDetails: UserDetailsDTO = {
    id: user.id,
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
    email: user.email ?? "",
    role: (user.role ?? "EMPLOYEE") as "ADMINISTRATOR" | "HR" | "EMPLOYEE",
    deletedAt: user.deleted_at ?? null,
    createdAt: user.created_at ?? new Date().toISOString(),
    updatedAt: user.updated_at ?? new Date().toISOString(),
    teams: (user.teams as TeamReferenceDTO[]) ?? [],
  };

  return userDetails;
}
```

**Walidacja**:
- Import nowych typów na początku pliku:
  ```typescript
  import type { 
    GetUsersQueryDTO, 
    GetUsersResponseDTO, 
    UserListItemDTO,
    UserDetailsDTO,
    TeamReferenceDTO 
  } from "@/types";
  ```
- Uruchomić `npm run build` i sprawdzić błędy TypeScript

### Krok 4: Utworzenie endpointu API

**Plik**: `src/pages/api/users/[id].ts`

**Działanie**: Utworzyć nowy plik z handlerem GET:

```typescript
/**
 * GET /api/users/:id
 * Endpoint for retrieving a single user with their team memberships
 *
 * Authorization: Using DEFAULT_USER_ID for development
 * - ADMINISTRATOR: Can view all users including soft-deleted
 * - HR: Can view active users only
 * - EMPLOYEE: Can view only themselves (active only)
 *
 * NOTE: Full authentication will be implemented later
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { getUserById } from "@/lib/services/users.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

// Disable prerendering for this API route
export const prerender = false;

/**
 * Zod schema for validating path parameter
 */
const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});

/**
 * GET handler for /api/users/:id
 * Retrieves a single user with their teams
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate path parameter
    const validationResult = userIdParamSchema.safeParse(params);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid user ID format",
          details: validationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { id: userId } = validationResult.data;

    // 2. Use DEFAULT_USER_ID for development (auth will be implemented later)
    const currentUserId = DEFAULT_USER_ID;

    // 3. Get current user's role for RBAC
    const { data: currentUserProfile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single();

    if (profileError || !currentUserProfile) {
      console.error("[GET /api/users/:id] Failed to fetch current user profile:", profileError);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentUserRole = currentUserProfile.role as "ADMINISTRATOR" | "HR" | "EMPLOYEE";

    // 4. Call service to get user
    const startTime = Date.now();
    const userDetails = await getUserById(locals.supabase, currentUserId, currentUserRole, userId);
    const duration = Date.now() - startTime;

    // Log slow queries
    if (duration > 500) {
      console.warn("[GET /api/users/:id] Slow query detected:", {
        duration,
        userId,
        currentUserId,
        currentUserRole,
      });
    }

    // 5. Return successful response
    return new Response(JSON.stringify({ data: userDetails }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/users/:id] Error:", {
      timestamp: new Date().toISOString(),
      userId: params.id,
      currentUserId: DEFAULT_USER_ID,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle known error types
    if (error instanceof Error) {
      // Not found errors (404) - includes permission denials
      if (error.message.includes("User not found") || error.message.includes("not found")) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Authorization errors (403 Forbidden)
      if (error.message.includes("Insufficient permissions") || error.message.includes("permissions")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Generic internal server error (500)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

**Walidacja**:
- Sprawdzić czy plik został utworzony w prawidłowej lokalizacji: `src/pages/api/users/[id].ts`
- Uruchomić `npm run build` i sprawdzić błędy
- Uruchomić `npm run dev` i sprawdzić czy endpoint jest dostępny

### Krok 5: Testowanie manualne

**Narzędzia**: curl, Postman, lub Thunder Client (VS Code extension)

**Test 1: Pobieranie istniejącego użytkownika**
```bash
curl -X GET "http://localhost:4321/api/users/<valid-uuid>" \
  -H "Content-Type: application/json"
```
**Oczekiwany wynik**: 200 OK z danymi użytkownika i listą zespołów

**Test 2: Nieprawidłowy UUID**
```bash
curl -X GET "http://localhost:4321/api/users/invalid-uuid" \
  -H "Content-Type: application/json"
```
**Oczekiwany wynik**: 400 Bad Request z komunikatem walidacji

**Test 3: Nieistniejący użytkownik**
```bash
curl -X GET "http://localhost:4321/api/users/00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json"
```
**Oczekiwany wynik**: 404 Not Found

**Test 4: Użytkownik bez zespołów**
- Utworzyć użytkownika bez przypisania do team_members
- Wywołać endpoint
**Oczekiwany wynik**: 200 OK z pustą tablicą teams: []

**Test 5: Użytkownik z wieloma zespołami**
- Przypisać użytkownika do 3+ zespołów
- Wywołać endpoint
**Oczekiwany wynik**: 200 OK z posortowaną (alfabetycznie) tablicą teams

**Test 6: Soft-deleted użytkownik (jako ADMINISTRATOR)**
- Ustawić `deleted_at` na current timestamp dla użytkownika
- Wywołać endpoint z DEFAULT_USER_ID jako ADMINISTRATOR
**Oczekiwany wynik**: 200 OK z `deletedAt` zawierającym timestamp

**Test 7: Soft-deleted użytkownik (jako HR)**
- Zmienić rolę DEFAULT_USER_ID na HR
- Wywołać endpoint dla soft-deleted użytkownika
**Oczekiwany wynik**: 404 Not Found

**Test 8: Pobieranie danych innego użytkownika (jako EMPLOYEE)**
- Zmienić rolę DEFAULT_USER_ID na EMPLOYEE
- Wywołać endpoint z UUID innego użytkownika
**Oczekiwany wynik**: 404 Not Found (z przyczyn bezpieczeństwa zwracamy 404 zamiast 403)

### Krok 6: Testowanie wydajności

**Narzędzie**: Apache Bench (ab) lub wrk

**Test obciążeniowy**:
```bash
# 1000 zapytań, 10 współbieżnych połączeń
ab -n 1000 -c 10 "http://localhost:4321/api/users/<valid-uuid>"
```

**Oczekiwane metryki**:
- **Średni czas odpowiedzi**: < 100ms
- **99th percentile**: < 500ms
- **Błędy**: 0%

**Analiza**:
- Sprawdzić logi pod kątem "Slow query detected"
- Jeśli > 500ms, uruchomić EXPLAIN ANALYZE na funkcji RPC i sprawdzić plany wykonania

### Krok 7: Aktualizacja dokumentacji

**Plik**: `README.md` (sekcja API Endpoints)

**Działanie**: Dodać dokumentację endpointu:

```markdown
### GET /api/users/:id

Retrieves a single user with their team memberships.

**Authorization**: ADMINISTRATOR (all users), HR (active only), EMPLOYEE (self only)

**Parameters**:
- `id` (path, required): User UUID

**Response 200 OK**:
```json
{
  "data": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "EMPLOYEE",
    "deletedAt": null,
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
    "teams": [
      { "id": "uuid", "name": "Engineering" }
    ]
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Not authenticated (future)
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found or no access
- `500 Internal Server Error`: Server error
```

### Krok 8: Code Review Checklist

**Przed mergem do main**:

- [ ] TypeScript kompiluje się bez błędów (`npm run build`)
- [ ] Linter nie zgłasza błędów (`npm run lint`)
- [ ] Wszystkie typy są poprawnie zdefiniowane w `src/types.ts`
- [ ] Funkcja RPC jest utworzona i działa poprawnie
- [ ] Funkcja service `getUserById` jest poprawnie zaimplementowana
- [ ] Endpoint API `/api/users/[id].ts` jest utworzony i działa
- [ ] Wszystkie 8 testów manualnych przechodzą pomyślnie
- [ ] Test wydajności pokazuje czas odpowiedzi < 100ms (średnio)
- [ ] Dokumentacja w README.md jest zaktualizowana
- [ ] Kod jest zgodny z zasadami projektu (coding instructions)
- [ ] Brak duplikacji kodu (DRY principle)
- [ ] Obsługa błędów jest kompletna i logiczna
- [ ] Logi zawierają odpowiednie informacje (bez PII)
- [ ] Komentarze JSDoc są aktualne i kompletne

### Krok 9: Deployment

**Środowisko lokalne**:
1. Zastosować migrację: `npx supabase migration up`
2. Uruchomić aplikację: `npm run dev`
3. Przetestować endpoint lokalnie

**Środowisko staging/produkcja**:
1. Zmergować PR do branch głównego
2. CI/CD automatycznie uruchomi deployment
3. Migracja SQL zostanie zastosowana automatycznie
4. Zweryfikować endpoint na środowisku docelowym

---

## Podsumowanie

Ten plan opisuje kompletną implementację endpointu GET /api/users/:id zgodnie z architekturą projektu, wykorzystując istniejące wzorce (endpoint GET /api/users) i rozszerzając je o pobieranie pojedynczego użytkownika z zespołami.

**Kluczowe punkty**:
- ✅ RBAC na poziomie bazy danych (funkcja RPC z SECURITY DEFINER)
- ✅ Walidacja danych wejściowych (Zod)
- ✅ Wydajna agregacja zespołów (json_agg w SQL)
- ✅ Poprawna obsługa błędów (400, 401, 403, 404, 500)
- ✅ Monitoring wydajności (logowanie slow queries)
- ✅ Zgodność z zasadami projektu (Astro, TypeScript, Supabase)

**Czas implementacji** (oszacowanie): 2-3 godziny (+ 1 godzina na testy)

