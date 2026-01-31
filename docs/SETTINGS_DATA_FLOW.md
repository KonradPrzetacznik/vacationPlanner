# Przepływ danych - Widok Ustawienia

## Diagram architektury

```
┌─────────────────────────────────────────────────────────────────┐
│                         UŻYTKOWNIK                              │
│                    (ADMINISTRATOR lub HR)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PRZEGLĄDARKA                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /admin/settings (URL)                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP GET
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ASTRO MIDDLEWARE                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Sprawdza ścieżkę: /admin/*                           │  │
│  │  2. Pobiera profil użytkownika (DEFAULT_USER_ID)         │  │
│  │  3. Weryfikuje rolę: ADMINISTRATOR lub HR                │  │
│  │  4. ✅ Przepuszcza lub ❌ 403 Forbidden                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Authorized
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              ASTRO PAGE (settings.astro - SSR)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Wywołuje fetch GET /api/settings                     │  │
│  │  2. Otrzymuje SettingsDTO[]                              │  │
│  │  3. Transformuje do SettingsFormValues                   │  │
│  │  4. Renderuje Layout + SettingsForm                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTML + initial data
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PRZEGLĄDARKA (HTML)                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Layout.astro                                            │  │
│  │  ├── Header, styles, meta                                │  │
│  │  └── <body>                                              │  │
│  │      ├── Nagłówek strony                                 │  │
│  │      ├── <SettingsForm client:load>                     │  │
│  │      │   └── SSR rendered form with values              │  │
│  │      └── <Toaster client:load>                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ JavaScript loads
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              REACT HYDRATION (SettingsForm)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. useForm + zodResolver inicjalizuje                   │  │
│  │  2. Defaultowe wartości z props                          │  │
│  │  3. Form staje się interaktywny                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ Użytkownik edytuje
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WALIDACJA KLIENTA                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  react-hook-form + Zod Schema                            │  │
│  │  ├── onChange: parsowanie string → number               │  │
│  │  ├── onBlur: walidacja pola                             │  │
│  │  └── Wyświetlanie błędów pod polami                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ Klik "Zapisz"
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SUBMIT FORMULARZA (onSubmit)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Walidacja całego formularza                          │  │
│  │  2. ✅ Valid → przejdź dalej                             │  │
│  │  3. ❌ Invalid → pokaż błędy, STOP                       │  │
│  │  4. setIsSubmitting(true) → Disable button              │  │
│  │  5. Transformacja: SettingsFormValues → SettingsDTO[]   │  │
│  │     [                                                    │  │
│  │       {key: "default_vacation_days", value: 28},        │  │
│  │       {key: "team_occupancy_threshold", value: 80}      │  │
│  │     ]                                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ fetch POST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              API ENDPOINT (POST /api/settings)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Pobiera profil użytkownika (DEFAULT_USER_ID)         │  │
│  │  2. Parse request body                                   │  │
│  │  3. Walidacja Zod schema (array of {key, value})        │  │
│  │  4. ❌ Invalid → 400 Bad Request                         │  │
│  │  5. ✅ Valid → iteruj po każdym ustawieniu              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ For each setting
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            SETTINGS SERVICE (updateSetting)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Sprawdza rolę: ADMINISTRATOR lub HR                  │  │
│  │     ❌ Inna → throw "Unauthorized"                       │  │
│  │  2. Sprawdza czy ustawienie istnieje                     │  │
│  │     ❌ Nie → throw "Setting not found"                   │  │
│  │  3. Walidacja wartości:                                  │  │
│  │     • default_vacation_days: 1-365                       │  │
│  │     • team_occupancy_threshold: 0-100                    │  │
│  │     ❌ Invalid → throw "Invalid value..."                │  │
│  │  4. ✅ Update w bazie Supabase                           │  │
│  │  5. Return updated SettingDTO                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Dla każdego ustawienia
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (Database)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  UPDATE settings                                         │  │
│  │  SET value = $1, updated_at = NOW()                      │  │
│  │  WHERE key = $2                                          │  │
│  │  RETURNING *                                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Updated rows
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              API ENDPOINT - Response                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Collect all updated settings                            │  │
│  │  Return 200 OK + {data: SettingDTO[]}                    │  │
│  │                                                           │  │
│  │  Lub w przypadku błędu:                                  │  │
│  │  • 400 → Walidacja                                       │  │
│  │  • 403 → Unauthorized                                    │  │
│  │  • 404 → Not found                                       │  │
│  │  • 500 → Server error                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ JSON response
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              REACT (SettingsForm - onSubmit)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  if (response.ok) {                                      │  │
│  │    1. Parse JSON → {data: SettingDTO[]}                 │  │
│  │    2. Transformacja → SettingsFormValues                 │  │
│  │    3. form.reset(updatedSettings) → Sync form state     │  │
│  │    4. toast.success("Zapisano!")                         │  │
│  │  } else {                                                │  │
│  │    1. Parse error message                                │  │
│  │    2. toast.error(message)                               │  │
│  │  }                                                       │  │
│  │  3. setIsSubmitting(false) → Enable button              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ UI Update
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRZEGLĄDARKA (Updated)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ✅ Toast notification (zielony)                         │  │
│  │  ✅ Button enabled                                       │  │
│  │  ✅ Form values updated                                  │  │
│  │                                                           │  │
│  │  Lub w przypadku błędu:                                  │  │
│  │  ❌ Toast error (czerwony)                               │  │
│  │  ❌ Button enabled                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Przepływ danych - szczegóły

### 1. Initial Load (GET)
```
User → /admin/settings
  → Middleware: Auth check (ADMINISTRATOR/HR)
    → settings.astro: SSR
      → fetch GET /api/settings
        → Service: getAllSettings()
          → Supabase: SELECT * FROM settings
        ← SettingsDTO[]
      ← Transform to SettingsFormValues
    ← Render HTML + props
  ← HTML with SSR form
