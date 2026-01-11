# API Endpoint Implementation Plan: Settings Management

## 1. Przegląd punktu końcowego

Implementacja trzech endpointów API do zarządzania globalnymi ustawieniami aplikacji:

- **GET /api/settings** - Pobieranie wszystkich ustawień globalnych (dostępne dla wszystkich zalogowanych użytkowników)
- **GET /api/settings/:key** - Pobieranie konkretnego ustawienia po kluczu (dostępne dla wszystkich zalogowanych użytkowników)
- **PUT /api/settings/:key** - Aktualizacja konkretnego ustawienia (tylko dla użytkowników HR)

Ustawienia są przechowywane w tabeli `settings` z następującymi kluczami:
- `default_vacation_days` - domyślna liczba dni urlopowych w roku (liczba całkowita ≥ 0)
- `team_occupancy_threshold` - próg procentowy dla zajętości zespołu (liczba całkowita 0-100)

## 2. Szczegóły żądania

### GET /api/settings
- **Metoda HTTP**: GET
- **Struktura URL**: `/api/settings`
- **Parametry**: Brak
- **Request Body**: Brak
- **Autoryzacja**: Wszyscy zalogowani użytkownicy (EMPLOYEE, HR, ADMINISTRATOR)

### GET /api/settings/:key
- **Metoda HTTP**: GET
- **Struktura URL**: `/api/settings/:key`
- **Parametry**:
  - **Wymagane** (path): 
    - `key` (string) - Klucz ustawienia (np. "default_vacation_days", "team_occupancy_threshold")
- **Request Body**: Brak
- **Autoryzacja**: Wszyscy zalogowani użytkownicy (EMPLOYEE, HR, ADMINISTRATOR)

### PUT /api/settings/:key
- **Metoda HTTP**: PUT
- **Struktura URL**: `/api/settings/:key`
- **Parametry**:
  - **Wymagane** (path):
    - `key` (string) - Klucz ustawienia do aktualizacji
- **Request Body**:
```json
{
  "value": 28
}
```
- **Autoryzacja**: Tylko HR

**Walidacja wartości**:
- Dla `default_vacation_days`: liczba całkowita ≥ 0
- Dla `team_occupancy_threshold`: liczba całkowita 0-100
- Inne klucze: liczba całkowita ≥ 0 (domyślna walidacja)

## 3. Wykorzystywane typy

### Nowe DTOs (do dodania w src/types.ts):

```typescript
/**
 * Setting DTO
 * Represents a single global setting
 * Connected to: Database['public']['Tables']['settings']['Row']
 */
export interface SettingDTO {
  key: string;
  value: number;
  description: string | null;
  updatedAt: string; // ISO datetime
}

/**
 * Get all settings response DTO
 * Complete response with all settings
 */
export interface GetAllSettingsResponseDTO {
  data: SettingDTO[];
}

/**
 * Get setting by key response DTO
 * Response for single setting
 */
export interface GetSettingResponseDTO extends SettingDTO {}

/**
 * Update setting command DTO
 * Used by HR to update setting values
 */
export interface UpdateSettingDTO {
  value: number;
}

/**
 * Update setting response DTO
 * Returned after successful setting update
 */
export interface UpdateSettingResponseDTO extends SettingDTO {}
```

### Nowe Zod Schemas (do utworzenia w src/lib/schemas/settings.schema.ts):

```typescript
import { z } from "zod";

/**
 * Setting key path parameter validation
 */
export const settingKeyParamSchema = z.object({
  key: z.string().min(1, "Setting key cannot be empty"),
});

/**
 * Update setting request body validation
 * Value must be a non-negative integer
 */
export const updateSettingSchema = z.object({
  value: z.number()
    .int("Value must be an integer")
    .nonnegative("Value must be non-negative"),
});
```

### Typy z database.types.ts (istniejące):

```typescript
Database['public']['Tables']['settings']['Row']
Database['public']['Tables']['settings']['Update']
```

## 4. Szczegóły odpowiedzi

