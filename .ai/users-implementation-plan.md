# API Endpoint Implementation Plan: User Management

## 1. Przegląd punktów końcowych

Implementacja trzech endpointów zarządzania użytkownikami:

- **POST /api/users** - Tworzenie nowego użytkownika przez administratora z tymczasowym hasłem
- **PATCH /api/users/:id** - Aktualizacja profilu użytkownika z różnymi poziomami uprawnień
- **DELETE /api/users/:id** - Miękkie usunięcie użytkownika przez administratora z automatycznym anulowaniem przyszłych urlopów

Wszystkie endpointy wymagają autentykacji. Create i Delete wymagają roli ADMINISTRATOR. Update ma różne poziomy uprawnień w zależności od roli użytkownika.

## 2. Szczegóły żądań

### 2.1. Create User

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/users`
- **Wymagana rola**: ADMINISTRATOR
- **Parametry**:
  - **Wymagane**:
    - `firstName` (string): Imię użytkownika
    - `lastName` (string): Nazwisko użytkownika
    - `email` (string): Adres email użytkownika
    - `temporaryPassword` (string): Tymczasowe hasło (min. 8 znaków)
  - **Opcjonalne**:
    - `role` (enum): Rola użytkownika - ADMINISTRATOR | HR | EMPLOYEE (domyślnie: EMPLOYEE)
- **Request Body**:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "role": "EMPLOYEE",
  "temporaryPassword": "temp-password-123"
}
```

### 2.2. Update User

- **Metoda HTTP**: PATCH
- **Struktura URL**: `/api/users/:id`
- **Wymagana rola**:
  - ADMINISTRATOR: może edytować wszystkie pola wszystkich użytkowników (oprócz email)
  - EMPLOYEE: może edytować tylko swoje firstName i lastName
- **Parametry URL**:
  - **Wymagane**:
    - `id` (UUID): Identyfikator użytkownika
- **Parametry Body**:
  - **Opcjonalne** (co najmniej jedno wymagane):
    - `firstName` (string): Nowe imię
    - `lastName` (string): Nowe nazwisko
    - `role` (enum): Nowa rola - ADMINISTRATOR | HR | EMPLOYEE (tylko ADMIN)
- **Request Body**:

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "HR"
}
```

### 2.3. Soft-Delete User

- **Metoda HTTP**: DELETE
- **Struktura URL**: `/api/users/:id`
- **Wymagana rola**: ADMINISTRATOR
- **Parametry URL**:
  - **Wymagane**:
    - `id` (UUID): Identyfikator użytkownika do usunięcia
- **Request Body**: Brak

## 3. Wykorzystywane typy

### 3.1. Nowe typy do dodania w `src/types.ts`

```typescript
/**
 * Create user command DTO
 * Used by administrators to create new users
 */
export interface CreateUserDTO {
  firstName: string;
  lastName: string;
  email: string;
  role?: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  temporaryPassword: string;
}

/**
 * Create user response DTO
 * Returned after successful user creation
 */
export interface CreateUserResponseDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  requiresPasswordReset: boolean;
  createdAt: string;
}

/**
 * Update user command DTO
 * Used to update user profile information
 */
export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  role?: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
}

/**
 * Update user response DTO
 * Returned after successful user update
 */
export interface UpdateUserResponseDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  updatedAt: string;
}

/**
 * Delete user response DTO
 * Returned after successful user deletion
 */
export interface DeleteUserResponseDTO {
  message: string;
  id: string;
  deletedAt: string;
  cancelledVacations: number;
}
```

### 3.2. Istniejące typy do wykorzystania

- `ApiResponseDTO<T>` - wrapper dla odpowiedzi API
- `UserDetailsDTO` - dla szczegółowych informacji o użytkowniku
- `ValidationErrorDTO` - dla błędów walidacji

## 4. Szczegóły odpowiedzi

### 4.1. Create User

**Sukces (201 Created)**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "role": "EMPLOYEE",
  "requiresPasswordReset": true,
  "createdAt": "2026-01-06T10:00:00Z"
}
```

**Błędy**:

- 400 Bad Request - Nieprawidłowe dane lub email już istnieje
- 401 Unauthorized - Brak autentykacji
- 403 Forbidden - Użytkownik nie jest administratorem
- 500 Internal Server Error - Błąd serwera

