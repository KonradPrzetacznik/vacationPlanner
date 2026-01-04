# API Endpoint: GET /api/users

## Opis

Endpoint do pobierania listy użytkowników systemu z możliwością filtrowania, paginacji i uwzględnienia soft-deleted użytkowników.

## Autoryzacja

Wymaga zalogowanego użytkownika (token JWT w cookies/headers).

### Uprawnienia według ról:

- **ADMINISTRATOR**: Może przeglądać wszystkich użytkowników, w tym soft-deleted (gdy `includeDeleted=true`)
- **HR**: Może przeglądać tylko aktywnych użytkowników
- **EMPLOYEE**: Może przeglądać tylko aktywnych użytkowników

## Request

### Metoda HTTP
```
GET /api/users
```

### Query Parameters

| Parametr | Typ | Wymagany | Domyślna wartość | Opis |
|----------|-----|----------|------------------|------|
| `limit` | number | Nie | 50 | Liczba wyników na stronę (1-100) |
| `offset` | number | Nie | 0 | Przesunięcie paginacji (indeks startowy) |
| `role` | string | Nie | - | Filtrowanie według roli: `ADMINISTRATOR`, `HR`, `EMPLOYEE` |
| `includeDeleted` | boolean | Nie | false | Czy uwzględnić soft-deleted użytkowników (tylko ADMINISTRATOR) |
| `teamId` | string | Nie | - | UUID zespołu do filtrowania |

### Przykłady żądań

```bash
# Podstawowe pobranie listy użytkowników
GET /api/users

# Z paginacją
GET /api/users?limit=20&offset=40

# Filtrowanie według roli
GET /api/users?role=EMPLOYEE

# Filtrowanie według zespołu
GET /api/users?teamId=550e8400-e29b-41d4-a716-446655440000

# Uwzględnienie soft-deleted (tylko dla administratorów)
GET /api/users?includeDeleted=true

# Kombinacja filtrów
GET /api/users?limit=10&role=HR&teamId=550e8400-e29b-41d4-a716-446655440000
```

## Response

### Success (200 OK)

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

### Errors

#### 400 Bad Request - Nieprawidłowe parametry
```json
{
  "error": "Invalid query parameters",
  "details": {
    "limit": ["Number must be less than or equal to 100"],
    "teamId": ["Invalid uuid"]
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
  "error": "Only administrators can view deleted users"
}
```

#### 404 Not Found - Zespół nie istnieje
```json
{
  "error": "Team not found"
}
```

#### 500 Internal Server Error - Błąd serwera
```json
{
  "error": "Internal server error"
}
```

## Implementacja

### Pliki

1. **Endpoint**: `src/pages/api/users/index.ts`
2. **Serwis**: `src/lib/services/users.service.ts`
3. **Typy**: `src/types.ts`
4. **Migracje**:
   - `supabase/migrations/20260103000000_add_users_list_indexes.sql` - indeksy
   - `supabase/migrations/20260103000001_add_get_users_rpc.sql` - funkcja RPC

### Wykorzystywane typy

- `GetUsersQueryDTO` - parametry zapytania
- `UserListItemDTO` - pojedynczy użytkownik w liście
- `UsersPaginationDTO` - metadane paginacji
- `GetUsersResponseDTO` - pełna odpowiedź

### Funkcja RPC

Endpoint używa funkcji PostgreSQL `get_users_with_emails()`, która:
- Bezpiecznie łączy tabelę `profiles` z `auth.users`
- Wykonuje filtrowanie po stronie bazy danych
- Zwraca użytkowników z emailami i metadane paginacji
- Obsługuje wszystkie filtry (role, teamId, includeDeleted)

### Optymalizacje

1. **Indeksy bazodanowe**:
   - `idx_profiles_created_at` - dla sortowania
   - `idx_team_members_team_user` - dla filtrowania po zespole
   - `idx_profiles_role` - dla filtrowania po roli
   - `idx_profiles_deleted_at` - dla filtrowania soft-deleted

2. **Single query**: Wszystkie dane pobierane w jednym zapytaniu RPC
3. **Lazy evaluation**: Walidacja zespołu tylko gdy `teamId` jest podany
4. **Monitoring**: Logowanie wolnych zapytań (> 1s)

## Testowanie

### Testy manualne

```bash
# 1. Test podstawowy
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Test paginacji
curl -X GET "http://localhost:3000/api/users?limit=10&offset=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Test filtrowania po roli
curl -X GET "http://localhost:3000/api/users?role=EMPLOYEE" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Test filtrowania po zespole
curl -X GET "http://localhost:3000/api/users?teamId=TEAM_UUID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Test includeDeleted (jako admin)
curl -X GET "http://localhost:3000/api/users?includeDeleted=true" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 6. Test walidacji - nieprawidłowy limit
curl -X GET "http://localhost:3000/api/users?limit=999" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 7. Test bez autoryzacji (powinno zwrócić 401)
curl -X GET http://localhost:3000/api/users
```

### Scenariusze testowe

| # | Scenariusz | Oczekiwany wynik |
|---|------------|------------------|
| 1 | GET /api/users bez parametrów | 200, pierwszych 50 użytkowników |
| 2 | GET /api/users?limit=10 | 200, pierwszych 10 użytkowników |
| 3 | GET /api/users?role=HR | 200, tylko użytkownicy z rolą HR |
| 4 | GET /api/users?teamId={valid-uuid} | 200, tylko członkowie zespołu |
| 5 | GET /api/users?includeDeleted=true (jako admin) | 200, wszyscy użytkownicy |
| 6 | GET /api/users?includeDeleted=true (jako HR) | 403, brak uprawnień |
| 7 | GET /api/users?limit=999 | 400, walidacja limit max 100 |
| 8 | GET /api/users?teamId=invalid | 400, nieprawidłowy UUID |
| 9 | GET /api/users (bez tokenu) | 401, brak autoryzacji |
| 10 | GET /api/users?teamId={non-existent-uuid} | 404, zespół nie istnieje |

## Bezpieczeństwo

1. **Autoryzacja**: Sprawdzenie sesji użytkownika przed wykonaniem zapytania
2. **RBAC**: Tylko administratorzy mogą widzieć soft-deleted użytkowników
3. **Walidacja**: Zod schema dla wszystkich parametrów wejściowych
4. **SQL Injection**: Funkcja RPC używa parametryzowanych zapytań
5. **Rate limiting**: Limit max 100 wyników na stronę
6. **Error handling**: Generyczne komunikaty błędów dla 500

## Wydajność

- **Średni czas odpowiedzi**: < 100ms dla 50 użytkowników
- **Maksymalna liczba wyników**: 100 na stronę
- **Indeksowanie**: Wszystkie często używane kolumny są zindeksowane
- **Monitoring**: Logowanie zapytań > 1s

## Przyszłe usprawnienia

1. Implementacja sortowania (sort_by, sort_order)
2. Wyszukiwanie pełnotekstowe (search po imieniu/nazwisku/emailu)
3. Cache'owanie wyników (Redis/Memory)
4. Rate limiting w middleware
5. Testy jednostkowe i integracyjne
6. OpenAPI/Swagger dokumentacja

