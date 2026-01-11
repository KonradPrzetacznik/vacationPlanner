# API Endpoint Implementation Plan: Vacation Allowances Management

## 1. Przegląd punktów końcowych

### POST /api/vacation-allowances
Endpoint służący do tworzenia nowych pul urlopowych dla użytkowników. Dostępny wyłącznie dla użytkowników z rolą HR. Umożliwia zdefiniowanie rocznej puli urlopowej wraz z dniami przeniesionymi z poprzedniego roku (carryover).

**Główne cechy:**
- Tworzenie nowej puli urlopowej dla użytkownika na określony rok
- Kontrola unikalności: jeden użytkownik może mieć tylko jedną pulę na dany rok
- Walidacja istnienia użytkownika i jego statusu (nie może być soft-deleted)
- Automatyczne ustawianie daty wygaśnięcia dni carryover (31 marca danego roku)

### PATCH /api/vacation-allowances/:id
Endpoint służący do aktualizacji istniejących pul urlopowych. Dostępny wyłącznie dla użytkowników z rolą HR. Pozwala na modyfikację liczby dni urlopowych oraz dni przeniesionych.

**Główne cechy:**
- Aktualizacja istniejącej puli urlopowej
- Częściowa aktualizacja (PATCH) - wymagany przynajmniej jeden z pól: totalDays, carryoverDays
- Walidacja wartości nie ujemnych
- Automatyczna aktualizacja pola updated_at

---

## 2. Szczegóły żądania

### POST /api/vacation-allowances

**Metoda HTTP:** `POST`

**Struktura URL:** `/api/vacation-allowances`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token} (przyszłe - obecnie DEFAULT_USER_ID)
```

**Parametry:**

**Wymagane (Request Body):**
- `userId` (string, UUID) - Identyfikator użytkownika, dla którego tworzona jest pula
- `year` (number, integer) - Rok, którego dotyczy pula urlopowa (2000-2100)
- `totalDays` (number, integer) - Całkowita liczba dni urlopowych w danym roku (>= 0)
- `carryoverDays` (number, integer) - Liczba dni przeniesionych z poprzedniego roku (>= 0)

**Opcjonalne:**
- Brak

**Przykład Request Body:**
```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "year": 2026,
  "totalDays": 26,
  "carryoverDays": 3
}
```

### PATCH /api/vacation-allowances/:id

**Metoda HTTP:** `PATCH`

**Struktura URL:** `/api/vacation-allowances/{id}`

**Path Parameters:**
- `id` (string, UUID) - Identyfikator puli urlopowej do aktualizacji

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token} (przyszłe - obecnie DEFAULT_USER_ID)
```

**Parametry:**

**Wymagane:**
- `id` (path parameter, UUID) - Identyfikator puli urlopowej

**Opcjonalne (Request Body - przynajmniej jeden wymagany):**
- `totalDays` (number, integer) - Nowa całkowita liczba dni urlopowych (>= 0)
- `carryoverDays` (number, integer) - Nowa liczba dni przeniesionych (>= 0)

**Przykład Request Body:**
```json
{
  "totalDays": 28,
  "carryoverDays": 5
}
```

---

## 3. Wykorzystywane typy

### Istniejące typy (z types.ts):

```typescript
// Używane w odpowiedziach
export interface VacationAllowanceDTO {
  id: string;
  userId: string;
  year: number;
  totalDays: number;
  carryoverDays: number;
  usedDays: number;
  usedCarryoverDays: number;
  usedCurrentYearDays: number;
  remainingDays: number;
  remainingCarryoverDays: number;
  remainingCurrentYearDays: number;
  carryoverExpiresAt: string;
  createdAt: string;
  updatedAt: string;
}
```

### Nowe typy do dodania (w types.ts):

