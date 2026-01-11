# API Endpoint Implementation Plan: Vacation Request Actions (Approve, Reject, Cancel)

## 1. Przegląd punktów końcowych

Ten plan obejmuje implementację trzech endpointów REST API do zarządzania statusem wniosków urlopowych:

### Approve Vacation Request
- **Cel**: Zatwierdzenie wniosku urlopowego przez HR z uwzględnieniem progu obłożenia zespołu
- **Dostęp**: Tylko dla użytkowników z rolą HR
- **Logika biznesowa**: 
  - Sprawdzenie czy wniosek ma status SUBMITTED
  - Obliczenie obłożenia zespołów użytkownika w okresie urlopu
  - Zwrócenie ostrzeżenia jeśli próg zostanie przekroczony
  - Wymuszenie potwierdzenia ostrzeżenia przed zatwierdzeniem
  - Aktualizacja statusu na APPROVED

### Reject Vacation Request
- **Cel**: Odrzucenie wniosku urlopowego przez HR z podaniem powodu
- **Dostęp**: Tylko dla użytkowników z rolą HR
- **Logika biznesowa**:
  - Sprawdzenie czy wniosek ma status SUBMITTED
  - Zapis powodu odrzucenia
  - Aktualizacja statusu na REJECTED

### Cancel Vacation Request
- **Cel**: Anulowanie wniosku urlopowego przez właściciela
- **Dostęp**: Tylko dla właściciela wniosku (EMPLOYEE)
- **Logika biznesowa**:
  - Sprawdzenie czy wniosek ma status SUBMITTED lub APPROVED
  - Weryfikacja czy urlop nie rozpoczął się więcej niż 1 dzień temu
  - Zwrot dni urlopowych do puli użytkownika
  - Aktualizacja statusu na CANCELLED

## 2. Szczegóły żądań

### POST /api/vacation-requests/:id/approve

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/vacation-requests/{uuid}/approve`
- **Parametry**:
  - **Wymagane**: 
    - `id` (path parameter) - UUID wniosku urlopowego
  - **Opcjonalne**: 
    - `acknowledgeThresholdWarning` (body) - boolean, domyślnie `false`, potwierdza akceptację przekroczenia progu
- **Request Body**:
```json
{
  "acknowledgeThresholdWarning": false
}
```
- **Headers**:
  - `Content-Type: application/json`

### POST /api/vacation-requests/:id/reject

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/vacation-requests/{uuid}/reject`
- **Parametry**:
  - **Wymagane**: 
    - `id` (path parameter) - UUID wniosku urlopowego
    - `reason` (body) - string, powód odrzucenia (1-500 znaków)
  - **Opcjonalne**: brak
- **Request Body**:
```json
{
  "reason": "Team capacity exceeded"
}
```
- **Headers**:
  - `Content-Type: application/json`

### POST /api/vacation-requests/:id/cancel

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/vacation-requests/{uuid}/cancel`
- **Parametry**:
  - **Wymagane**: 
    - `id` (path parameter) - UUID wniosku urlopowego
  - **Opcjonalne**: brak
- **Request Body**: brak (puste lub brak body)
- **Headers**:
  - `Content-Type: application/json` (opcjonalnie)

## 3. Wykorzystywane typy

### Nowe typy DTO do dodania w `src/types.ts`

```typescript
// ============================================================================
// Vacation Request Actions DTOs
// ============================================================================

/**
 * Approve vacation request command DTO
 * Used by HR to approve vacation requests with threshold warning acknowledgment
 */
export interface ApproveVacationRequestDTO {
  acknowledgeThresholdWarning?: boolean;
}

/**
 * Threshold warning DTO
 * Information about team occupancy threshold status
 */
export interface ThresholdWarningDTO {
  hasWarning: boolean;
  teamOccupancy: number;
  threshold: number;
  message: string;
}

/**
 * Approve vacation request response DTO
 * Returned after approval attempt (with or without warning)
 */
export interface ApproveVacationRequestResponseDTO {
  id: string;
  status: "APPROVED";
  processedByUserId: string;
  processedAt: string; // ISO datetime
  thresholdWarning: ThresholdWarningDTO | null;
}

/**
 * Reject vacation request command DTO
 * Used by HR to reject vacation requests with reason
 */
export interface RejectVacationRequestDTO {
  reason: string;
}

/**
 * Reject vacation request response DTO
 * Returned after successful rejection
 */
