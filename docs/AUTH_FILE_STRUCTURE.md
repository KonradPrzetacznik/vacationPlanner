# Struktura plików - Moduł Uwierzytelniania

```
vacationPlanner/
├── src/
│   ├── components/
│   │   └── forms/
│   │       ├── LoginForm.tsx              ✅ NEW - Formularz logowania
│   │       ├── ForgotPasswordForm.tsx     ✅ NEW - Formularz odzyskiwania hasła
│   │       ├── SetPasswordForm.tsx        ✅ NEW - Formularz ustawiania hasła
│   │       └── SettingsForm.tsx           (existing)
│   │
│   ├── lib/
│   │   └── schemas/
│   │       ├── auth-form.schema.ts        ✅ NEW - Schematy walidacji auth
│   │       ├── users.schema.ts            (existing)
│   │       ├── teams.schema.ts            (existing)
│   │       └── settings-form.schema.ts    (existing)
│   │
│   ├── pages/
│   │   ├── login.astro                    ✅ NEW - Strona /login
│   │   ├── forgot-password.astro          ✅ NEW - Strona /forgot-password
│   │   ├── set-password.astro             ✅ NEW - Strona /set-password
│   │   │
│   │   ├── api/
│   │   │   └── auth/                      🔜 TODO - Endpointy API
│   │   │       ├── login.ts               (to be created)
│   │   │       ├── logout.ts              (to be created)
│   │   │       ├── forgot-password.ts     (to be created)
│   │   │       └── set-password.ts        (to be created)
│   │   │
│   │   ├── index.astro                    (existing)
│   │   ├── calendar.astro                 (existing)
│   │   ├── teams.astro                    (existing)
│   │   └── requests.astro                 (existing)
│   │
│   ├── layouts/
│   │   └── Layout.astro                   🔜 TODO - Dodać przyciski login/logout
│   │
│   ├── middleware/
│   │   └── index.ts                       🔜 TODO - Auth middleware
│   │
│   └── db/
│       └── supabase.client.ts             (existing)
│
└── docs/
    ├── AUTH_UI_IMPLEMENTATION.md          ✅ NEW - Dokumentacja implementacji
    ├── AUTH_UI_TESTING.md                 ✅ NEW - Instrukcje testowania
    └── AUTH_UI_COMPLETE.md                ✅ NEW - Podsumowanie i TODO
```

## Legenda

- ✅ NEW - Nowo utworzony plik (gotowy)
- 🔜 TODO - Do implementacji w następnym kroku
- (existing) - Istniejący plik w projekcie

## Zależności między plikami

```
┌─────────────────────────────────────────────────────────────┐
│                    STRONY ASTRO (SSR)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ↓                     ↓                     ↓
  login.astro       forgot-password.astro    set-password.astro
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│               KOMPONENTY REACT (Client-side)                 │
└─────────────────────────────────────────────────────────────┘
        │                     │                     │
        ↓                     ↓                     ↓
  LoginForm.tsx    ForgotPasswordForm.tsx    SetPasswordForm.tsx
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  SCHEMATY WALIDACJI (Zod)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
                   auth-form.schema.ts
                    ├── loginFormSchema
                    ├── forgotPasswordFormSchema
                    └── setPasswordFormSchema
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS (TODO)                      │
└─────────────────────────────────────────────────────────────┘
        │                     │                     │
        ↓                     ↓                     ↓
   POST /api/        POST /api/              POST /api/
   auth/login     auth/forgot-password   auth/set-password
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE AUTH (TODO)                      │
└─────────────────────────────────────────────────────────────┘
```

## Przepływ danych

### 1. Login Flow
```
User Input → LoginForm (client)
           → Zod Validation (auth-form.schema)
           → POST /api/auth/login (TODO)
           → Supabase Auth (TODO)
           → Session Cookie
           → Redirect /
```

### 2. Forgot Password Flow
```
User Input → ForgotPasswordForm (client)
           → Zod Validation (auth-form.schema)
           → POST /api/auth/forgot-password (TODO)
           → Supabase Send Email (TODO)
           → User clicks link in email
           → /set-password?token=...
```

### 3. Set Password Flow
```
Token from URL → SetPasswordForm (client)
User Input     → Zod Validation (auth-form.schema)
               → POST /api/auth/set-password (TODO)
               → Supabase Verify & Update (TODO)
               → Redirect /login
```

## Komponenty UI używane (shadcn/ui)

Wszystkie formularze wykorzystują:
- ✅ Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- ✅ Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription
- ✅ Input (type="email", type="password")
- ✅ Button
- ✅ Toast (Sonner)

## Stan implementacji

| Komponent | Status | Testy | Dokumentacja |
|-----------|--------|-------|--------------|
| LoginForm | ✅ | 🔜 | ✅ |
| ForgotPasswordForm | ✅ | 🔜 | ✅ |
| SetPasswordForm | ✅ | 🔜 | ✅ |
| auth-form.schema | ✅ | 🔜 | ✅ |
| login.astro | ✅ | 🔜 | ✅ |
| forgot-password.astro | ✅ | 🔜 | ✅ |
| set-password.astro | ✅ | 🔜 | ✅ |
| API endpoints | 🔜 | 🔜 | ✅ |
| Middleware | 🔜 | 🔜 | ✅ |
| Supabase config | 🔜 | 🔜 | ✅ |

## Następne kroki

1. ✅ UI Implementation - **COMPLETED**
2. 🔜 Backend API - **NEXT**
3. 🔜 Middleware & Auth Guards
4. 🔜 Supabase Configuration
5. 🔜 Integration Testing
6. 🔜 E2E Testing