```typescript
/**
 * Create vacation allowance command DTO
 * Used by HR to create new vacation allowances for users
 * Connected to: Database['public']['Tables']['vacation_allowances']['Insert']
 */
export interface CreateVacationAllowanceDTO {
  userId: string;
  year: number;
  totalDays: number;
  carryoverDays: number;
}

/**
 * Create vacation allowance response DTO
 * Returned after successful vacation allowance creation
 */
export interface CreateVacationAllowanceResponseDTO {
  id: string;
  userId: string;
  year: number;
  totalDays: number;
  carryoverDays: number;
  createdAt: string;
}

/**
 * Update vacation allowance command DTO
 * Used by HR to update existing vacation allowances
 * At least one field must be provided
 */
export interface UpdateVacationAllowanceDTO {
  totalDays?: number;
  carryoverDays?: number;
}

/**
 * Update vacation allowance response DTO
 * Returned after successful vacation allowance update
 */
export interface UpdateVacationAllowanceResponseDTO {
  id: string;
  userId: string;
  year: number;
  totalDays: number;
  carryoverDays: number;
  updatedAt: string;
}
```

### Nowe schematy walidacji (vacation-allowances.schema.ts):

```typescript
/**
 * Vacation allowance ID path parameter validation
 */
export const vacationAllowanceIdParamSchema = z.object({
  id: z.string().uuid("Invalid UUID format"),
});

/**
 * Create vacation allowance request body validation
 */
export const createVacationAllowanceSchema = z.object({
  userId: z.string().uuid("User ID must be a valid UUID"),
  year: z.number()
    .int("Year must be an integer")
    .min(2000, "Year must be at least 2000")
    .max(2100, "Year must be at most 2100"),
  totalDays: z.number()
    .int("Total days must be an integer")
    .min(0, "Total days cannot be negative"),
  carryoverDays: z.number()
    .int("Carryover days must be an integer")
    .min(0, "Carryover days cannot be negative"),
});

/**
 * Update vacation allowance request body validation
 * At least one field must be provided
 */
export const updateVacationAllowanceSchema = z.object({
  totalDays: z.number()
    .int("Total days must be an integer")
    .min(0, "Total days cannot be negative")
    .optional(),
  carryoverDays: z.number()
    .int("Carryover days must be an integer")
    .min(0, "Carryover days cannot be negative")
    .optional(),
}).refine(
  (data) => data.totalDays !== undefined || data.carryoverDays !== undefined,
  {
    message: "At least one field (totalDays or carryoverDays) must be provided",
  }
);
```

---

## 4. Szczegóły odpowiedzi

### POST /api/vacation-allowances

**Sukces (201 Created):**
```json
{
  "id": "f1e2d3c4-b5a6-7890-cdef-1234567890ab",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "year": 2026,
  "totalDays": 26,
  "carryoverDays": 3,
  "createdAt": "2026-01-11T10:30:00.000Z"
}
```

**Błąd walidacji (400 Bad Request):**
```json
{
  "error": "Invalid request body",
  "details": {
    "totalDays": ["Total days cannot be negative"],
    "year": ["Year must be at least 2000"]
  }
}
```

**Duplikat (400 Bad Request):**
```json
{
  "error": "Vacation allowance for this user and year already exists"
}
```

**Brak uwierzytelnienia (401 Unauthorized):**
```json
{
  "error": "Not authenticated"
}
```

**Brak uprawnień (403 Forbidden):**
```json
{
  "error": "Only HR users can create vacation allowances"
}
```

**Użytkownik nie istnieje (404 Not Found):**
```json
{
  "error": "User not found"
}
```

### PATCH /api/vacation-allowances/:id

**Sukces (200 OK):**
```json
{
  "id": "f1e2d3c4-b5a6-7890-cdef-1234567890ab",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "year": 2026,
  "totalDays": 28,
  "carryoverDays": 5,
  "updatedAt": "2026-01-15T14:20:00.000Z"
}
```

**Błędy walidacji (400 Bad Request):**
```json
{
  "error": "Invalid request body",
  "details": {
    "totalDays": ["Total days cannot be negative"]
  }
}
```

**Brak pól do aktualizacji (400 Bad Request):**
```json
{
  "error": "Invalid request body",
  "details": {
    "_errors": ["At least one field (totalDays or carryoverDays) must be provided"]
  }
}
```