### 4.2. Update User

**Sukces (200 OK)**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "role": "HR",
  "updatedAt": "2026-01-06T12:00:00Z"
}
```

**Błędy**:

- 400 Bad Request - Nieprawidłowe dane lub próba zmiany własnej roli
- 401 Unauthorized - Brak autentykacji
- 403 Forbidden - Niewystarczające uprawnienia
- 404 Not Found - Użytkownik nie znaleziony
- 500 Internal Server Error - Błąd serwera

### 4.3. Soft-Delete User

**Sukces (200 OK)**:

```json
{
  "message": "User deleted successfully",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "deletedAt": "2026-01-06T14:00:00Z",
  "cancelledVacations": 2
}
```

**Błędy**:

- 401 Unauthorized - Brak autentykacji
- 403 Forbidden - Użytkownik nie jest administratorem
- 404 Not Found - Użytkownik nie znaleziony
- 500 Internal Server Error - Błąd serwera

## 5. Przepływ danych

### 5.1. Create User Flow

```
1. Request → Middleware (autentykacja)
2. Middleware → Handler (weryfikacja roli ADMINISTRATOR)
3. Handler → Zod Schema (walidacja danych wejściowych)
4. Handler → Service (createUser)
5. Service → Supabase Auth (auth.admin.createUser)
6. Service → Supabase DB (INSERT into profiles)
7. Service → Handler (CreateUserResponseDTO)
8. Handler → Response (201 + dane użytkownika)
```

**Interakcje z bazą danych**:

- Sprawdzenie unikalności email w `auth.users`
- Utworzenie użytkownika w `auth.users` przez Supabase Admin API
- Utworzenie profilu w tabeli `profiles` (trigger automatyczny lub ręczny INSERT)

### 5.2. Update User Flow

```
1. Request → Middleware (autentykacja)
2. Middleware → Handler (pobranie user_id i roli z sesji)
3. Handler → Zod Schema (walidacja danych wejściowych)
4. Handler → Service (updateUser)
5. Service → Sprawdzenie uprawnień:
   - ADMIN: może edytować wszystko oprócz email
   - EMPLOYEE: tylko swoje firstName/lastName
6. Service → Walidacja business logic:
   - Sprawdzenie czy użytkownik istnieje
   - Sprawdzenie czy nie próbuje zmienić własnej roli
7. Service → Supabase DB (UPDATE profiles)
8. Service → Handler (UpdateUserResponseDTO)
9. Handler → Response (200 + zaktualizowane dane)
```

**Interakcje z bazą danych**:

- SELECT z `profiles` (sprawdzenie istnienia i pobranie obecnych danych)
- UPDATE w `profiles` (aktualizacja pól)
- Automatyczna aktualizacja `updated_at` przez trigger

### 5.3. Soft-Delete User Flow

```
1. Request → Middleware (autentykacja)
2. Middleware → Handler (weryfikacja roli ADMINISTRATOR)
3. Handler → Service (deleteUser)
4. Service → Transakcja:
   a. UPDATE profiles SET deleted_at = NOW() WHERE id = :id
   b. Pobranie przyszłych urlopów użytkownika
   c. UPDATE vacation_requests - anulowanie przyszłych urlopów
   d. Zliczenie anulowanych urlopów