export interface RejectVacationRequestResponseDTO {
  id: string;
  status: "REJECTED";
  processedByUserId: string;
  processedAt: string; // ISO datetime
}

/**
 * Cancel vacation request response DTO
 * Returned after successful cancellation by employee
 */
export interface CancelVacationRequestResponseDTO {
  id: string;
  status: "CANCELLED";
  daysReturned: number;
  updatedAt: string; // ISO datetime
}
```

### Istniejące typy do wykorzystania

- `VacationRequestDetailsDTO` - do pobierania szczegółów wniosku
- `SupabaseClient` - typ klienta Supabase
- `Database` - typy bazy danych

### Nowe schematy walidacji w `src/lib/schemas/vacation-requests.schema.ts`

```typescript
/**
 * Schema for POST /api/vacation-requests/:id/approve body
 */
export const ApproveVacationRequestSchema = z.object({
  acknowledgeThresholdWarning: z.boolean().optional().default(false),
});

export type ApproveVacationRequestSchemaType = z.infer<
  typeof ApproveVacationRequestSchema
>;

/**
 * Schema for POST /api/vacation-requests/:id/reject body
 */
export const RejectVacationRequestSchema = z.object({
  reason: z
    .string()
    .min(1, "Reason is required")
    .max(500, "Reason must be at most 500 characters"),
});

export type RejectVacationRequestSchemaType = z.infer<
  typeof RejectVacationRequestSchema
>;

/**
 * Schema for vacation request ID parameter
 */
export const VacationRequestIdParamSchema = z.object({
  id: UuidSchema,
});

export type VacationRequestIdParamSchemaType = z.infer<
  typeof VacationRequestIdParamSchema
>;
```

## 4. Szczegóły odpowiedzi

### Approve Endpoint

**Success (200 OK) - Z ostrzeżeniem:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "APPROVED",
  "processedByUserId": "660e8400-e29b-41d4-a716-446655440000",
  "processedAt": "2026-01-11T14:30:00Z",
  "thresholdWarning": {
    "hasWarning": true,
    "teamOccupancy": 60.5,
    "threshold": 50,
    "message": "Approving this request will exceed the team occupancy threshold (60.5% > 50%)"
  }
}
```

**Success (200 OK) - Bez ostrzeżenia:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "APPROVED",
  "processedByUserId": "660e8400-e29b-41d4-a716-446655440000",
  "processedAt": "2026-01-11T14:30:00Z",
  "thresholdWarning": null
}
```

**Error Responses:**
- `400 Bad Request`: 
  ```json
  { "error": "Request must be in SUBMITTED status" }
  { "error": "You must acknowledge the threshold warning to approve this request" }
  { "error": "Invalid request body" }
  ```
- `401 Unauthorized`: 
  ```json
  { "error": "Not authenticated" }
  ```
- `403 Forbidden`: 
  ```json
  { "error": "Only HR can approve vacation requests" }
  { "error": "You are not authorized to approve this request" }
  ```
- `404 Not Found`: 
  ```json
  { "error": "Vacation request not found" }
  ```
- `500 Internal Server Error`: 
  ```json
  { "error": "Failed to approve vacation request" }
  ```

### Reject Endpoint

**Success (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "REJECTED",
  "processedByUserId": "660e8400-e29b-41d4-a716-446655440000",
  "processedAt": "2026-01-11T14:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: 
  ```json
  { "error": "Request must be in SUBMITTED status" }
  { "error": "Reason is required" }
  ```
- `401 Unauthorized`: 
  ```json
  { "error": "Not authenticated" }
  ```
- `403 Forbidden`: 
  ```json
  { "error": "Only HR can reject vacation requests" }
  { "error": "You are not authorized to reject this request" }
  ```
- `404 Not Found`: 
  ```json
  { "error": "Vacation request not found" }
  ```
- `500 Internal Server Error`: 
  ```json
  { "error": "Failed to reject vacation request" }
  ```

### Cancel Endpoint

**Success (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "CANCELLED",
  "daysReturned": 5,
  "updatedAt": "2026-01-11T14:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: 
  ```json
  { "error": "Only SUBMITTED or APPROVED requests can be cancelled" }
  { "error": "Cannot cancel vacation that started more than 1 day ago" }
  ```
- `401 Unauthorized`: 
  ```json
  { "error": "Not authenticated" }
  ```
- `403 Forbidden`: 
  ```json
  { "error": "You can only cancel your own vacation requests" }
  ```
- `404 Not Found`: 
  ```json
  { "error": "Vacation request not found" }
  ```
- `500 Internal Server Error`: 
  ```json
  { "error": "Failed to cancel vacation request" }
  ```

## 5. Przepływ danych

### Approve Vacation Request Flow

```
1. Astro API Route receives POST /api/vacation-requests/:id/approve
   ↓