**Pula nie istnieje (404 Not Found):**
```json
{
  "error": "Vacation allowance not found"
}
```

---

## 5. Przepływ danych

### POST /api/vacation-allowances

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/vacation-allowances
       │ Body: { userId, year, totalDays, carryoverDays }
       ▼
┌──────────────────────────────────────────┐
│  API Endpoint (index.ts)                 │
│  1. Walidacja body (Zod schema)          │
│  2. Sprawdzenie uwierzytelnienia         │
│  3. Wywołanie createVacationAllowance()  │
└──────┬───────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────────┐
│  Service (vacation-allowances.service.ts) │
│  1. Sprawdzenie roli (tylko HR)           │
│  2. Weryfikacja istnienia użytkownika     │
│  3. Sprawdzenie deleted_at użytkownika    │
│  4. Sprawdzenie duplikatu (user+year)     │
│  5. INSERT do vacation_allowances         │
│  6. Zwrócenie utworzonego rekordu         │
└──────┬────────────────────────────────────┘
       │
       ▼
┌──────────────────┐
│  Database        │
│  - profiles      │
│  - vacation_     │
│    allowances    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Response        │
│  201 Created     │
│  lub Error       │
└──────────────────┘
```

### PATCH /api/vacation-allowances/:id

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ PATCH /api/vacation-allowances/:id
       │ Body: { totalDays?, carryoverDays? }
       ▼
┌──────────────────────────────────────────┐
│  API Endpoint ([id].ts)                  │
│  1. Walidacja id z path                  │
│  2. Walidacja body (Zod schema)          │
│  3. Sprawdzenie uwierzytelnienia         │
│  4. Wywołanie updateVacationAllowance()  │
└──────┬───────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────────┐
│  Service (vacation-allowances.service.ts) │
│  1. Sprawdzenie roli (tylko HR)           │
│  2. Weryfikacja istnienia puli            │
│  3. UPDATE vacation_allowances            │
│  4. Zwrócenie zaktualizowanego rekordu    │
└──────┬────────────────────────────────────┘
       │
       ▼
┌──────────────────┐
│  Database        │
│  - vacation_     │
│    allowances    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Response        │
│  200 OK          │
│  lub Error       │
└──────────────────┘
```

### Interakcje z bazą danych:

**POST:**
1. SELECT z `profiles` - weryfikacja użytkownika i deleted_at
2. SELECT z `vacation_allowances` - sprawdzenie duplikatu (user_id + year)
3. INSERT do `vacation_allowances` - utworzenie nowej puli

**PATCH:**
1. SELECT z `vacation_allowances` - weryfikacja istnienia puli
2. UPDATE `vacation_allowances` - aktualizacja pól

---

## 6. Względy bezpieczeństwa

### Uwierzytelnianie
- **Obecnie:** Używany DEFAULT_USER_ID z konfiguracji
- **Przyszłość:** Pełna integracja z Supabase Auth
- **Implementacja:** Sprawdzenie locals.supabase i currentUserId przed wywołaniem service

### Autoryzacja (RBAC - Role-Based Access Control)

**Kto może tworzyć pule urlopowe (POST):**
- ✅ HR - Pełny dostęp
- ❌ ADMINISTRATOR - Brak (zgodnie ze specyfikacją)
- ❌ EMPLOYEE - Brak

**Kto może aktualizować pule (PATCH):**
- ✅ HR - Pełny dostęp
- ❌ ADMINISTRATOR - Brak (zgodnie ze specyfikacją)
- ❌ EMPLOYEE - Brak

**Implementacja w service:**
```typescript
if (currentUserRole !== "HR") {
  throw new Error("Only HR users can create vacation allowances");
}
```

### Walidacja danych wejściowych

**Poziom 1 - Zod Schema (API endpoint):**
- Format UUID dla userId i id
- Zakres lat: 2000-2100
- Wartości całkowite (integer)
- Wartości nie ujemne (>= 0)
- Wymagane pola w POST
- Przynajmniej jedno pole w PATCH