← React hydrates (client:load)
```

### 2. Form Interaction (Client-side)
```
User types in input
  → onChange: string → parseInt() → number
  → onBlur: Zod validation
    → Valid: no error
    → Invalid: show FormMessage under field
```

### 3. Form Submit (POST)
```
User clicks "Zapisz"
  → onSubmit triggered
    → Validate entire form (Zod)
      → Invalid: show errors, STOP
      → Valid: continue
    → setIsSubmitting(true)
    → Transform data: SettingsFormValues → SettingsDTO[]
    → fetch POST /api/settings
      → Middleware: Auth check
        → API: Parse body
          → Zod validation
            → Invalid: return 400
            → Valid: continue
          → For each setting:
            → Service: updateSetting()
              → Check role (ADMINISTRATOR/HR)
              → Check exists
              → Validate value range
              → Supabase: UPDATE settings
            ← SettingDTO
          ← {data: SettingDTO[]}
        ← 200 OK or error
      ← Response
    → Handle response
      → Success: toast.success + form.reset
      → Error: toast.error
    → setIsSubmitting(false)
```

## Transformacje danych

### API → Form (Initial Load)
```typescript
// API Response
SettingsDTO[] = [
  { key: "default_vacation_days", value: 26, ... },
  { key: "team_occupancy_threshold", value: 75, ... }
]

// Transformacja w settings.astro
SettingsFormValues = {
  default_vacation_days: 26,
  team_occupancy_threshold: 75
}
```

### Form → API (Submit)
```typescript
// Form Values
SettingsFormValues = {
  default_vacation_days: 28,
  team_occupancy_threshold: 80
}

// Transformacja w SettingsForm.onSubmit
SettingsDTO[] = [
  { key: "default_vacation_days", value: 28 },
  { key: "team_occupancy_threshold", value: 80 }
]
```

## Poziomy walidacji

### 1. Browser (HTML5)
```html
<input type="number" />
<!-- Blokuje wpisywanie liter -->
```

### 2. React (onChange)
```typescript
onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
// Konwersja string → number
```

### 3. Zod Schema (Client)
```typescript
z.number()
  .int("Musi być liczbą całkowitą")
  .min(1, "Min 1")
  .max(365, "Max 365")
// Walidacja z komunikatami
```

### 4. Zod Schema (API)
```typescript
z.array(
  z.object({
    key: z.string(),
    value: z.number()
  })
)
// Walidacja struktury
```

### 5. Service (Business Logic)
```typescript
if (key === "default_vacation_days") {
  if (value < 1 || value > 365) {
    throw new Error("Invalid value: must be 1-365");
  }
}
// Walidacja zakresu
```

## Obsługa błędów - przepływ

```
Error source → Handler → User feedback

1. Network Error
   → catch in onSubmit
   → toast.error("Błąd połączenia")

2. Validation Error (Client)
   → Zod validation
   → FormMessage under field

3. API Error (400)
   → Parse error message
   → toast.error(message)

4. Authorization Error (403)
   → API returns 403
   → toast.error("Brak uprawnień")

5. Not Found (404)
   → API returns 404
   → toast.error("Ustawienie nie znalezione")

6. Server Error (500)
   → API returns 500
   → toast.error("Błąd serwera")
```

## Stan UI w czasie

```
Time →

T0: Initial Load
    [Loading...] (settings.astro fetch)
    
T1: Rendered
    Form: [26] [75]
    Button: [Zapisz ustawienia]
    
T2: User edits
    Form: [28] [75]  ← changed
    Validation: ✅ OK
    
T3: User clicks submit
    Form: [28] [75]
    Button: [Zapisywanie...] (disabled)
    
T4: API processing
    Form: [28] [75]
    Button: [Zapisywanie...] (disabled)
    Loading indicator visible
    
T5: Success response
    Form: [28] [75]
    Button: [Zapisz ustawienia] (enabled)
    Toast: "✅ Zapisano!"
    
T6: Toast auto-hide
    Form: [28] [75]
    Button: [Zapisz ustawienia] (enabled)
    Toast: (hidden)
```