5. Service → Handler (DeleteUserResponseDTO)
6. Handler → Response (200 + podsumowanie)
```

**Interakcje z bazą danych**:

- UPDATE w `profiles` (ustawienie `deleted_at`)
- SELECT z `vacation_requests` (znalezienie przyszłych urlopów)
- UPDATE w `vacation_requests` (zmiana statusu na cancelled)
- Wszystko w ramach transakcji

## 6. Względy bezpieczeństwa

### 6.1. Autentykacja i autoryzacja

- **Wszystkie endpointy** wymagają aktywnej sesji użytkownika (weryfikacja w middleware)
- **Create User**: Wymagana rola `ADMINISTRATOR`
- **Update User**:
  - `ADMINISTRATOR`: pełny dostęp (wszystkie pola oprócz email, wszyscy użytkownicy)
  - `HR`: brak dostępu do zmiany roli
  - `EMPLOYEE`: tylko własne firstName/lastName
- **Delete User**: Wymagana rola `ADMINISTRATOR`

### 6.2. Walidacja danych

**Schemat walidacji Zod dla Create User**:

```typescript
z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase(),
  role: z.enum(["ADMINISTRATOR", "HR", "EMPLOYEE"]).optional().default("EMPLOYEE"),
  temporaryPassword: z.string().min(8).max(100),
});
```

**Schemat walidacji Zod dla Update User**:

```typescript
z.object({
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  role: z.enum(["ADMINISTRATOR", "HR", "EMPLOYEE"]).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});
```

### 6.3. Business Logic Security

- Sprawdzenie unikalności email przed utworzeniem użytkownika
- Zabezpieczenie przed zmianą własnej roli (nawet dla ADMIN)
- Zabezpieczenie przed edycją email (pole niemutowalne)
- Sprawdzenie czy użytkownik nie jest już usunięty przed operacją delete
- Użycie `deleted_at` zamiast fizycznego usunięcia (soft-delete)

### 6.4. Supabase Security

- Wykorzystanie `context.locals.supabase` zamiast bezpośredniego klienta
- Użycie Supabase Admin API dla operacji tworzenia użytkowników (auth.admin.createUser)
- Row Level Security (RLS) na poziomie bazy danych (jeśli włączone)
- Prepared statements (automatycznie przez Supabase SDK) - ochrona przed SQL injection

### 6.5. Password Security

- Tymczasowe hasło musi mieć minimum 8 znaków
- Flaga `requiresPasswordReset: true` wymusza zmianę hasła przy pierwszym logowaniu
- Hasła zarządzane przez Supabase Auth (hashing, salting automatyczny)

## 7. Obsługa błędów

### 7.1. Create User Error Handling

| Kod | Scenariusz                   | Komunikat                                | Akcja                                       |
| --- | ---------------------------- | ---------------------------------------- | ------------------------------------------- |
| 400 | Nieprawidłowe dane wejściowe | Szczegóły walidacji Zod                  | Zwróć ValidationErrorDTO                    |
| 400 | Email już istnieje           | "User with this email already exists"    | Sprawdź w auth.users                        |
| 401 | Brak sesji                   | "Unauthorized"                           | Middleware reject                           |
| 403 | Nie administrator            | "Forbidden: Administrator role required" | Sprawdź role w middleware/handler           |
| 500 | Błąd Supabase Auth           | "Failed to create user account"          | Log błędu, zwróć ogólny komunikat           |
| 500 | Błąd zapisu do DB            | "Failed to create user profile"          | Log błędu, rollback, zwróć ogólny komunikat |

### 7.2. Update User Error Handling

| Kod | Scenariusz                    | Komunikat                             | Akcja                                                   |
| --- | ----------------------------- | ------------------------------------- | ------------------------------------------------------- |
| 400 | Nieprawidłowe dane            | Szczegóły walidacji Zod               | Zwróć ValidationErrorDTO                                |
| 400 | Próba zmiany własnej roli     | "Cannot change your own role"         | Sprawdź requestingUserId vs targetUserId                |
| 400 | Brak pól do aktualizacji      | "At least one field must be provided" | Walidacja Zod refine                                    |
| 401 | Brak sesji                    | "Unauthorized"                        | Middleware reject                                       |
| 403 | EMPLOYEE edytuje innego       | "Forbidden: Cannot edit other users"  | Sprawdź requestingUserId vs targetUserId                |
| 403 | EMPLOYEE próbuje zmienić rolę | "Forbidden: Cannot change user role"  | Sprawdź czy role w request body                         |
| 404 | Użytkownik nie istnieje       | "User not found"                      | SELECT z profiles WHERE id = :id AND deleted_at IS NULL |
| 500 | Błąd DB                       | "Failed to update user"               | Log błędu, zwróć ogólny komunikat                       |

### 7.3. Delete User Error Handling

| Kod | Scenariusz              | Komunikat                                | Akcja                             |
| --- | ----------------------- | ---------------------------------------- | --------------------------------- |
| 401 | Brak sesji              | "Unauthorized"                           | Middleware reject                 |
| 403 | Nie administrator       | "Forbidden: Administrator role required" | Sprawdź role w middleware/handler |
| 404 | Użytkownik nie istnieje | "User not found"                         | SELECT z profiles WHERE id = :id  |
| 404 | Użytkownik już usunięty | "User already deleted"                   | Sprawdź deleted_at IS NOT NULL    |
| 500 | Błąd transakcji         | "Failed to delete user"                  | Rollback transakcji, log błędu    |

### 7.4. Struktura odpowiedzi błędu

```typescript
// Błąd standardowy
{
  "success": false,
  "error": "Error message"
}