**Poziom 2 - Logika biznesowa (Service):**
- Weryfikacja istnienia użytkownika w bazie
- Sprawdzenie statusu użytkownika (deleted_at)
- Unikalność kombinacji user_id + year (UNIQUE constraint)
- Integralność referencyjna (FOREIGN KEY)

### Ochrona przed atakami

**SQL Injection:**
- Używanie Supabase Client z parametryzowanymi zapytaniami
- Brak bezpośredniej konkatenacji SQL

**Mass Assignment:**
- Zod schema kontroluje dokładnie jakie pola są akceptowane
- Automatyczne odrzucenie nieznanych pól

**Privilege Escalation:**
- Ścisła kontrola roli przed wykonaniem operacji
- Brak możliwości tworzenia pul przez użytkowników EMPLOYEE

**Race Conditions:**
- UNIQUE constraint (user_id, year) na poziomie bazy danych
- Transakcyjność operacji INSERT/UPDATE w PostgreSQL

### Soft-delete Protection
```typescript
// Nie można tworzyć puli dla usuniętego użytkownika
if (targetUser.deleted_at) {
  throw new Error("Cannot create vacation allowance for deleted user");
}
```

---

## 7. Obsługa błędów

### POST /api/vacation-allowances

| Kod | Scenariusz | Komunikat | Kiedy występuje |
|-----|-----------|-----------|----------------|
| 400 | Błąd walidacji | "Invalid request body" + szczegóły | Nieprawidłowy format danych (Zod) |
| 400 | Duplikat | "Vacation allowance for this user and year already exists" | UNIQUE constraint violation |
| 400 | Wartości ujemne | Szczegóły z Zod | totalDays < 0 lub carryoverDays < 0 |
| 400 | Nieprawidłowy rok | "Year must be at least 2000" | year < 2000 lub year > 2100 |
| 400 | Użytkownik usunięty | "Cannot create vacation allowance for deleted user" | targetUser.deleted_at !== null |
| 401 | Brak auth | "Not authenticated" | Brak currentUserId |
| 403 | Brak uprawnień | "Only HR users can create vacation allowances" | currentUserRole !== "HR" |
| 404 | Użytkownik nie istnieje | "User not found" | userId nie istnieje w profiles |
| 500 | Błąd bazy danych | "Failed to create vacation allowance" | Błąd Supabase |
| 500 | Nieznany błąd | "Internal server error" | Nieoczekiwany błąd |

### PATCH /api/vacation-allowances/:id

| Kod | Scenariusz | Komunikat | Kiedy występuje |
|-----|-----------|-----------|----------------|
| 400 | Błąd walidacji | "Invalid request body" + szczegóły | Nieprawidłowy format danych (Zod) |
| 400 | Nieprawidłowy ID | "Invalid UUID format" | id nie jest UUID |
| 400 | Wartości ujemne | Szczegóły z Zod | totalDays < 0 lub carryoverDays < 0 |
| 400 | Brak pól | "At least one field must be provided" | Puste body lub tylko null/undefined |
| 401 | Brak auth | "Not authenticated" | Brak currentUserId |
| 403 | Brak uprawnień | "Only HR users can update vacation allowances" | currentUserRole !== "HR" |
| 404 | Pula nie istnieje | "Vacation allowance not found" | id nie istnieje w vacation_allowances |
| 500 | Błąd bazy danych | "Failed to update vacation allowance" | Błąd Supabase |
| 500 | Nieznany błąd | "Internal server error" | Nieoczekiwany błąd |

### Strategia logowania błędów

**Development (console.error):**
```typescript
console.error("[POST /api/vacation-allowances] Error:", {
  timestamp: new Date().toISOString(),
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
  userId: currentUserId,
  requestBody: validatedData,
});
```

**Service Layer:**
```typescript
console.error("[VacationAllowancesService] Failed to create allowance:", {
  error: dbError,
  userId: targetUserId,
  year,
});
```

**Nie logować:**
- Hasła, tokeny, dane wrażliwe
- Stack trace w produkcji (tylko w dev)

