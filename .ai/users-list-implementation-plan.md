# API Endpoint Implementation Plan: GET /api/users

## 1. Przegląd punktu końcowego

Endpoint `GET /api/users` służy do pobierania listy użytkowników systemu z uwzględnieniem autoryzacji opartej na rolach. Administratorzy mogą przeglądać wszystkich użytkowników, w tym soft-deleted, podczas gdy użytkownicy HR i EMPLOYEE widzą tylko aktywne konta. Endpoint obsługuje paginację, filtrowanie według roli i przynależności do zespołu.

**Cel:**
- Dostarczenie listy użytkowników z metadanymi paginacji
- Kontrola dostępu oparta na rolach (RBAC)
- Elastyczne filtrowanie i paginacja wyników

## 2. Szczegóły żądania

### Metoda HTTP
`GET`

### Struktura URL
```
/api/users
```

### Query Parameters

#### Wymagane
Brak - wszystkie parametry są opcjonalne z wartościami domyślnymi.

#### Opcjonalne

| Parametr | Typ | Domyślna wartość | Walidacja | Opis |
|----------|-----|------------------|-----------|------|
| `limit` | number | 50 | min: 1, max: 100 | Liczba wyników na stronę |
| `offset` | number | 0 | min: 0 | Przesunięcie paginacji (indeks startowy) |
| `role` | string | - | enum: 'ADMINISTRATOR', 'HR', 'EMPLOYEE' | Filtrowanie według roli użytkownika |
| `includeDeleted` | boolean | false | boolean | Czy uwzględnić soft-deleted użytkowników (tylko dla ADMINISTRATOR) |
| `teamId` | string | - | UUID format | Filtrowanie według przynależności do zespołu |

### Request Headers
```
Authorization: Bearer <access_token>
```

### Przykład żądania
```
GET /api/users?limit=20&offset=0&role=EMPLOYEE&teamId=123e4567-e89b-12d3-a456-426614174000
```

## 3. Wykorzystywane typy

### Typy do utworzenia w `src/types.ts`

#### Query DTO
```typescript
/**
 * Get users query parameters DTO
 * Used for filtering and paginating user lists
 */
export interface GetUsersQueryDTO {
  limit?: number;
  offset?: number;
  role?: 'ADMINISTRATOR' | 'HR' | 'EMPLOYEE';
  includeDeleted?: boolean;
  teamId?: string;
}
```

#### Response DTOs
```typescript
/**
 * User list item DTO
 * Derived from profiles table, represents a single user in the list
 * Connected to: Database['public']['Tables']['profiles']['Row']
 */
export interface UserListItemDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMINISTRATOR' | 'HR' | 'EMPLOYEE';
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pagination metadata for users list
 */
export interface UsersPaginationDTO {
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get users response DTO
 * Complete response with data and pagination
 */
export interface GetUsersResponseDTO {
  data: UserListItemDTO[];
  pagination: UsersPaginationDTO;
}
```

### Schemat walidacji Zod

Utworzyć w `src/pages/api/users/index.ts`:

```typescript
import { z } from 'zod';

const getUsersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  role: z.enum(['ADMINISTRATOR', 'HR', 'EMPLOYEE']).optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
  teamId: z.string().uuid().optional(),
});
```

## 4. Szczegóły odpowiedzi

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "EMPLOYEE",
      "deletedAt": null,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "role": "HR",
      "deletedAt": null,
      "createdAt": "2026-01-02T00:00:00Z",
      "updatedAt": "2026-01-02T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

### Error Responses

#### 400 Bad Request - Nieprawidłowe parametry
```json
{
  "error": "Invalid query parameters",
  "details": {
    "limit": "Must be between 1 and 100",
    "teamId": "Invalid UUID format"
  }
}
```

#### 401 Unauthorized - Brak autoryzacji
```json
{
  "error": "Unauthorized - authentication required"
}
```

#### 403 Forbidden - Niewystarczające uprawnienia
```json
{
  "error": "Forbidden - only administrators can view deleted users"
}
```

#### 500 Internal Server Error - Błąd serwera
```json
{
  "error": "Internal server error"
}
```

## 5. Przepływ danych

### Diagram przepływu