// Błąd walidacji
{
  "success": false,
  "error": "Validation failed",
  "validation_errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_string"
    }
  ]
}
```

## 8. Rozważania dotyczące wydajności

### 8.1. Potencjalne wąskie gardła

1. **Create User**:
   - Wywołanie Supabase Admin API (network latency)
   - Tworzenie użytkownika w auth.users + trigger na profiles
   - Możliwy bottleneck przy tworzeniu wielu użytkowników naraz

2. **Update User**:
   - Pojedyncze SELECT + UPDATE - minimalne obciążenie
   - Aktualizacja `updated_at` przez trigger

3. **Delete User**:
   - Transakcja z wieloma operacjami:
     - UPDATE profiles
     - SELECT vacation_requests (może być wiele rekordów)
     - UPDATE vacation_requests (bulk update)
   - Potencjalnie długa transakcja dla użytkowników z wieloma urlopami

### 8.2. Strategie optymalizacji

1. **Indeksy bazodanowe**:
   - Index na `profiles.deleted_at` dla szybkiego filtrowania aktywnych użytkowników
   - Index na `vacation_requests(user_id, start_date, status)` dla szybkiego znajdowania przyszłych urlopów
   - Index na `auth.users.email` (prawdopodobnie już istnieje)

2. **Query optimization**:
   - Użycie `SELECT ... FOR UPDATE` w transakcji delete dla zapewnienia spójności
   - Bulk update dla vacation_requests zamiast iteracji

3. **Caching** (opcjonalnie):
   - Cache dla sprawdzenia roli użytkownika (już w sesji)
   - Brak cache'owania danych użytkowników (dane często się zmieniają)

4. **Rate limiting**:
   - Rozważyć rate limiting na poziomie endpointu (np. max 10 utworzeń użytkownika na minutę)
   - Zabezpieczenie przed abuse

5. **Async operations** (przyszłość):
   - Anulowanie urlopów w tle (job queue) dla lepszej responsywności
   - Wysyłanie emaili powitalnych asynchronicznie

### 8.3. Monitoring

- Logowanie czasu wykonania każdej operacji
- Tracking liczby anulowanych urlopów przy delete
- Monitoring błędów Supabase API
- Alert przy długich transakcjach (>1s)

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie typów (src/types.ts)

1.1. Dodać nowe interfejsy DTO do pliku `src/types.ts`:

- `CreateUserDTO`
- `CreateUserResponseDTO`
- `UpdateUserDTO`
- `UpdateUserResponseDTO`
- `DeleteUserResponseDTO`

### Krok 2: Rozszerzenie middleware (src/middleware/index.ts)

2.1. Upewnić się, że middleware autentykacji:

- Weryfikuje sesję użytkownika
- Dodaje `user` do `context.locals` z polami: `id`, `email`, `role`
- Zwraca 401 dla niezautentykowanych żądań

  2.2. Opcjonalnie: Dodać middleware do weryfikacji roli:

- Helper function `requireRole(roles: string[])`
- Sprawdzenie `context.locals.user.role`

### Krok 3: Utworzenie schematów walidacji

3.1. Utworzyć plik `src/lib/schemas/users.schema.ts`:

- Schema Zod dla `CreateUserDTO`
- Schema Zod dla `UpdateUserDTO`
- Schema Zod dla parametru `id` (UUID)

```typescript
import { z } from "zod";

export const createUserSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase(),
  role: z.enum(["ADMINISTRATOR", "HR", "EMPLOYEE"]).optional().default("EMPLOYEE"),
  temporaryPassword: z.string().min(8).max(100),
});