---

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

**1. Walidacja istnienia użytkownika**
- SELECT z profiles dla każdego POST
- **Mitygacja:** Indeks na profiles.id (PRIMARY KEY - już istnieje)

**2. Sprawdzenie duplikatu**
- SELECT z vacation_allowances WHERE user_id = X AND year = Y
- **Mitygacja:** 
  - UNIQUE constraint (user_id, year) - pozwala na optymalizację
  - Dodanie indeksu złożonego (już istnieje: 20260111000001_add_vacation_allowances_indexes.sql)

**3. N+1 Problem**
- Nie występuje - operacje pojedyncze (nie ma pętli)

### Strategie optymalizacji

**Indeksy (już zaimplementowane):**
```sql
-- Z migracji 20260111000001_add_vacation_allowances_indexes.sql
CREATE INDEX IF NOT EXISTS idx_vacation_allowances_user_id 
  ON vacation_allowances(user_id);
CREATE INDEX IF NOT EXISTS idx_vacation_allowances_year 
  ON vacation_allowances(year);
CREATE INDEX IF NOT EXISTS idx_vacation_allowances_user_year 
  ON vacation_allowances(user_id, year);
```

**Limity i timeouty:**
- Request timeout: 30s (domyślnie w Astro)
- Brak paginacji (operacje pojedyncze)

**Caching:**
- Brak cache dla operacji zapisu (POST, PATCH)
- Cache może być dodany na poziomie odczytu (GET) w przyszłości

**Monitoring wydajności:**
```typescript
const startTime = Date.now();
const result = await createVacationAllowance(/* ... */);
const duration = Date.now() - startTime;

// Log slow operations
if (duration > 1000) {
  console.warn("[POST /api/vacation-allowances] Slow operation:", {
    duration,
    userId: validatedData.userId,
    year: validatedData.year,
  });
}
```

### Szacunkowy czas wykonania
- **POST:** ~100-300ms (2-3 SELECT + 1 INSERT)
- **PATCH:** ~50-150ms (1 SELECT + 1 UPDATE)

---

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie pliku types.ts
**Czas:** 5-10 minut

**Zadanie:**
- Dodać DTOs: `CreateVacationAllowanceDTO`, `CreateVacationAllowanceResponseDTO`
- Dodać DTOs: `UpdateVacationAllowanceDTO`, `UpdateVacationAllowanceResponseDTO`
- Umieścić w sekcji "Vacation Allowances DTOs" (linia ~980)

**Lokalizacja:** `/src/types.ts`

**Walidacja:** Brak błędów TypeScript

---

### Krok 2: Rozszerzenie schematu walidacji
**Czas:** 10-15 minut

**Zadanie:**
- Dodać `vacationAllowanceIdParamSchema`
- Dodać `createVacationAllowanceSchema` z walidacją:
  - userId: UUID
  - year: 2000-2100
  - totalDays: >= 0
  - carryoverDays: >= 0
- Dodać `updateVacationAllowanceSchema` z:
  - Opcjonalne pola: totalDays, carryoverDays
  - Walidacja: przynajmniej jedno pole wymagane (refine)

**Lokalizacja:** `/src/lib/schemas/vacation-allowances.schema.ts`

**Walidacja:** 
- Testy jednostkowe schematów (opcjonalnie)
- Brak błędów TypeScript

---

### Krok 3: Implementacja funkcji service - createVacationAllowance()
**Czas:** 30-40 minut

**Zadanie:**
Utworzyć funkcję `createVacationAllowance()` w service z następującą logiką:

```typescript
export async function createVacationAllowance(
  supabase: SupabaseClient,
  currentUserId: string,
  currentUserRole: "ADMINISTRATOR" | "HR" | "EMPLOYEE",
  data: CreateVacationAllowanceDTO
): Promise<CreateVacationAllowanceResponseDTO>
```