```
1. Client → GET /api/users?limit=20&role=EMPLOYEE
                    ↓
2. Astro Middleware (src/middleware/index.ts)
   - Sprawdzenie sesji użytkownika
   - Wstrzyknięcie supabase client do context.locals
                    ↓
3. API Route Handler (src/pages/api/users/index.ts)
   - Walidacja query parameters (Zod)
   - Pobranie aktualnego użytkownika z sesji
                    ↓
4. Users Service (src/lib/services/users.service.ts)
   - Sprawdzenie roli użytkownika
   - Walidacja uprawnień (includeDeleted tylko dla ADMIN)
   - Budowanie zapytania Supabase
                    ↓
5. Supabase Query
   - SELECT z tabeli profiles
   - LEFT JOIN z auth.users dla email
   - Opcjonalny INNER JOIN z team_members (jeśli teamId)
   - WHERE clauses dla filtrów
   - ORDER BY i LIMIT/OFFSET dla paginacji
   - COUNT(*) OVER() dla total
                    ↓
6. Data Mapping
   - Mapowanie snake_case na camelCase
   - Formatowanie dat ISO 8601
                    ↓
7. Response
   - Zwrócenie JSON z data i pagination
```

### Interakcje z bazą danych

#### Główne zapytanie (bez teamId)
```sql
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  au.email,
  p.role,
  p.deleted_at,
  p.created_at,
  p.updated_at,
  COUNT(*) OVER() as total_count
FROM profiles p
INNER JOIN auth.users au ON p.id = au.id
WHERE 1=1
  -- Filtr deleted_at (dla nie-adminów)
  AND (p.deleted_at IS NULL OR $includeDeleted = true)
  -- Filtr role (opcjonalny)
  AND ($role IS NULL OR p.role = $role)
ORDER BY p.created_at DESC
LIMIT $limit OFFSET $offset;
```

#### Zapytanie z filtrem teamId
```sql
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  au.email,
  p.role,
  p.deleted_at,
  p.created_at,
  p.updated_at,
  COUNT(*) OVER() as total_count
FROM profiles p
INNER JOIN auth.users au ON p.id = au.id
INNER JOIN team_members tm ON p.id = tm.user_id
WHERE tm.team_id = $teamId
  AND (p.deleted_at IS NULL OR $includeDeleted = true)
  AND ($role IS NULL OR p.role = $role)
ORDER BY p.created_at DESC
LIMIT $limit OFFSET $offset;
```

## 6. Względy bezpieczeństwa

### Uwierzytelnianie
- **Middleware sprawdza sesję** przed dotarciem do endpointa
- Brak sesji → 401 Unauthorized
- Wykorzystanie `context.locals.supabase` zamiast bezpośredniego importu klienta

### Autoryzacja oparta na rolach (RBAC)

| Rola | Uprawnienia |
|------|-------------|
| ADMINISTRATOR | Widzi wszystkich użytkowników, może ustawić `includeDeleted=true` |
| HR | Widzi tylko aktywnych użytkowników (deleted_at IS NULL) |
| EMPLOYEE | Widzi tylko aktywnych użytkowników (deleted_at IS NULL) |

### Walidacja danych wejściowych
1. **Zod schema** waliduje wszystkie query parameters
2. **UUID validation** dla teamId
3. **Range validation** dla limit (1-100) i offset (≥0)
4. **Enum validation** dla role

### Ochrona przed atakami

#### SQL Injection
- Użycie parametryzowanych zapytań Supabase
- Walidacja UUID przed użyciem w zapytaniu

#### Information Disclosure
- Nie zwracamy wrażliwych danych (hashe haseł)
- Email pobierany z auth.users (dostępny tylko dla zalogowanych)
- Soft-deleted użytkownicy widoczni tylko dla adminów

#### Rate Limiting
- Rozważyć implementację w middleware (future enhancement)
- Limit max 100 wyników na stronę zapobiega przeciążeniu

#### Authorization Bypass
```typescript
// Sprawdzenie w service
if (includeDeleted && currentUser.role !== 'ADMINISTRATOR') {
  throw new Error('Only administrators can view deleted users');
}
```

### Row Level Security (RLS)
- Można rozważyć implementację RLS policies w Supabase
- Obecnie logika autoryzacji w application layer (service)

## 7. Obsługa błędów

### Katalog błędów

| Kod | Scenariusz | Przyczyna | Obsługa |
|-----|-----------|-----------|---------|
| 400 | Bad Request | Nieprawidłowe query parameters (np. limit > 100, zły UUID) | Walidacja Zod, zwrócenie szczegółów błędów |
| 401 | Unauthorized | Brak sesji/tokenu | Middleware sprawdza sesję, zwraca 401 |
| 403 | Forbidden | Użytkownik nie-admin próbuje ustawić includeDeleted=true | Service sprawdza rolę, rzuca błąd |
| 403 | Forbidden | Brak dostępu do zasobu | Service sprawdza uprawnienia |
| 404 | Not Found | Zespół (teamId) nie istnieje | Service sprawdza istnienie zespołu przed zapytaniem |
| 500 | Internal Server Error | Błąd bazy danych, nieoczekiwany błąd | Try-catch w route, logowanie błędu, generyczna wiadomość |