2. Extract supabase client from context.locals
   ↓
3. Extract currentUserId (DEFAULT_USER_ID dla development)
   ↓
4. Validate request ID parameter (UuidSchema)
   ↓
5. Validate request body (ApproveVacationRequestSchema)
   ↓
6. Call approveVacationRequest(supabase, currentUserId, id, acknowledgeWarning)
   ↓
   SERVICE LAYER:
   6.1. Fetch current user's role from profiles table
   6.2. Verify user is HR (403 if not)
   6.3. Fetch vacation request by ID
   6.4. Check if request exists (404 if not)
   6.5. Check if user is owner of request (403 if yes - HR cannot approve own request)
   6.6. Verify HR is member of at least one team with request owner (check_common_team RPC)
        → 403 if no common team
   6.7. Check if request status is SUBMITTED (400 if not)
   6.8. Get user's teams (team_members table)
   6.9. For each team, calculate occupancy with get_team_occupancy RPC
        - Parameters: team_id, start_date, end_date from request
   6.10. Get team_occupancy_threshold from settings table
   6.11. Check if any team exceeds threshold
   6.12. If threshold exceeded and acknowledgeWarning = false:
         → Return 400 with threshold warning in response
   6.13. Update vacation_requests table:
         - status = 'APPROVED'
         - processed_by_user_id = currentUserId
         - processed_at = NOW()
   6.14. Build response with threshold warning info (if applicable)
   ↓
7. Return 200 OK with ApproveVacationRequestResponseDTO
   ↓
8. Error handling with appropriate status codes
```

### Reject Vacation Request Flow

```
1. Astro API Route receives POST /api/vacation-requests/:id/reject
   ↓
2. Extract supabase client from context.locals
   ↓
3. Extract currentUserId (DEFAULT_USER_ID dla development)
   ↓
4. Validate request ID parameter (UuidSchema)
   ↓
5. Validate request body (RejectVacationRequestSchema)
   ↓
6. Call rejectVacationRequest(supabase, currentUserId, id, reason)
   ↓
   SERVICE LAYER:
   6.1. Fetch current user's role from profiles table
   6.2. Verify user is HR (403 if not)
   6.3. Fetch vacation request by ID
   6.4. Check if request exists (404 if not)
   6.5. Check if user is owner of request (403 if yes - HR cannot reject own request)
   6.6. Verify HR is member of at least one team with request owner (check_common_team RPC)
        → 403 if no common team
   6.7. Check if request status is SUBMITTED (400 if not)
   6.8. Update vacation_requests table:
         - status = 'REJECTED'
         - processed_by_user_id = currentUserId
         - processed_at = NOW()
         Note: reason is stored in response but not in DB (no column for it currently)
   ↓
7. Return 200 OK with RejectVacationRequestResponseDTO
   ↓
8. Error handling with appropriate status codes
```

### Cancel Vacation Request Flow

```
1. Astro API Route receives POST /api/vacation-requests/:id/cancel
   ↓
2. Extract supabase client from context.locals
   ↓
3. Extract currentUserId (DEFAULT_USER_ID dla development)
   ↓
4. Validate request ID parameter (UuidSchema)
   ↓
5. Call cancelVacationRequest(supabase, currentUserId, id)
   ↓
   SERVICE LAYER:
   5.1. Fetch vacation request by ID with user info
   5.2. Check if request exists (404 if not)
   5.3. Verify current user is owner of request (403 if not)
   5.4. Check if request status is SUBMITTED or APPROVED (400 if not)
   5.5. Check cancellation time constraint:
        - If status = APPROVED, calculate days since start_date
        - If start_date is more than 1 day in the past, return 400
   5.6. Get business_days_count from request
   5.7. If status was APPROVED or SUBMITTED:
        - Find or create vacation_allowance record for current year
        - Return days to allowance (this is implicit - just cancel, days not deducted yet)
   5.8. Update vacation_requests table:
        - status = 'CANCELLED'
        - updated_at = NOW()
   5.9. Build response with daysReturned = business_days_count
   ↓