**Algorytm:**
1. Sprawdzić rolę (tylko HR)
2. Zweryfikować istnienie użytkownika (SELECT profiles)
3. Sprawdzić deleted_at użytkownika
4. Sprawdzić duplikat (SELECT vacation_allowances WHERE user_id + year)
5. INSERT do vacation_allowances
6. Zwrócić CreateVacationAllowanceResponseDTO

**Error handling:**
- Authorization: "Only HR users can create vacation allowances"
- User not found: "User not found"
- Deleted user: "Cannot create vacation allowance for deleted user"
- Duplicate: "Vacation allowance for this user and year already exists"
- Database error: "Failed to create vacation allowance"

**Lokalizacja:** `/src/lib/services/vacation-allowances.service.ts`

**Walidacja:**
- Brak błędów TypeScript
- Linter (ESLint) pass

---

### Krok 4: Implementacja funkcji service - updateVacationAllowance()
**Czas:** 20-30 minut

**Zadanie:**
Utworzyć funkcję `updateVacationAllowance()` w service:

```typescript
export async function updateVacationAllowance(
  supabase: SupabaseClient,
  currentUserId: string,
  currentUserRole: "ADMINISTRATOR" | "HR" | "EMPLOYEE",
  allowanceId: string,
  data: UpdateVacationAllowanceDTO
): Promise<UpdateVacationAllowanceResponseDTO>
```

**Algorytm:**
1. Sprawdzić rolę (tylko HR)
2. Zweryfikować istnienie puli (SELECT vacation_allowances WHERE id)
3. UPDATE vacation_allowances (tylko przekazane pola)
4. Zwrócić UpdateVacationAllowanceResponseDTO

**Error handling:**
- Authorization: "Only HR users can update vacation allowances"
- Not found: "Vacation allowance not found"
- Database error: "Failed to update vacation allowance"

**Lokalizacja:** `/src/lib/services/vacation-allowances.service.ts`

**Walidacja:**
- Brak błędów TypeScript
- Linter (ESLint) pass

---

### Krok 5: Utworzenie katalogu i pliku endpoint - index.ts
**Czas:** 30-40 minut

**Zadanie:**
Utworzyć katalog `/src/pages/api/vacation-allowances/` i plik `index.ts` z handlerem POST

**Struktura:**
```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { createVacationAllowance } from "@/lib/services/vacation-allowances.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { createVacationAllowanceSchema } from "@/lib/schemas/vacation-allowances.schema";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Parse request body
  // 2. Validate with Zod schema
  // 3. Check authentication (DEFAULT_USER_ID)
  // 4. Get current user role from profiles
  // 5. Call createVacationAllowance()
  // 6. Return 201 Created or error
};
```

**Error handling:**
- 400: Walidacja Zod
- 401: Brak currentUserId
- 403: Brak uprawnień (z service)
- 404: User not found (z service)
- 500: Database errors

**Lokalizacja:** `/src/pages/api/vacation-allowances/index.ts`

**Walidacja:**
- Brak błędów TypeScript
- get_errors sprawdzenie

---

### Krok 6: Utworzenie pliku endpoint - [id].ts
**Czas:** 30-40 minut

**Zadanie:**
Utworzyć plik `/src/pages/api/vacation-allowances/[id].ts` z handlerem PATCH

**Struktura:**
```typescript
import type { APIRoute } from "astro";
import { updateVacationAllowance } from "@/lib/services/vacation-allowances.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { 
  vacationAllowanceIdParamSchema,
  updateVacationAllowanceSchema 
} from "@/lib/schemas/vacation-allowances.schema";

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  // 1. Validate id from params
  // 2. Parse request body
  // 3. Validate body with Zod schema
  // 4. Check authentication (DEFAULT_USER_ID)
  // 5. Get current user role from profiles
  // 6. Call updateVacationAllowance()
  // 7. Return 200 OK or error
};
```

**Error handling:**
- 400: Walidacja Zod (id, body)
- 401: Brak currentUserId
- 403: Brak uprawnień (z service)
- 404: Allowance not found (z service)
- 500: Database errors

**Lokalizacja:** `/src/pages/api/vacation-allowances/[id].ts`