### Implementacja obsługi błędów

```typescript
// W API Route Handler
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Walidacja query params
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    
    const validatedParams = getUsersQuerySchema.safeParse(queryParams);
    if (!validatedParams.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid query parameters',
          details: validatedParams.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Sprawdzenie sesji
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Wywołanie service
    const result = await usersService.getUsers(locals.supabase, user.id, validatedParams.data);

    // 4. Zwrócenie wyniku
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[GET /api/users] Error:', error);

    // Obsługa znanych błędów
    if (error instanceof Error) {
      if (error.message.includes('Only administrators')) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (error.message.includes('Team not found')) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generyczny błąd serwera
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### Logowanie błędów

```typescript
// Struktura logowania
console.error('[GET /api/users] Error:', {
  timestamp: new Date().toISOString(),
  userId: user?.id,
  queryParams: validatedParams.data,
  error: error.message,
  stack: error.stack,
});
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Duża liczba użytkowników**
   - Problem: Skanowanie całej tabeli profiles
   - Rozwiązanie: Indeksy na kolumnach używanych w WHERE i ORDER BY

2. **JOIN z auth.users**
   - Problem: Może spowolnić zapytanie przy dużej liczbie użytkowników
   - Rozwiązanie: Rozważyć denormalizację (przechowywanie email w profiles)

3. **COUNT(*) OVER()**
   - Problem: Może być kosztowne przy milionach rekordów
   - Rozwiązanie: Cache'owanie total count lub przybliżona wartość

4. **Filtrowanie według teamId**
   - Problem: Dodatkowy JOIN z team_members
   - Rozwiązanie: Indeks na (team_id, user_id) w team_members

### Indeksy bazodanowe

```sql
-- Indeksy do utworzenia dla optymalizacji
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_members_team_user ON team_members(team_id, user_id);
```

### Cache'owanie

**Strategia cache'owania (future enhancement):**
- Cache total count na 5 minut (zmienia się rzadko)
- Cache listy użytkowników na 1 minutę dla popularnych filtrów
- Invalidacja cache po utworzeniu/aktualizacji użytkownika

```typescript
// Przykład cache'owania (do rozważenia w przyszłości)
const cacheKey = `users:${JSON.stringify(queryParams)}`;
const cachedResult = await redis.get(cacheKey);
if (cachedResult) {
  return JSON.parse(cachedResult);
}
// ... fetch from database ...
await redis.setex(cacheKey, 60, JSON.stringify(result));
```

### Optymalizacja zapytań

1. **Selectywne pobieranie kolumn** - tylko potrzebne pola
2. **LIMIT/OFFSET zamiast ładowania wszystkiego**
3. **COUNT(*) OVER() zamiast osobnego zapytania COUNT**

### Monitorowanie wydajności

```typescript
// Logowanie czasu wykonania
const startTime = Date.now();
const result = await usersService.getUsers(/* ... */);
const duration = Date.now() - startTime;

if (duration > 1000) { // > 1 sekunda
  console.warn('[GET /api/users] Slow query:', {
    duration,
    queryParams: validatedParams.data,
  });
}
```

## 9. Kroki implementacji

### Krok 1: Przygotowanie typów
**Plik:** `src/types.ts`

1. Dodać nowe typy DTO:
   - `GetUsersQueryDTO`
   - `UserListItemDTO`
   - `UsersPaginationDTO`
   - `GetUsersResponseDTO`

**Szacowany czas:** 15 minut

### Krok 2: Utworzenie serwisu użytkowników
**Plik:** `src/lib/services/users.service.ts` (nowy plik)

1. Utworzyć strukturę serwisu z funkcją `getUsers()`
2. Zaimplementować logikę autoryzacji:
   - Pobranie profilu aktualnego użytkownika
   - Sprawdzenie uprawnień dla `includeDeleted`
3. Zaimplementować walidację teamId (jeśli podany):
   - Sprawdzenie czy zespół istnieje
4. Zbudować zapytanie Supabase:
   - Base query na profiles
   - JOIN z auth.users dla email
   - Opcjonalny JOIN z team_members
   - WHERE clauses dla filtrów
   - ORDER BY created_at DESC
   - LIMIT i OFFSET
   - COUNT(*) OVER() dla total
5. Wykonać zapytanie i obsłużyć błędy
6. Zmapować wyniki z snake_case na camelCase
7. Zwrócić sformatowaną odpowiedź

**Struktura funkcji:**
```typescript
export async function getUsers(
  supabase: SupabaseClient,
  currentUserId: string,
  query: GetUsersQueryDTO
): Promise<GetUsersResponseDTO>
```

**Szacowany czas:** 60-90 minut

### Krok 3: Utworzenie endpointa API
**Plik:** `src/pages/api/users/index.ts` (nowy plik)