export const updateUserSchema = z
  .object({
    firstName: z.string().min(1).max(100).trim().optional(),
    lastName: z.string().min(1).max(100).trim().optional(),
    role: z.enum(["ADMINISTRATOR", "HR", "EMPLOYEE"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const userIdSchema = z.string().uuid();
```

### Krok 4: Rozszerzenie serwisu użytkowników (src/lib/services/users.service.ts)

4.1. Dodać funkcję `createUser`:

- Parametry: `supabase: SupabaseClient, data: CreateUserDTO`
- Zwrot: `Promise<CreateUserResponseDTO>`
- Logika:
  - Sprawdzić czy email nie istnieje (query do auth.users)
  - Utworzyć użytkownika przez `supabase.auth.admin.createUser()`
  - Ustawić `email_confirm: true` i `password` na temporaryPassword
  - Dodać metadata: `requiresPasswordReset: true`
  - Utworzyć profil w `profiles` (jeśli nie ma triggera)
  - Zwrócić sformatowaną odpowiedź

    4.2. Dodać funkcję `updateUser`:

- Parametry: `supabase: SupabaseClient, userId: string, data: UpdateUserDTO, requestingUserId: string, requestingUserRole: string`
- Zwrot: `Promise<UpdateUserResponseDTO>`
- Logika:
  - Sprawdzić czy użytkownik istnieje (SELECT from profiles WHERE id = userId AND deleted_at IS NULL)
  - Walidacja uprawnień:
    - Jeśli requestingUserRole === "EMPLOYEE":
      - Sprawdzić czy requestingUserId === userId
      - Sprawdzić czy data nie zawiera `role`
    - Jeśli requestingUserRole === "ADMINISTRATOR":
      - Jeśli requestingUserId === userId i data zawiera `role`: throw error
  - UPDATE profiles SET ... WHERE id = userId
  - Zwrócić zaktualizowane dane

    4.3. Dodać funkcję `deleteUser`:

- Parametry: `supabase: SupabaseClient, userId: string`
- Zwrot: `Promise<DeleteUserResponseDTO>`
- Logika:
  - Rozpocząć transakcję
  - Sprawdzić czy użytkownik istnieje i nie jest usunięty
  - UPDATE profiles SET deleted_at = NOW() WHERE id = userId
  - SELECT vacation_requests WHERE user_id = userId AND start_date > NOW() AND status != 'CANCELLED'
  - UPDATE vacation_requests SET status = 'CANCELLED' WHERE id IN (...)
  - Zliczyć anulowane urlopy
  - Commit transakcji
  - Zwrócić podsumowanie

### Krok 5: Implementacja endpointu POST /api/users

5.1. Utworzyć plik `src/pages/api/users/index.ts`:

- Export `prerender = false`
- Implementacja funkcji `POST`

  5.2. Logika POST handler:

- Pobrać `supabase` i `user` z `context.locals`
- Sprawdzić autentykację (user exists)
- Sprawdzić rolę (user.role === "ADMINISTRATOR")
- Parsować i walidować body przez `createUserSchema`
- Wywołać `createUser` z serwisu
- Obsłużyć błędy (try-catch)
- Zwrócić odpowiedź 201 + dane lub odpowiedni błąd

```typescript
export const POST = async (context) => {
  // Implementation
  return new Response(JSON.stringify(result), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
```

### Krok 6: Implementacja endpointu PATCH /api/users/[id].ts

6.1. Utworzyć plik `src/pages/api/users/[id].ts`:

- Export `prerender = false`
- Implementacja funkcji `PATCH`

  6.2. Logika PATCH handler:

- Pobrać `id` z `context.params`
- Walidować `id` przez `userIdSchema`
- Pobrać `supabase` i `user` z `context.locals`
- Sprawdzić autentykację
- Parsować i walidować body przez `updateUserSchema`
- Wywołać `updateUser` z serwisu
- Obsłużyć błędy (try-catch)
- Zwrócić odpowiedź 200 + dane lub odpowiedni błąd

### Krok 7: Implementacja endpointu DELETE /api/users/[id].ts

7.1. Dodać funkcję `DELETE` do pliku `src/pages/api/users/[id].ts`:

7.2. Logika DELETE handler:

- Pobrać `id` z `context.params`
- Walidować `id` przez `userIdSchema`
- Pobrać `supabase` i `user` z `context.locals`
- Sprawdzić autentykację
- Sprawdzić rolę (user.role === "ADMINISTRATOR")
- Wywołać `deleteUser` z serwisu
- Obsłużyć błędy (try-catch)
- Zwrócić odpowiedź 200 + podsumowanie lub odpowiedni błąd

### Krok 8: Obsługa błędów

8.1. Utworzyć helper do formatowania błędów:

- Plik: `src/lib/errors.ts`
- Funkcje: `formatValidationError`, `formatApiError`
- Mapowanie błędów Supabase na kody HTTP

  8.2. W każdym handlerze używać try-catch:

- Catch ZodError → 400 z ValidationErrorDTO
- Catch known errors (np. "User not found") → odpowiedni kod
- Catch unknown errors → 500 z ogólnym komunikatem
- Logowanie wszystkich błędów

### Krok 9: Testy

9.1. Utworzyć testy dla POST /api/users:

- `tests/api/users-create.test.sh`
- Test przypadki:
  - Sukces tworzenia (201)
  - Brak autentykacji (401)
  - Brak uprawnień - nie admin (403)
  - Nieprawidłowe dane (400)
  - Email już istnieje (400)

    9.2. Utworzyć testy dla PATCH /api/users/:id:

- `tests/api/users-update.test.sh`
- Test przypadki:
  - Admin aktualizuje użytkownika (200)
  - Employee aktualizuje siebie (200)
  - Employee próbuje edytować innego (403)
  - Próba zmiany własnej roli (400)
  - Użytkownik nie istnieje (404)

    9.3. Utworzyć testy dla DELETE /api/users/:id:

- `tests/api/users-delete.test.sh`
- Test przypadki:
  - Admin usuwa użytkownika (200)
  - Nie admin próbuje usunąć (403)
  - Użytkownik nie istnieje (404)
  - Sprawdzenie anulowania urlopów

    9.4. Uruchomić wszystkie testy:

- Dodać do `tests/api/run-all.sh`
- Weryfikacja wszystkich scenariuszy

### Krok 10: Dokumentacja

10.1. Zaktualizować `docs/API_EXAMPLES.md`:

- Dodać przykłady curl dla wszystkich trzech endpointów
- Dokumentacja przykładowych request/response
- Dokumentacja kodów błędów

  10.2. Opcjonalnie: Utworzyć Postman/Insomnia collection

### Krok 11: Code review i refactoring

11.1. Przegląd kodu:

- Sprawdzenie zgodności z coding guidelines
- Uruchomienie lintera (eslint)
- Sprawdzenie typów TypeScript

  11.2. Optymalizacja:

- Sprawdzenie wydajności queries
- Dodanie indeksów jeśli potrzebne
- Refactoring duplikującego się kodu

### Krok 12: Deployment checklist

12.1. Przed wdrożeniem:

- ✅ Wszystkie testy przechodzą
- ✅ Brak błędów TypeScript
- ✅ Linter bez ostrzeżeń
- ✅ Dokumentacja zaktualizowana
- ✅ Middleware autentykacji działa
- ✅ Indeksy bazodanowe utworzone

  12.2. Po wdrożeniu:

- Monitoring błędów
- Sprawdzenie performance
- Feedback od użytkowników

## 10. Dodatkowe uwagi

### 10.1. Przyszłe ulepszenia

- **Bulk user creation**: Endpoint do tworzenia wielu użytkowników naraz (CSV import)
- **Password policy**: Konfiguracyjne wymagania dotyczące siły hasła
- **Email notifications**: Wysyłanie emaili powitalnych z linkiem do zmiany hasła
- **Audit log**: Logowanie wszystkich operacji administracyjnych
- **User restoration**: Endpoint do przywracania usuniętych użytkowników (un-delete)

### 10.2. Bezpieczeństwo - best practices

- Używać HTTPS w produkcji
- Implementować rate limiting
- Logować wszystkie operacje administracyjne
- Regularnie audytować uprawnienia
- Implementować 2FA dla administratorów (przyszłość)

### 10.3. Zgodność z RODO

- Soft-delete zamiast fizycznego usunięcia (prawo do bycia zapomnianym)
- Możliwość eksportu danych użytkownika (przyszły endpoint)
- Logowanie dostępu do danych osobowych
- Szyfrowanie danych wrażliwych (automatycznie przez Supabase)