6. Return 200 OK with CancelVacationRequestResponseDTO
   ↓
7. Error handling with appropriate status codes
```

### Interakcje z bazą danych

**Tabele używane:**
- `profiles` - weryfikacja roli użytkownika, sprawdzenie deleted_at
- `vacation_requests` - fetch, update statusu
- `team_members` - weryfikacja członkostwa w zespole
- `settings` - pobranie team_occupancy_threshold
- `vacation_allowances` - (nie jest bezpośrednio modyfikowana, dni są zwracane przez brak dedukcji przy CANCELLED)

**Funkcje/RPC używane:**
- `check_common_team(user1_id, user2_id)` - sprawdzenie wspólnego zespołu
- `get_team_occupancy(team_id, start_date, end_date)` - obliczenie obłożenia zespołu

## 6. Względy bezpieczeństwa

### Uwierzytelnianie i Autoryzacja (RBAC)

1. **Approve & Reject Endpoints**:
   - Wymagana rola: HR
   - Sprawdzenie: `currentUser.role === 'HR'`
   - HR musi być członkiem co najmniej jednego wspólnego zespołu z właścicielem wniosku
   - HR nie może zatwierdzać/odrzucać własnych wniosków

2. **Cancel Endpoint**:
   - Dostępny dla wszystkich ról
   - Użytkownik może anulować tylko własne wnioski
   - Sprawdzenie: `vacationRequest.user_id === currentUserId`

3. **Authentication Status**:
   - Obecnie: używany jest DEFAULT_USER_ID (development mode)
   - Przyszłość: należy dodać middleware sprawdzające session token

### Walidacja danych wejściowych

1. **Parameter Validation**:
   - UUID format dla ID wniosku (Zod UuidSchema)
   - Odrzucenie nieprawidłowych UUID z kodem 400

2. **Body Validation**:
   - Approve: `acknowledgeThresholdWarning` musi być boolean
   - Reject: `reason` wymagany, 1-500 znaków
   - Cancel: brak body lub puste body

3. **Business Rules Validation**:
   - Status wniosku musi być odpowiedni dla danej akcji
   - Data rozpoczęcia urlopu dla cancel (nie więcej niż 1 dzień wstecz)
   - Threshold warning acknowledgment dla approve

### Zapobieganie Race Conditions

1. **Status Checking**:
   - Zawsze sprawdzać aktualny status przed aktualizacją
   - Używać transakcji bazodanowych gdzie to możliwe

2. **Atomic Operations**:
   - Single UPDATE z WHERE clause sprawdzającym status
   - Example: `UPDATE ... WHERE id = ? AND status = 'SUBMITTED'`
   - Jeśli rowCount = 0, znaczy że status się zmienił

### Ochrona przed nadużyciami

1. **Rate Limiting** (do rozważenia w przyszłości):
   - Limity na liczbę approve/reject/cancel w jednostce czasu

2. **Audit Trail**:
   - Zapisywanie `processed_by_user_id` i `processed_at`
   - Umożliwia śledzenie kto i kiedy wykonał akcję

3. **Soft Delete Awareness**:
   - Sprawdzanie `deleted_at IS NULL` dla użytkowników
   - Nie pozwalać na akcje na wniosku usuniętego użytkownika

### SQL Injection Prevention

- Używamy Supabase SDK, który automatycznie sanitizuje parametry
- Nie konstruujemy raw SQL queries w kodzie aplikacji

## 7. Obsługa błędów

### Approve Endpoint Error Scenarios

| Scenariusz | Kod | Komunikat | Warunek |
|-----------|-----|-----------|---------|
| Invalid UUID format | 400 | "Invalid vacation request ID format" | UUID validation fails |
| Invalid body | 400 | "Invalid request body" | Zod validation fails |
| Request not SUBMITTED | 400 | "Request must be in SUBMITTED status" | status !== 'SUBMITTED' |
| Threshold warning not acknowledged | 400 | "You must acknowledge the threshold warning to approve this request" | hasWarning && !acknowledgeWarning |
| Not authenticated | 401 | "Not authenticated" | No user session (future) |
| Not HR | 403 | "Only HR can approve vacation requests" | role !== 'HR' |
| Own request | 403 | "You cannot approve your own vacation request" | user_id === currentUserId |
| No common team | 403 | "You are not authorized to approve this request" | check_common_team returns false |
| Request not found | 404 | "Vacation request not found" | No record with given ID |
| Database error | 500 | "Failed to approve vacation request" | Any DB operation fails |
| Settings fetch error | 500 | "Failed to fetch system settings" | Cannot read threshold |
| Occupancy calculation error | 500 | "Failed to calculate team occupancy" | RPC call fails |

### Reject Endpoint Error Scenarios

| Scenariusz | Kod | Komunikat | Warunek |
|-----------|-----|-----------|---------|
| Invalid UUID format | 400 | "Invalid vacation request ID format" | UUID validation fails |
| Invalid body | 400 | "Reason is required" / "Reason must be at most 500 characters" | Zod validation fails |
| Request not SUBMITTED | 400 | "Request must be in SUBMITTED status" | status !== 'SUBMITTED' |
| Not authenticated | 401 | "Not authenticated" | No user session (future) |
| Not HR | 403 | "Only HR can reject vacation requests" | role !== 'HR' |
| Own request | 403 | "You cannot reject your own vacation request" | user_id === currentUserId |
| No common team | 403 | "You are not authorized to reject this request" | check_common_team returns false |
| Request not found | 404 | "Vacation request not found" | No record with given ID |
| Database error | 500 | "Failed to reject vacation request" | Any DB operation fails |

### Cancel Endpoint Error Scenarios

| Scenariusz | Kod | Komunikat | Warunek |
|-----------|-----|-----------|---------|
| Invalid UUID format | 400 | "Invalid vacation request ID format" | UUID validation fails |
| Invalid status | 400 | "Only SUBMITTED or APPROVED requests can be cancelled" | status not in ['SUBMITTED', 'APPROVED'] |
| Vacation started | 400 | "Cannot cancel vacation that started more than 1 day ago" | start_date < today - 1 day && status = APPROVED |
| Not authenticated | 401 | "Not authenticated" | No user session (future) |
| Not owner | 403 | "You can only cancel your own vacation requests" | user_id !== currentUserId |
| Request not found | 404 | "Vacation request not found" | No record with given ID |
| Database error | 500 | "Failed to cancel vacation request" | Any DB operation fails |

### Error Response Format

Wszystkie błędy zwracane w formacie:
```json
{
  "error": "Human-readable error message"
}
```

### Logging Strategy

1. **Console Errors** (development):
   ```typescript
   console.error("[ServiceName] Operation failed:", error);
   ```

2. **Error Context**:
   - Logować endpoint name, user ID, request ID
   - Nie logować wrażliwych danych (hasła, tokeny)

3. **Production Logging** (future):
   - Rozważyć integrację z zewnętrznym systemem logowania
   - Strukturyzowane logi JSON

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Team Occupancy Calculation**:
   - RPC `get_team_occupancy` wykonuje złożone zapytania z JOIN
   - Dla użytkowników w wielu zespołach wywoływane wielokrotnie
   - **Mitigation**: Caching threshold value, batch occupancy checks

2. **Multiple Database Calls**:
   - Approve endpoint: 6-10 zapytań do bazy danych
   - Każde zapytanie to round-trip do Supabase
   - **Mitigation**: Rozważyć stored procedure łączącą logikę

3. **check_common_team RPC**:
   - Wykonuje JOIN na team_members
   - Może być wolne dla dużych organizacji
   - **Mitigation**: Indeksy na team_members(user_id, team_id)

### Strategie optymalizacji

1. **Database Indexes**:
   - Istniejące indeksy na vacation_requests (status, user_id, dates) są wystarczające
   - Dodatkowy indeks: `team_members(user_id, team_id)` - już istnieje (UNIQUE constraint)

2. **Query Optimization**:
   - Używanie `.single()` zamiast `.limit(1)` dla single record queries
   - SELECT tylko potrzebnych kolumn

3. **Caching** (future):
   - Cache team_occupancy_threshold value (zmienia się rzadko)
   - Cache user role (ważność: duration of session)

4. **Parallel Execution**:
   - Przy sprawdzaniu wielu zespołów, rozważyć równoległe wywołania get_team_occupancy
   - Używać Promise.all() dla niezależnych operacji

5. **Pagination nie dotyczy**:
   - Pojedyncze operacje CRUD, brak list

### Monitoring Metrics

1. **Response Time**:
   - Target: < 500ms dla approve/reject/cancel
   - Alert jeśli > 2000ms

2. **Error Rate**:
   - Track 500 errors oddzielnie od 400/403/404
   - Alert jeśli error rate > 5%

3. **Threshold Warnings**:
   - Monitorować częstotliwość warnings
   - Może wskazywać na problemy z planowaniem urlopów

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie types.ts
**Czas: 15 min**
- [ ] Dodać nowe DTO types w sekcji "Vacation Request Actions DTOs"
- [ ] Dodać `ApproveVacationRequestDTO`
- [ ] Dodać `ThresholdWarningDTO`
- [ ] Dodać `ApproveVacationRequestResponseDTO`
- [ ] Dodać `RejectVacationRequestDTO`
- [ ] Dodać `RejectVacationRequestResponseDTO`
- [ ] Dodać `CancelVacationRequestResponseDTO`
- [ ] Sprawdzić błędy TypeScript

### Krok 2: Rozszerzenie vacation-requests.schema.ts
**Czas: 20 min**
- [ ] Dodać `ApproveVacationRequestSchema` z Zod
- [ ] Dodać `RejectVacationRequestSchema` z Zod
- [ ] Dodać `VacationRequestIdParamSchema` z Zod (jeśli nie istnieje)
- [ ] Export typów SchemaType dla każdego schematu
- [ ] Przetestować walidację z przykładowymi danymi

### Krok 3: Implementacja approveVacationRequest w service
**Czas: 2h**
- [ ] Otworzyć `src/lib/services/vacation-requests.service.ts`
- [ ] Dodać funkcję `approveVacationRequest(supabase, currentUserId, requestId, acknowledgeWarning)`
- [ ] Implementacja:
  - [ ] Fetch user role i weryfikacja HR
  - [ ] Fetch vacation request by ID
  - [ ] Check if request exists (throw 404)
  - [ ] Verify not own request (throw 403)
  - [ ] Verify common team with check_common_team RPC (throw 403)
  - [ ] Check status = SUBMITTED (throw 400)
  - [ ] Get user's teams from team_members
  - [ ] Fetch team_occupancy_threshold from settings
  - [ ] For each team, call get_team_occupancy RPC
  - [ ] Calculate max occupancy and check threshold
  - [ ] If threshold exceeded and !acknowledgeWarning, throw 400 with warning
  - [ ] Update vacation_requests: status=APPROVED, processed_by_user_id, processed_at
  - [ ] Build and return ApproveVacationRequestResponseDTO
- [ ] Dodać JSDoc comments
- [ ] Dodać error logging

### Krok 4: Implementacja rejectVacationRequest w service
**Czas: 1h**
- [ ] W tym samym pliku dodać funkcję `rejectVacationRequest(supabase, currentUserId, requestId, reason)`
- [ ] Implementacja:
  - [ ] Fetch user role i weryfikacja HR
  - [ ] Fetch vacation request by ID
  - [ ] Check if request exists (throw 404)
  - [ ] Verify not own request (throw 403)
  - [ ] Verify common team with check_common_team RPC (throw 403)
  - [ ] Check status = SUBMITTED (throw 400)
  - [ ] Update vacation_requests: status=REJECTED, processed_by_user_id, processed_at
  - [ ] Build and return RejectVacationRequestResponseDTO
  - [ ] Note: reason nie jest zapisywany w DB (brak kolumny), tylko zwracany w response
- [ ] Dodać JSDoc comments
- [ ] Dodać error logging

### Krok 5: Implementacja cancelVacationRequest w service
**Czas: 1.5h**
- [ ] W tym samym pliku dodać funkcję `cancelVacationRequest(supabase, currentUserId, requestId)`
- [ ] Implementacja:
  - [ ] Fetch vacation request by ID with user info
  - [ ] Check if request exists (throw 404)
  - [ ] Verify current user is owner (throw 403)
  - [ ] Check status in [SUBMITTED, APPROVED] (throw 400)
  - [ ] Calculate days since start_date
  - [ ] If APPROVED and start_date > 1 day ago, throw 400
  - [ ] Get business_days_count for return value
  - [ ] Update vacation_requests: status=CANCELLED, updated_at
  - [ ] Build and return CancelVacationRequestResponseDTO with daysReturned
- [ ] Dodać JSDoc comments
- [ ] Dodać error logging

### Krok 6: Utworzenie approve endpoint
**Czas: 1h**
- [ ] Utworzyć plik `src/pages/api/vacation-requests/[id]/approve.ts`
- [ ] Implementacja POST handler:
  - [ ] Extract supabase from context.locals
  - [ ] Extract currentUserId (DEFAULT_USER_ID)
  - [ ] Validate params.id z VacationRequestIdParamSchema
  - [ ] Parse request body
  - [ ] Validate body z ApproveVacationRequestSchema
  - [ ] Call approveVacationRequest service
  - [ ] Return 200 OK with response
  - [ ] Error handling:
    - [ ] 400 dla validation errors, status errors, threshold errors
    - [ ] 401 dla auth errors (future)
    - [ ] 403 dla permission errors
    - [ ] 404 dla not found errors
    - [ ] 500 dla database/server errors
- [ ] Dodać `export const prerender = false`
- [ ] Dodać JSDoc comments
- [ ] Test manually z curl/Postman

### Krok 7: Utworzenie reject endpoint
**Czas: 45 min**
- [ ] Utworzyć plik `src/pages/api/vacation-requests/[id]/reject.ts`
- [ ] Implementacja POST handler:
  - [ ] Extract supabase from context.locals
  - [ ] Extract currentUserId (DEFAULT_USER_ID)
  - [ ] Validate params.id z VacationRequestIdParamSchema
  - [ ] Parse request body
  - [ ] Validate body z RejectVacationRequestSchema
  - [ ] Call rejectVacationRequest service
  - [ ] Return 200 OK with response
  - [ ] Error handling (similar to approve)
- [ ] Dodać `export const prerender = false`
- [ ] Dodać JSDoc comments
- [ ] Test manually z curl/Postman

### Krok 8: Utworzenie cancel endpoint
**Czas: 45 min**
- [ ] Utworzyć plik `src/pages/api/vacation-requests/[id]/cancel.ts`
- [ ] Implementacja POST handler:
  - [ ] Extract supabase from context.locals
  - [ ] Extract currentUserId (DEFAULT_USER_ID)
  - [ ] Validate params.id z VacationRequestIdParamSchema
  - [ ] No body validation needed
  - [ ] Call cancelVacationRequest service
  - [ ] Return 200 OK with response
  - [ ] Error handling (similar to approve)
- [ ] Dodać `export const prerender = false`
- [ ] Dodać JSDoc comments
- [ ] Test manually z curl/Postman

### Krok 9: Testy integracyjne
**Czas: 2h**
- [ ] Utworzyć `tests/api/vacation-request-approve.test.sh`
  - [ ] Test: HR approves SUBMITTED request (no threshold exceeded)
  - [ ] Test: HR approves SUBMITTED request (threshold exceeded, with acknowledgment)
  - [ ] Test: HR tries to approve without acknowledgment (threshold exceeded)
  - [ ] Test: HR tries to approve APPROVED request (400)
  - [ ] Test: HR tries to approve own request (403)
  - [ ] Test: EMPLOYEE tries to approve (403)
  - [ ] Test: Invalid UUID (400)
  - [ ] Test: Non-existent request (404)
- [ ] Utworzyć `tests/api/vacation-request-reject.test.sh`
  - [ ] Test: HR rejects SUBMITTED request with reason
  - [ ] Test: HR tries to reject without reason (400)
  - [ ] Test: HR tries to reject APPROVED request (400)
  - [ ] Test: HR tries to reject own request (403)
  - [ ] Test: EMPLOYEE tries to reject (403)
  - [ ] Test: Invalid UUID (400)
  - [ ] Test: Non-existent request (404)
- [ ] Utworzyć `tests/api/vacation-request-cancel.test.sh`
  - [ ] Test: EMPLOYEE cancels own SUBMITTED request
  - [ ] Test: EMPLOYEE cancels own APPROVED request (before start)
  - [ ] Test: EMPLOYEE tries to cancel APPROVED request (after start + 1 day) (400)
  - [ ] Test: EMPLOYEE tries to cancel other user's request (403)
  - [ ] Test: EMPLOYEE tries to cancel REJECTED request (400)
  - [ ] Test: Invalid UUID (400)
  - [ ] Test: Non-existent request (404)
- [ ] Dodać testy do `tests/api/run-all.sh`
- [ ] Uruchomić pełny test suite: `./tests/api/run-all.sh`

### Krok 10: Dokumentacja API
**Czas: 30 min**
- [ ] Aktualizować `docs/API_EXAMPLES.md`
  - [ ] Dodać sekcję "Vacation Request Actions"
  - [ ] Przykłady curl dla approve endpoint
  - [ ] Przykłady curl dla reject endpoint
  - [ ] Przykłady curl dla cancel endpoint
  - [ ] Przykłady response dla każdego scenariusza
  - [ ] Opisać threshold warning mechanism
- [ ] Aktualizować README.md jeśli potrzebne

### Krok 11: Code review i refactoring
**Czas: 1h**
- [ ] Przejrzeć wszystkie pliki pod kątem:
  - [ ] Spójność konwencji nazewnictwa
  - [ ] Kompletność error handling
  - [ ] Jakość JSDoc comments
  - [ ] DRY principle (czy można wydzielić wspólną logikę?)
  - [ ] Type safety (czy wszystkie typy są prawidłowe?)
- [ ] Uruchomić linter: `npm run lint`
- [ ] Naprawić wszystkie problemy zgłoszone przez linter
- [ ] Sprawdzić błędy TypeScript: `npx tsc --noEmit`

### Krok 12: Testing edge cases
**Czas: 1h**
- [ ] Przetestować concurrent approvals tego samego wniosku
- [ ] Przetestować approve po cancel
- [ ] Przetestować cancel po approve
- [ ] Przetestować user w wielu zespołach (multiple threshold checks)
- [ ] Przetestować user bez zespołu
- [ ] Przetestować bardzo długie reason (500+ chars)
- [ ] Przetestować special characters w reason

### Krok 13: Final validation
**Czas: 30 min**
- [ ] Uruchomić wszystkie testy: `./tests/api/run-all.sh`
- [ ] Sprawdzić wszystkie endpointy są dostępne
- [ ] Zweryfikować format wszystkich responses
- [ ] Upewnić się że wszystkie error codes są prawidłowe
- [ ] Przejrzeć console logs pod kątem warnings

## Całkowity szacowany czas implementacji: ~12-14 godzin

## Uwagi dodatkowe

### Przyszłe usprawnienia

1. **Powód odrzucenia w bazie danych**:
   - Obecnie reason nie jest zapisywany w DB
   - Rozważyć dodanie kolumny `rejection_reason TEXT` do vacation_requests
   - Migration: `ALTER TABLE vacation_requests ADD COLUMN rejection_reason TEXT`

2. **Audit trail**:
   - Rozważyć tabelę audit_logs dla akcji approve/reject/cancel
   - Możliwość śledzenia historii zmian statusu

3. **Notyfikacje**:
   - Po approve/reject - powiadomienie email do użytkownika
   - Po cancel - powiadomienie email do HR

4. **Batch operations**:
   - Możliwość approve/reject wielu wniosków jednocześnie
   - Endpoint: POST /api/vacation-requests/batch/approve

5. **Business rules engine**:
   - Wydzielić reguły biznesowe do osobnego modułu
   - Łatwiejsza konfiguracja i testowanie

### Known limitations

1. **Soft-deleted users**:
   - Jeśli użytkownik jest soft-deleted, jego wnioski pozostają
   - Należy sprawdzać deleted_at w zapytaniach

2. **Time zones**:
   - Daty są przechowywane jako DATE bez timezone
   - "1 dzień temu" może być niejednoznaczne w różnych strefach czasowych

3. **Concurrent modifications**:
   - Brak optimistic locking
   - Możliwe race conditions przy równoczesnych approve/cancel

4. **Threshold calculation**:
   - Obliczane w czasie rzeczywistym przy każdym approve
   - Dla dużych organizacji może być wolne

### Zależności zewnętrzne

- Supabase RPC functions:
  - `check_common_team(uuid, uuid) → boolean`
  - `get_team_occupancy(uuid, date, date) → numeric`
  - `calculate_business_days(date, date) → integer` (dla cancel - zwrot dni)

- Database functions powinny być już zaimplementowane w migracjach

### Testowanie

- Wymagane dane testowe w bazie:
  - Co najmniej 2 użytkowników z rolą HR
  - Co najmniej 3 użytkowników z rolą EMPLOYEE
  - Co najmniej 2 zespoły
  - Przypisania użytkowników do zespołów
  - Vacation allowances dla wszystkich użytkowników
  - Kilka vacation requests w różnych statusach

### Deployment checklist

- [ ] Wszystkie migracje uruchomione
- [ ] RPC functions działają poprawnie
- [ ] Settings table ma team_occupancy_threshold
- [ ] Environment variables skonfigurowane
- [ ] Testy przechodzą na staging
- [ ] Dokumentacja API aktualna
- [ ] Monitoring skonfigurowany