**Walidacja:**
- Brak błędów TypeScript
- get_errors sprawdzenie

---

### Krok 7: Pobieranie roli użytkownika
**Czas:** 15-20 minut

**Zadanie:**
W obu endpointach (index.ts i [id].ts) dodać logikę pobierania roli current user:

```typescript
// Get current user role from profiles
const { data: currentUserProfile, error: profileError } = await locals.supabase
  .from("profiles")
  .select("role")
  .eq("id", currentUserId)
  .single();

if (profileError || !currentUserProfile) {
  return new Response(
    JSON.stringify({ error: "User profile not found" }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}

const currentUserRole = currentUserProfile.role;
```

**Lokalizacja:** 
- `/src/pages/api/vacation-allowances/index.ts`
- `/src/pages/api/vacation-allowances/[id].ts`

**Walidacja:**
- Działa dla DEFAULT_USER_ID
- Poprawna rola jest przekazywana do service

---

### Krok 8: Dodanie performance monitoring
**Czas:** 10-15 minut

**Zadanie:**
W obu endpointach dodać logowanie czasu wykonania:

```typescript
const startTime = Date.now();
const result = await createVacationAllowance(/* ... */);
const duration = Date.now() - startTime;

if (duration > 1000) {
  console.warn("[POST /api/vacation-allowances] Slow operation:", {
    duration,
    userId: validatedData.userId,
  });
}
```

**Lokalizacja:** 
- `/src/pages/api/vacation-allowances/index.ts`
- `/src/pages/api/vacation-allowances/[id].ts`

---

### Krok 9: Testy manualne z curl/API client
**Czas:** 30-45 minut

**Zadanie:**
Przetestować wszystkie scenariusze:

**POST /api/vacation-allowances:**
```bash
# Sukces - utworzenie puli
curl -X POST http://localhost:3000/api/vacation-allowances \
  -H "Content-Type: application/json" \
  -d '{"userId":"UUID","year":2026,"totalDays":26,"carryoverDays":3}'

# Błąd - duplikat
curl -X POST http://localhost:3000/api/vacation-allowances \
  -H "Content-Type: application/json" \
  -d '{"userId":"UUID","year":2026,"totalDays":26,"carryoverDays":3}'

# Błąd - nieprawidłowa walidacja
curl -X POST http://localhost:3000/api/vacation-allowances \
  -H "Content-Type: application/json" \
  -d '{"userId":"invalid","year":1999,"totalDays":-5,"carryoverDays":-2}'

# Błąd - użytkownik nie istnieje
curl -X POST http://localhost:3000/api/vacation-allowances \
  -H "Content-Type: application/json" \
  -d '{"userId":"00000000-0000-0000-0000-000000000000","year":2026,"totalDays":26,"carryoverDays":0}'
```

**PATCH /api/vacation-allowances/:id:**
```bash
# Sukces - aktualizacja
curl -X PATCH http://localhost:3000/api/vacation-allowances/UUID \
  -H "Content-Type: application/json" \
  -d '{"totalDays":28,"carryoverDays":5}'

# Sukces - częściowa aktualizacja
curl -X PATCH http://localhost:3000/api/vacation-allowances/UUID \
  -H "Content-Type: application/json" \
  -d '{"totalDays":30}'

# Błąd - brak pól
curl -X PATCH http://localhost:3000/api/vacation-allowances/UUID \
  -H "Content-Type: application/json" \
  -d '{}'

# Błąd - pula nie istnieje
curl -X PATCH http://localhost:3000/api/vacation-allowances/00000000-0000-0000-0000-000000000000 \
  -H "Content-Type: application/json" \
  -d '{"totalDays":28}'
```

**Sprawdzić:**
- Kody statusu HTTP (201, 200, 400, 403, 404)
- Struktura odpowiedzi
- Komunikaty błędów
- Dane w bazie (SELECT)

---

### Krok 10: Utworzenie testów automatycznych (opcjonalne)
**Czas:** 60-90 minut

**Zadanie:**
Utworzyć skrypty testowe bash w `/tests/api/`:

1. `vacation-allowances-create.test.sh`
2. `vacation-allowances-update.test.sh`

**Struktura (wzorowane na istniejących testach):**
```bash
#!/bin/bash
source "$(dirname "$0")/test-helpers.sh"

# Test: Create vacation allowance - success
# Test: Create vacation allowance - duplicate
# Test: Create vacation allowance - invalid data
# Test: Create vacation allowance - user not found
# Test: Update vacation allowance - success
# Test: Update vacation allowance - not found
# Test: Update vacation allowance - no fields
```

**Lokalizacja:** `/tests/api/`

**Integracja:**
- Dodać do `/tests/api/run-all.sh`
- Dodać do dokumentacji `/tests/api/README.md`

---

### Krok 11: Aktualizacja dokumentacji
**Czas:** 15-20 minut

**Zadanie:**
1. Dodać przykłady użycia do `/docs/API_EXAMPLES.md`:
   - POST /api/vacation-allowances
   - PATCH /api/vacation-allowances/:id
2. Zaktualizować README.md (jeśli zawiera listę endpointów)

**Format przykładów:**
```markdown
### Create Vacation Allowance

**Endpoint:** `POST /api/vacation-allowances`

**Request:**
```bash
curl -X POST http://localhost:3000/api/vacation-allowances \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "uuid-here",
    "year": 2026,
    "totalDays": 26,
    "carryoverDays": 3
  }'
```

**Response (201):**
```json
{
  "id": "uuid",
  "userId": "uuid-here",
  "year": 2026,
  "totalDays": 26,
  "carryoverDays": 3,
  "createdAt": "2026-01-11T10:00:00Z"
}
```
```

---

### Krok 12: Code review i finalizacja
**Czas:** 20-30 minut

**Checklist:**
- [ ] Wszystkie typy dodane do types.ts
- [ ] Schematy walidacji kompletne i przetestowane
- [ ] Service functions zaimplementowane z error handling
- [ ] Endpoint handlers utworzone (POST i PATCH)
- [ ] Performance monitoring dodany
- [ ] Testy manualne przeprowadzone
- [ ] Testy automatyczne utworzone (opcjonalnie)
- [ ] Dokumentacja zaktualizowana
- [ ] Brak błędów TypeScript (`npm run build`)
- [ ] Brak błędów ESLint
- [ ] Kod sformatowany (prettier)
- [ ] Commit messages opisowe

**Ostateczna walidacja:**
```bash
# TypeScript
npm run build

# Linter
npm run lint

# Tests (jeśli utworzone)
cd tests/api && ./run-all.sh
```

---

## Podsumowanie

**Całkowity czas wdrożenia:** ~4-6 godzin

**Kluczowe pliki do utworzenia/modyfikacji:**
1. `/src/types.ts` - 4 nowe DTOs
2. `/src/lib/schemas/vacation-allowances.schema.ts` - 3 nowe schematy
3. `/src/lib/services/vacation-allowances.service.ts` - 2 nowe funkcje
4. `/src/pages/api/vacation-allowances/index.ts` - nowy endpoint (POST)
5. `/src/pages/api/vacation-allowances/[id].ts` - nowy endpoint (PATCH)
6. `/tests/api/*.test.sh` - skrypty testowe (opcjonalnie)
7. `/docs/API_EXAMPLES.md` - dokumentacja

**Zależności:**
- Istniejące: Supabase client, middleware, database schema
- Nowe: Brak (wszystkie wymagane biblioteki już zainstalowane)

**Potencjalne ryzyka:**
- UNIQUE constraint violation - obsłużone w service
- Soft-deleted users - walidacja w service
- Race conditions - minimalne ryzyko dzięki UNIQUE constraint
- Performance - mitigowane przez indeksy

**Kolejne kroki po wdrożeniu:**
1. Monitoring produkcyjny (logi, metryki)
2. Integracja z frontendem
3. Rozszerzenie o bulk operations (opcjonalnie)
4. Cache dla często używanych danych (opcjonalnie)