### GET /api/settings - Success (200 OK)
```json
{
  "data": [
    {
      "key": "default_vacation_days",
      "value": 26,
      "description": "Default number of vacation days per year",
      "updatedAt": "2026-01-01T00:00:00Z"
    },
    {
      "key": "team_occupancy_threshold",
      "value": 50,
      "description": "Percentage threshold for team occupancy (0-100)",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/settings/:key - Success (200 OK)
```json
{
  "key": "default_vacation_days",
  "value": 26,
  "description": "Default number of vacation days per year",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

### GET /api/settings/:key - Not Found (404)
```json
{
  "error": "Setting not found"
}
```

### PUT /api/settings/:key - Success (200 OK)
```json
{
  "key": "default_vacation_days",
  "value": 28,
  "description": "Default number of vacation days per year",
  "updatedAt": "2026-01-15T10:00:00Z"
}
```

### PUT /api/settings/:key - Bad Request (400)
```json
{
  "error": "Invalid request body",
  "details": {
    "value": ["Value must be an integer"]
  }
}
```

lub dla walidacji threshold:

```json
{
  "error": "Invalid value for team_occupancy_threshold: must be between 0 and 100"
}
```

### PUT /api/settings/:key - Forbidden (403)
```json
{
  "error": "Only HR users can update settings"
}
```

### PUT /api/settings/:key - Not Found (404)
```json
{
  "error": "Setting not found"
}
```

### Wszystkie endpointy - Internal Server Error (500)
```json
{
  "error": "Internal server error"
}
```

## 5. Przepływ danych

### GET /api/settings
```
1. Request → API Route (/api/settings/index.ts)
2. Walidacja autoryzacji (DEFAULT_USER_ID)
3. Service Layer (getAllSettings)
   ├─> Query: SELECT * FROM settings ORDER BY key
   └─> Map do SettingDTO (snake_case → camelCase, value: JSONB → number)
4. Response: GetAllSettingsResponseDTO (200 OK)

Error Flow:
├─> Błąd DB → 500 Internal Server Error
└─> Brak autentykacji → 401 Unauthorized (przyszła implementacja)
```

### GET /api/settings/:key
```
1. Request → API Route (/api/settings/[key].ts)
2. Walidacja path parameter (key) - Zod schema
3. Walidacja autoryzacji (DEFAULT_USER_ID)
4. Service Layer (getSettingByKey)
   ├─> Query: SELECT * FROM settings WHERE key = :key
   ├─> Check: czy setting istnieje
   └─> Map do SettingDTO
5. Response: GetSettingResponseDTO (200 OK)

Error Flow:
├─> Invalid key format → 400 Bad Request
├─> Setting nie istnieje → 404 Not Found
├─> Błąd DB → 500 Internal Server Error
└─> Brak autentykacji → 401 Unauthorized (przyszła implementacja)
```

### PUT /api/settings/:key
```
1. Request → API Route (/api/settings/[key].ts)
2. Walidacja path parameter (key) - Zod schema
3. Walidacja autoryzacji i pobranie roli użytkownika
4. Sprawdzenie uprawnień (tylko HR)
5. Parse i walidacja request body - Zod schema
6. Service Layer (updateSetting)
   ├─> Query: SELECT * FROM settings WHERE key = :key
   ├─> Check: czy setting istnieje
   ├─> Walidacja wartości specyficznej dla klucza:
   │   └─> team_occupancy_threshold: value musi być 0-100
   ├─> Update: UPDATE settings SET value = :value, updated_at = NOW() WHERE key = :key
   └─> Map do UpdateSettingResponseDTO
7. Response: UpdateSettingResponseDTO (200 OK)

Error Flow:
├─> Invalid key format → 400 Bad Request
├─> Invalid JSON body → 400 Bad Request
├─> Zod validation error → 400 Bad Request
├─> Threshold not 0-100 → 400 Bad Request
├─> User nie jest HR → 403 Forbidden
├─> Setting nie istnieje → 404 Not Found
├─> Błąd DB → 500 Internal Server Error
└─> Brak autentykacji → 401 Unauthorized (przyszła implementacja)
```

## 6. Względy bezpieczeństwa

### Uwierzytelnianie
- **Obecna implementacja**: Używamy `DEFAULT_USER_ID` ze stałej (development mode)
- **Przyszła implementacja**: Pełna autentykacja Supabase Auth
- **Endpoint**: Wszystkie endpointy wymagają autentykacji
- **Błąd**: 401 Unauthorized dla nieautentykowanych użytkowników

### Autoryzacja
- **GET /api/settings**: Wszyscy zalogowani użytkownicy (EMPLOYEE, HR, ADMINISTRATOR)
- **GET /api/settings/:key**: Wszyscy zalogowani użytkownicy (EMPLOYEE, HR, ADMINISTRATOR)
- **PUT /api/settings/:key**: Tylko HR
  - Weryfikacja: `currentUserRole === "HR"`
  - Błąd: 403 Forbidden dla non-HR users

### Walidacja danych wejściowych
- **Zod schemas**: Wszystkie parametry i body są walidowane przez Zod
- **Path parameter (key)**: Niepusty string
- **Request body (value)**: Liczba całkowita, nieujemna
- **Walidacja specyficzna dla klucza**:
  - `team_occupancy_threshold`: wartość 0-100
  - `default_vacation_days`: wartość ≥ 0
  - Dodatkowa walidacja w service layer

### Bezpieczeństwo bazy danych
- **Supabase Client**: Używamy `locals.supabase` z middleware
- **Parametryzowane zapytania**: Supabase automatycznie chroni przed SQL injection
- **Row Level Security**: Nie dotyczy (settings to tabela systemowa, authorization w API layer)

### JSONB Storage
- Wartości są przechowywane jako JSONB w bazie danych
- Walidacja typu: parsowanie i sprawdzenie czy wartość to number
- Zapisywanie: konwersja number → JSONB
- Odczyt: konwersja JSONB → number

## 7. Obsługa błędów

### 400 Bad Request
**Sytuacje**:
1. Invalid JSON w request body
   - Message: `"Invalid JSON in request body"`
2. Błędy walidacji Zod (path parameter)
   - Message: `"Invalid setting key format"`
   - Details: Zod error details
3. Błędy walidacji Zod (request body)
   - Message: `"Invalid request body"`
   - Details: Zod error details (np. "Value must be an integer")
4. Nieprawidłowa wartość dla team_occupancy_threshold
   - Message: `"Invalid value for team_occupancy_threshold: must be between 0 and 100"`

**Przykład**:
```json
{
  "error": "Invalid request body",
  "details": {
    "value": ["Value must be a non-negative integer"]
  }
}
```

### 401 Unauthorized
**Sytuacje**:
- Brak autentykacji (przyszła implementacja)

**Przykład**:
```json
{
  "error": "Not authenticated"
}
```

### 403 Forbidden
**Sytuacje**:
- User próbuje zaktualizować ustawienia bez roli HR

**Przykład**:
```json
{
  "error": "Only HR users can update settings"
}
```

### 404 Not Found
**Sytuacje**:
1. GET /api/settings/:key - setting o podanym kluczu nie istnieje
2. PUT /api/settings/:key - setting o podanym kluczu nie istnieje

**Przykład**:
```json
{
  "error": "Setting not found"
}
```

### 500 Internal Server Error
**Sytuacje**:
1. Błędy bazy danych (connection issues, query errors)
2. Nieoczekiwane błędy aplikacji
3. Błąd przy pobieraniu profilu użytkownika

**Logging**:
```typescript
console.error("[GET /api/settings] Error:", {
  timestamp: new Date().toISOString(),
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
});
```

**Przykład**:
```json
{
  "error": "Internal server error"
}
```

### Performance Monitoring
- Logowanie wolnych operacji (>1000ms):
```typescript
if (duration > 1000) {
  console.warn("[PUT /api/settings/:key] Slow operation:", {
    duration,
    key: settingKey,
  });
}
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje zapytań
- **GET /api/settings**: 
  - Pojedyncze zapytanie SELECT bez JOIN
  - ORDER BY key dla spójnego sortowania
  - Tabela settings jest mała (2-10 rekordów), więc performance nie jest problemem
  
- **GET /api/settings/:key**: 
  - Zapytanie z PRIMARY KEY (key)
  - Najszybsze możliwe zapytanie (O(1))
  
- **PUT /api/settings/:key**: 
  - UPDATE z PRIMARY KEY
  - Najszybsza możliwa aktualizacja (O(1))

### Monitoring wydajności
- Logowanie czasu wykonania wszystkich operacji
- Warning dla operacji > 1000ms
- Przykład:
```typescript
const startTime = Date.now();
const result = await updateSetting(locals.supabase, currentUserId, currentUserRole, key, validatedData);
const duration = Date.now() - startTime;

if (duration > 1000) {
  console.warn("[PUT /api/settings/:key] Slow operation:", {
    duration,
    key,
  });
}
```

### Potencjalne wąskie gardła
1. **JSONB parsing**: Konwersja JSONB ↔ number może być powolna dla dużych wartości
   - Mitigation: Nasze wartości to małe liczby całkowite, nie ma problemu
   
2. **Database connection**: Problemy z połączeniem do Supabase
   - Mitigation: Error handling + retry logic (przyszła implementacja)
   
3. **Concurrent updates**: Równoczesne aktualizacje tego samego ustawienia
   - Mitigation: PostgreSQL MVCC zapewnia isolation, ostatnia aktualizacja wygrywa

### Caching (przyszła optymalizacja)
- Settings zmieniają się rzadko, idealny kandydat do cachowania
- Możliwa implementacja: Redis lub in-memory cache
- Invalidacja cache: Po każdym UPDATE

### Nie jest potrzebne:
- Pagination: Tabela settings ma kilka rekordów
- Eager/lazy loading: Brak relacji z innymi tabelami
- Indexy: PRIMARY KEY (key) już jest zindeksowany

## 9. Etapy wdrożenia

### Krok 1: Dodanie typów DTO do src/types.ts
**Plik**: `src/types.ts`

Dodaj na końcu pliku (przed końcowym komentarzem):

```typescript
// ============================================================================
// Settings DTOs
// ============================================================================

/**
 * Setting DTO
 * Represents a single global setting
 * Connected to: Database['public']['Tables']['settings']['Row']
 */
export interface SettingDTO {
  key: string;
  value: number;
  description: string | null;
  updatedAt: string; // ISO datetime
}

/**
 * Get all settings response DTO
 * Complete response with all settings
 */
export interface GetAllSettingsResponseDTO {
  data: SettingDTO[];
}

/**
 * Get setting by key response DTO
 * Response for single setting
 */
export interface GetSettingResponseDTO extends SettingDTO {}

/**
 * Update setting command DTO
 * Used by HR to update setting values
 */
export interface UpdateSettingDTO {
  value: number;
}

/**
 * Update setting response DTO
 * Returned after successful setting update
 */
export interface UpdateSettingResponseDTO extends SettingDTO {}
```

### Krok 2: Utworzenie Zod schemas
**Plik**: `src/lib/schemas/settings.schema.ts` (nowy plik)

```typescript
/**
 * Zod validation schemas for settings endpoints
 *
 * Schemas for:
 * - GET /api/settings
 * - GET /api/settings/:key
 * - PUT /api/settings/:key
 */

import { z } from "zod";

/**
 * Setting key path parameter validation
 * Must be a non-empty string
 */
export const settingKeyParamSchema = z.object({
  key: z.string().min(1, "Setting key cannot be empty"),
});

/**
 * Update setting request body validation
 * Value must be a non-negative integer
 */
export const updateSettingSchema = z.object({
  value: z.number()
    .int("Value must be an integer")
    .nonnegative("Value must be non-negative"),
});
```

### Krok 3: Utworzenie service layer
**Plik**: `src/lib/services/settings.service.ts` (nowy plik)

```typescript
/**
 * Settings Service
 * Handles business logic for global settings operations
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type {
  GetAllSettingsResponseDTO,
  GetSettingResponseDTO,
  UpdateSettingDTO,
  UpdateSettingResponseDTO,
  SettingDTO,
} from "@/types";

/**
 * Helper function to map database row to DTO
 * Converts snake_case to camelCase and JSONB to number
 */
function mapToSettingDTO(row: {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
}): SettingDTO {
  // Parse JSONB value to number
  let numericValue: number;
  
  if (typeof row.value === "number") {
    numericValue = row.value;
  } else if (typeof row.value === "string") {
    numericValue = parseInt(row.value, 10);
    if (isNaN(numericValue)) {
      throw new Error(`Invalid numeric value for setting ${row.key}`);
    }
  } else {
    throw new Error(`Invalid value type for setting ${row.key}`);
  }

  return {
    key: row.key,
    value: numericValue,
    description: row.description,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all global settings
 *
 * @param supabase - Supabase client from context.locals
 * @returns Promise with all settings
 * @throws Error if database query fails
 */
export async function getAllSettings(
  supabase: SupabaseClient
): Promise<GetAllSettingsResponseDTO> {
  // Fetch all settings ordered by key
  const { data: settings, error: queryError } = await supabase
    .from("settings")
    .select("*")
    .order("key", { ascending: true });

  if (queryError) {
    console.error("[SettingsService] Failed to fetch settings:", queryError);
    throw new Error("Failed to fetch settings");
  }

  if (!settings || settings.length === 0) {
    // Return empty array if no settings found
    return { data: [] };
  }

  // Map to DTOs
  const settingsList: SettingDTO[] = settings.map(mapToSettingDTO);

  return { data: settingsList };
}

/**
 * Get specific setting by key
 *
 * @param supabase - Supabase client from context.locals
 * @param key - Setting key
 * @returns Promise with setting data
 * @throws Error if setting not found or query fails
 */
export async function getSettingByKey(
  supabase: SupabaseClient,
  key: string
): Promise<GetSettingResponseDTO> {
  // Fetch setting by primary key
  const { data: setting, error: queryError } = await supabase
    .from("settings")
    .select("*")
    .eq("key", key)
    .single();

  if (queryError) {
    // Check if error is "not found"
    if (queryError.code === "PGRST116") {
      throw new Error("Setting not found");
    }
    console.error("[SettingsService] Failed to fetch setting:", queryError);
    throw new Error("Failed to fetch setting");
  }

  if (!setting) {
    throw new Error("Setting not found");
  }

  // Map to DTO
  return mapToSettingDTO(setting);
}

/**
 * Update setting value
 * Only HR users can update settings
 * Additional validation for team_occupancy_threshold (must be 0-100)
 *
 * @param supabase - Supabase client from context.locals
 * @param currentUserId - ID of the current user (for RBAC)
 * @param currentUserRole - Role of the current user (for RBAC)
 * @param key - Setting key to update
 * @param data - Update data (value)
 * @returns Promise with updated setting
 * @throws Error if unauthorized, not found, invalid value, or query fails
 */
export async function updateSetting(
  supabase: SupabaseClient,
  currentUserId: string,
  currentUserRole: "ADMINISTRATOR" | "HR" | "EMPLOYEE",
  key: string,
  data: UpdateSettingDTO
): Promise<UpdateSettingResponseDTO> {
  // 1. Authorization: Only HR can update settings
  if (currentUserRole !== "HR") {
    throw new Error("Only HR users can update settings");
  }

  // 2. Check if setting exists
  const { data: existingSetting, error: fetchError } = await supabase
    .from("settings")
    .select("*")
    .eq("key", key)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      throw new Error("Setting not found");
    }
    console.error("[SettingsService] Failed to fetch setting:", fetchError);
    throw new Error("Failed to fetch setting");
  }

  if (!existingSetting) {
    throw new Error("Setting not found");
  }

  // 3. Additional validation based on setting key
  if (key === "team_occupancy_threshold") {
    if (data.value < 0 || data.value > 100) {
      throw new Error("Invalid value for team_occupancy_threshold: must be between 0 and 100");
    }
  }

  // 4. Update setting value
  const { data: updatedSetting, error: updateError } = await supabase
    .from("settings")
    .update({
      value: data.value,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key)
    .select("*")
    .single();

  if (updateError) {
    console.error("[SettingsService] Failed to update setting:", updateError);
    throw new Error("Failed to update setting");
  }

  if (!updatedSetting) {
    throw new Error("Failed to update setting");
  }

  // 5. Map to DTO and return
  return mapToSettingDTO(updatedSetting);
}
```

### Krok 4: Utworzenie GET /api/settings endpoint
**Plik**: `src/pages/api/settings/index.ts` (nowy plik)

```typescript
/**
 * GET /api/settings
 * Endpoint for retrieving all global settings
 *
 * Authorization: All authenticated users can view settings
 * - ADMINISTRATOR: Can view all settings
 * - HR: Can view all settings
 * - EMPLOYEE: Can view all settings
 *
 * NOTE: Using DEFAULT_USER_ID for development - full auth will be implemented later
 */

import type { APIRoute } from "astro";
import { getAllSettings } from "@/lib/services/settings.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET handler for /api/settings
 * Retrieves all global settings
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Use DEFAULT_USER_ID for development (auth will be implemented later)
    const currentUserId = DEFAULT_USER_ID;

    // 2. Verify user exists (basic authentication check)
    const { data: currentUserProfile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("id")
      .eq("id", currentUserId)
      .single();

    if (profileError || !currentUserProfile) {
      console.error("[GET /api/settings] Failed to fetch current user profile:", profileError);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Call service to get all settings
    const startTime = Date.now();
    const result = await getAllSettings(locals.supabase);
    const duration = Date.now() - startTime;

    // Log slow operations
    if (duration > 1000) {
      console.warn("[GET /api/settings] Slow operation:", { duration });
    }

    // 4. Return successful response (200 OK)
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/settings] Error:", {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Generic internal server error (500)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Krok 5: Utworzenie GET /api/settings/:key endpoint
**Plik**: `src/pages/api/settings/[key].ts` (nowy plik)

```typescript
/**
 * GET /api/settings/:key
 * PUT /api/settings/:key
 * Endpoints for managing specific global settings
 *
 * GET Authorization: All authenticated users can view settings
 * PUT Authorization: Only HR users can update settings
 *
 * NOTE: Using DEFAULT_USER_ID for development - full auth will be implemented later
 */

import type { APIRoute } from "astro";
import { getSettingByKey, updateSetting } from "@/lib/services/settings.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { settingKeyParamSchema, updateSettingSchema } from "@/lib/schemas/settings.schema";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET handler for /api/settings/:key
 * Retrieves specific setting by key
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate path parameter (key)
    const paramValidationResult = settingKeyParamSchema.safeParse(params);

    if (!paramValidationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid setting key format",
          details: paramValidationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { key } = paramValidationResult.data;

    // 2. Use DEFAULT_USER_ID for development (auth will be implemented later)
    const currentUserId = DEFAULT_USER_ID;

    // 3. Verify user exists (basic authentication check)
    const { data: currentUserProfile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("id")
      .eq("id", currentUserId)
      .single();

    if (profileError || !currentUserProfile) {
      console.error("[GET /api/settings/:key] Failed to fetch current user profile:", profileError);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Call service to get setting by key
    const startTime = Date.now();
    const result = await getSettingByKey(locals.supabase, key);
    const duration = Date.now() - startTime;

    // Log slow operations
    if (duration > 1000) {
      console.warn("[GET /api/settings/:key] Slow operation:", { duration, key });
    }

    // 5. Return successful response (200 OK)
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/settings/:key] Error:", {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle known error types
    if (error instanceof Error) {
      // Not found errors (404)
      if (error.message.includes("not found")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
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

/**
 * PUT handler for /api/settings/:key
 * Updates specific setting value (HR only)
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Validate path parameter (key)
    const paramValidationResult = settingKeyParamSchema.safeParse(params);

    if (!paramValidationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid setting key format",
          details: paramValidationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { key } = paramValidationResult.data;

    // 2. Use DEFAULT_USER_ID for development (auth will be implemented later)
    const currentUserId = DEFAULT_USER_ID;

    // 3. Get current user's role for authorization
    const { data: currentUserProfile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single();

    if (profileError || !currentUserProfile) {
      console.error("[PUT /api/settings/:key] Failed to fetch current user profile:", profileError);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentUserRole = currentUserProfile.role;

    // 4. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validationResult = updateSettingSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: validationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedData = validationResult.data;

    // 5. Call service to update setting
    const startTime = Date.now();
    const result = await updateSetting(
      locals.supabase,
      currentUserId,
      currentUserRole,
      key,
      validatedData
    );
    const duration = Date.now() - startTime;

    // Log slow operations
    if (duration > 1000) {
      console.warn("[PUT /api/settings/:key] Slow operation:", {
        duration,
        key,
      });
    }

    // 6. Return successful response (200 OK)
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[PUT /api/settings/:key] Error:", {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle known error types
    if (error instanceof Error) {
      // Authorization errors (403 Forbidden)
      if (error.message.includes("Only HR users")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Validation errors (400 Bad Request)
      if (error.message.includes("Invalid value for")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Not found errors (404)
      if (error.message.includes("not found")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
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

### Krok 6: Testowanie

#### Test GET /api/settings
```bash
# Get all settings
curl -X GET http://localhost:3000/api/settings

# Expected response (200 OK):
# {
#   "data": [
#     {
#       "key": "default_vacation_days",
#       "value": 26,
#       "description": "Default number of vacation days per year",
#       "updatedAt": "2026-01-01T00:00:00Z"
#     },
#     {
#       "key": "team_occupancy_threshold",
#       "value": 50,
#       "description": "Percentage threshold for team occupancy (0-100)",
#       "updatedAt": "2026-01-01T00:00:00Z"
#     }
#   ]
# }
```

#### Test GET /api/settings/:key
```bash
# Get specific setting
curl -X GET http://localhost:3000/api/settings/default_vacation_days

# Expected response (200 OK):
# {
#   "key": "default_vacation_days",
#   "value": 26,
#   "description": "Default number of vacation days per year",
#   "updatedAt": "2026-01-01T00:00:00Z"
# }

# Test not found
curl -X GET http://localhost:3000/api/settings/invalid_key

# Expected response (404 Not Found):
# {
#   "error": "Setting not found"
# }
```

#### Test PUT /api/settings/:key
```bash
# Update default_vacation_days (DEFAULT_USER_ID must be HR)
curl -X PUT http://localhost:3000/api/settings/default_vacation_days \
  -H "Content-Type: application/json" \
  -d '{"value": 28}'

# Expected response (200 OK):
# {
#   "key": "default_vacation_days",
#   "value": 28,
#   "description": "Default number of vacation days per year",
#   "updatedAt": "2026-01-15T10:00:00Z"
# }

# Test invalid threshold value
curl -X PUT http://localhost:3000/api/settings/team_occupancy_threshold \
  -H "Content-Type: application/json" \
  -d '{"value": 150}'

# Expected response (400 Bad Request):
# {
#   "error": "Invalid value for team_occupancy_threshold: must be between 0 and 100"
# }

# Test invalid body
curl -X PUT http://localhost:3000/api/settings/default_vacation_days \
  -H "Content-Type: application/json" \
  -d '{"value": "not a number"}'

# Expected response (400 Bad Request):
# {
#   "error": "Invalid request body",
#   "details": {
#     "value": ["Expected number, received string"]
#   }
# }

# Test not found
curl -X PUT http://localhost:3000/api/settings/invalid_key \
  -H "Content-Type: application/json" \
  -d '{"value": 30}'

# Expected response (404 Not Found):
# {
#   "error": "Setting not found"
# }
```

### Krok 7: Walidacja i poprawki

1. **Sprawdź logi aplikacji** pod kątem błędów
2. **Przetestuj wszystkie scenariusze błędów**:
   - Invalid JSON
   - Invalid values
   - Missing parameters
   - Authorization failures
   - Not found cases
3. **Sprawdź performance**:
   - Operacje powinny trwać < 100ms
   - Warning dla operacji > 1000ms
4. **Sprawdź security**:
   - Tylko HR może aktualizować ustawienia
   - Walidacja wartości threshold (0-100)
   - Brak możliwości SQL injection

### Krok 8: Dokumentacja

Zaktualizuj dokumentację API w `docs/API_EXAMPLES.md` lub stwórz nowy plik `docs/SETTINGS_API.md` z przykładami użycia wszystkich endpointów.

Przykładowa zawartość:

````markdown
# Settings API Documentation

## Overview
Global application settings management endpoints.

## Endpoints

### GET /api/settings
Get all global settings.

**Authorization**: All authenticated users

**Response (200 OK)**:
```json
{
  "data": [
    {
      "key": "default_vacation_days",
      "value": 26,
      "description": "Default number of vacation days per year",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/settings/:key
Get specific setting by key.

**Authorization**: All authenticated users

**Parameters**:
- `key` (path): Setting key

**Response (200 OK)**:
```json
{
  "key": "default_vacation_days",
  "value": 26,
  "description": "Default number of vacation days per year",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

### PUT /api/settings/:key
Update specific setting value.

**Authorization**: HR only

**Parameters**:
- `key` (path): Setting key

**Request Body**:
```json
{
  "value": 28
}
```

**Response (200 OK)**:
```json
{
  "key": "default_vacation_days",
  "value": 28,
  "description": "Default number of vacation days per year",
  "updatedAt": "2026-01-15T10:00:00Z"
}
```

## Available Settings

- `default_vacation_days`: Default vacation days per year (integer ≥ 0)
- `team_occupancy_threshold`: Team occupancy threshold percentage (integer 0-100)
````

## 10. Checklistaostateczna

Przed uznaniem implementacji za ukończoną, upewnij się, że:

- [ ] Wszystkie typy DTO zostały dodane do `src/types.ts`
- [ ] Utworzono `src/lib/schemas/settings.schema.ts` z walidacją Zod
- [ ] Utworzono `src/lib/services/settings.service.ts` z pełną logiką biznesową
- [ ] Utworzono `src/pages/api/settings/index.ts` (GET endpoint)
- [ ] Utworzono `src/pages/api/settings/[key].ts` (GET + PUT endpoints)
- [ ] Wszystkie endpointy zwracają poprawne kody statusu HTTP
- [ ] Implementacja error handling dla wszystkich scenariuszy
- [ ] Performance monitoring jest włączony (logging slow operations)
- [ ] Wszystkie endpointy są przetestowane ręcznie
- [ ] Authorization działa poprawnie (HR only dla PUT)
- [ ] Walidacja threshold (0-100) działa poprawnie
- [ ] JSONB parsing/storing działa poprawnie
- [ ] Dokumentacja API została zaktualizowana
- [ ] Brak błędów TypeScript w projekcie
- [ ] Brak błędów ESLint w projekcie
- [ ] Kod jest zgodny z coding guidelines projektu

## 11. Przyszłe usprawnienia

Poniższe funkcjonalności mogą być dodane w przyszłości:

1. **Full Authentication**: Zamienić `DEFAULT_USER_ID` na prawdziwą autentykację Supabase Auth
2. **Audit Logging**: Logowanie zmian ustawień do tabeli audit_logs
3. **Settings History**: Tabela przechowująca historię zmian wartości ustawień
4. **Caching**: Redis lub in-memory cache dla settings (invalidacja po UPDATE)
5. **Webhooks**: Powiadomienia o zmianach ustawień (np. email do adminów)
6. **Settings Validation Rules**: Możliwość definiowania custom validation rules per setting
7. **Settings UI**: Admin panel do zarządzania ustawieniami
8. **Settings Import/Export**: Możliwość eksportu/importu ustawień (backup/restore)
9. **Multi-tenancy**: Różne ustawienia dla różnych organizacji/tenantów
10. **Settings Descriptions i18n**: Tłumaczenia opisów ustawień na różne języki