1. Dodać `export const prerender = false`
2. Zaimportować zależności (zod, types, service)
3. Utworzyć schemat walidacji Zod
4. Zaimplementować handler GET:
   - Parsowanie query parameters z URL
   - Walidacja za pomocą Zod
   - Sprawdzenie sesji użytkownika
   - Wywołanie usersService.getUsers()
   - Zwrócenie odpowiedzi JSON
5. Zaimplementować try-catch z obsługą błędów:
   - 400 dla błędów walidacji
   - 401 dla braku sesji
   - 403 dla błędów autoryzacji
   - 404 dla nieznalezionego zespołu
   - 500 dla nieoczekiwanych błędów
6. Dodać logowanie błędów

**Szacowany czas:** 45-60 minut

### Krok 4: Testowanie manualne
**Narzędzia:** Postman, curl, lub browser

1. Test podstawowy - pobieranie listy użytkowników:
   ```bash
   GET /api/users
   ```

2. Test paginacji:
   ```bash
   GET /api/users?limit=10&offset=10
   ```

3. Test filtrowania po roli:
   ```bash
   GET /api/users?role=EMPLOYEE
   ```

4. Test includeDeleted (jako admin):
   ```bash
   GET /api/users?includeDeleted=true
   ```

5. Test includeDeleted (jako nie-admin) - powinno zwrócić 403:
   ```bash
   GET /api/users?includeDeleted=true
   ```

6. Test filtrowania po teamId:
   ```bash
   GET /api/users?teamId=<valid-uuid>
   ```

7. Test walidacji - nieprawidłowy limit:
   ```bash
   GET /api/users?limit=999
   ```

8. Test walidacji - nieprawidłowy UUID:
   ```bash
   GET /api/users?teamId=invalid-uuid
   ```

9. Test bez autoryzacji - powinno zwrócić 401:
   ```bash
   GET /api/users (bez tokenu)
   ```

**Szacowany czas:** 30-45 minut

### Krok 5: Optymalizacja bazy danych
**Narzędzie:** Supabase Dashboard lub migracje

1. Utworzyć plik migracji: `supabase/migrations/YYYYMMDDHHMMSS_add_users_indexes.sql`
2. Dodać indeksy:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
   CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);
   CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
   CREATE INDEX IF NOT EXISTS idx_team_members_team_user ON team_members(team_id, user_id);
   ```
3. Wykonać migrację
4. Zweryfikować plan wykonania zapytania (EXPLAIN ANALYZE)

**Szacowany czas:** 15-30 minut

### Krok 6: Dokumentacja
**Plik:** `README.md` lub osobny plik dokumentacji API

1. Dodać dokumentację endpointa:
   - Opis funkcjonalności
   - Przykłady żądań
   - Przykłady odpowiedzi
   - Lista błędów
2. Zaktualizować dokumentację architektury (jeśli istnieje)

**Szacowany czas:** 20-30 minut

### Krok 7: Code review i refaktoryzacja
1. Przegląd kodu pod kątem:
   - Zgodności z zasadami projektu
   - Bezpieczeństwa
   - Wydajności
   - Czytelności
2. Refaktoryzacja na podstawie uwag
3. Sprawdzenie feedbacku z lintera (ESLint)

**Szacowany czas:** 30-45 minut

---

## 10. Podsumowanie

### Pliki do utworzenia:
1. `src/lib/services/users.service.ts` - serwis logiki biznesowej
2. `src/pages/api/users/index.ts` - endpoint API
3. `supabase/migrations/YYYYMMDDHHMMSS_add_users_indexes.sql` - indeksy

### Pliki do modyfikacji:
1. `src/types.ts` - dodanie nowych typów DTO

### Całkowity szacowany czas implementacji:
**3.5 - 5 godzin** (włącznie z testowaniem i dokumentacją)

### Priorytety:
1. **Krytyczne:** Kroki 1-3 (typy, service, endpoint)
2. **Wysokie:** Krok 4 (testowanie)
3. **Średnie:** Krok 5 (optymalizacja)
4. **Niskie:** Kroki 6-7 (dokumentacja, review)

### Zależności:
- Middleware musi być skonfigurowany do wstrzykiwania Supabase client
- Tabele profiles, auth.users, teams i team_members muszą istnieć w bazie
- Użytkownicy muszą mieć możliwość zalogowania się (auth endpoint)

### Kolejne kroki (future enhancements):
1. Implementacja sortowania (sort_by, sort_order)
2. Implementacja wyszukiwania po imieniu/nazwisku/emailu
3. Cache'owanie wyników
4. Rate limiting
5. Testy jednostkowe i integracyjne
6. Row Level Security policies w Supabase

