# Architektura UI - VacationPlanner MVP

## 1. Przegląd architektury

### 1.1. Założenia kluczowe
- **Framework**: Astro 5 ze statycznymi komponentami + React 19 dla interaktywności
- **Stylowanie**: Tailwind CSS 4
- **Biblioteka komponentów**: Shadcn/ui
- **Zarządzanie stanem API**: React Query (TanStack Query)
- **Dostępność**: WCAG 2.1 Level AA
- **Responsywność**: Mobile-first approach (320px - 1920px+)
- **Język interfejsu**: Polski

### 1.2. Struktura nawigacji według ról

#### ADMINISTRATOR
- **Dashboard** - statystyki użytkowników, ostatnie aktywności
- **Użytkownicy** - zarządzanie kontami użytkowników

#### HR
- **Dashboard** - przegląd oczekujących wniosków, statystyki zespołów
- **Wnioski urlopowe** - lista i zarządzanie wnioskami
- **Zespoły** - zarządzanie zespołami i członkami
- **Kalendarz** - widok zbiorczy urlopów
- **Ustawienia** - konfiguracja systemu

#### EMPLOYEE
- **Dashboard** - przegląd własnych dni urlopowych, najbliższe urlopy zespołu
- **Mój urlop** - pula dni, lista wniosków, składanie wniosków
- **Kalendarz zespołu** - widok urlopów w zespole

## 2. Mapa stron i routing

### 2.1. Publiczne (niezalogowane)
```
/login                    - Formularz logowania
/forgot-password          - Resetowanie hasła (out of scope MVP)
```

### 2.2. Wymagające autoryzacji
```
/change-password          - Wymuszana zmiana hasła (wszystkie role)
/                         - Dashboard (przekierowanie do właściwego dashboardu)

# ADMINISTRATOR
/admin/dashboard          - Dashboard administratora
/admin/users              - Lista użytkowników
/admin/users/new          - Dodawanie użytkownika
/admin/users/:id/edit     - Edycja użytkownika

# HR
/hr/dashboard             - Dashboard HR
/hr/vacation-requests     - Lista wniosków urlopowych
/hr/vacation-requests/:id - Szczegóły wniosku
/hr/teams                 - Lista zespołów
/hr/teams/new             - Tworzenie zespołu
/hr/teams/:id             - Szczegóły zespołu
/hr/teams/:id/edit        - Edycja zespołu
/hr/calendar              - Kalendarz zbiorczy
/hr/settings              - Ustawienia systemu

# EMPLOYEE
/employee/dashboard       - Dashboard pracownika
/employee/vacation        - Mój urlop (lista wniosków + pula dni)
/employee/vacation/new    - Składanie wniosku
/employee/calendar        - Kalendarz zespołu
```

## 3. Komponenty wspólne (Shared)

### 3.1. Layout Components

#### MainLayout.astro
- **Opis**: Główny layout aplikacji
- **Zawiera**:
  - TopBar z Navigation Menu (Shadcn/ui)
  - Breadcrumbs
  - Main content area
  - Footer (opcjonalnie)
- **Props**: `title`, `role`

#### AuthLayout.astro
- **Opis**: Layout dla stron publicznych (login, forgot password)
- **Zawiera**:
  - Centered card container
  - Logo aplikacji
  - Footer z informacjami

### 3.2. Navigation Components

#### TopBar.tsx (React)
- **Opis**: Główna nawigacja wykorzystująca Navigation Menu z Shadcn/ui
- **Features**:
  - Logo aplikacji (po lewej)
  - Menu główne (dynamiczne według roli)
  - User dropdown (po prawej): profil, wyloguj
  - Mobile hamburger menu
- **Dostępność**: 
  - ARIA landmarks (`role="navigation"`)
  - Keyboard navigation (Tab, Arrow keys)
  - Focus visible states
  - Skip to main content link

#### Breadcrumbs.tsx (React)
- **Opis**: Ścieżka nawigacji
- **Shadcn/ui**: Breadcrumb component
- **Dostępność**: `aria-label="breadcrumb"`

### 3.3. UI Components (Shadcn/ui)

#### Formularze
- **Input** - pola tekstowe
- **Select** - dropdown listy
- **DatePicker** - wybór dat (z blokowaniem weekendów)
- **Checkbox** - zaznaczenia
- **RadioGroup** - wybór opcji
- **Form** - wrapper z walidacją (React Hook Form + Zod)
- **Label** - etykiety pól

#### Feedback
- **Toast** - notyfikacje (sukces, błąd, info, ostrzeżenie)
- **Dialog/Modal** - okna modalne (confirmation, alerts)
- **Alert** - inline komunikaty
- **Skeleton** - loading states
- **Progress** - paski postępu

#### Nawigacja i organizacja
- **Tabs** - zakładki (wnioski urlopowe, statusy)
- **Table** - tabele danych (lista użytkowników, wniosków)
- **Pagination** - stronicowanie
- **Card** - kontenery treści
- **Badge** - oznaczenia statusów

#### Inne
- **Button** - przyciski (variants: default, destructive, outline, ghost)
- **Dropdown Menu** - menu kontekstowe
- **Separator** - separatory wizualne
- **Tooltip** - podpowiedzi

### 3.4. Custom Components

#### LoadingState.tsx
- **Opis**: Uniwersalny komponent ładowania
- **Variants**: 
  - `skeleton-table` - skeleton dla tabel
  - `skeleton-form` - skeleton dla formularzy
  - `skeleton-card` - skeleton dla kart
  - `spinner` - spinner dla inline loading

#### ErrorBoundary.tsx
- **Opis**: React Error Boundary z opcją retry
- **Features**:
  - Wyświetlanie przyjaznych komunikatów błędów
  - Przycisk "Spróbuj ponownie"
  - Logowanie błędów (console.error)

#### ConfirmDialog.tsx
- **Opis**: Modal potwierdzenia krytycznych akcji
- **Props**: `title`, `description`, `confirmText`, `cancelText`, `variant` (danger/warning)
- **Usage**: Usuwanie użytkownika, anulowanie urlopu

#### StatusBadge.tsx
- **Opis**: Kolorowe oznaczenie statusów wniosków
- **Statusy**:
  - `SUBMITTED` - niebieski
  - `APPROVED` - zielony
  - `REJECTED` - czerwony
  - `CANCELLED` - szary

#### VacationDaysCounter.tsx
- **Opis**: Wizualizacja dostępnych dni urlopowych
- **Features**:
  - Główny licznik (suma)
  - Breakdown: dni bieżące vs zaległe
  - Progress bar wizualizujący wykorzystanie
  - Ostrzeżenie o wygasających dniach (do 31.03)

## 4. Widoki szczegółowe według ról

### 4.1. ADMINISTRATOR

#### /admin/dashboard
**Komponent**: `AdminDashboard.astro` + `DashboardStats.tsx` (React)

**Sekcje**:
1. **Statystyki** (Cards)
   - Liczba użytkowników (aktywnych/usuniętych)
   - Liczba administratorów/HR/pracowników
   - Ostatnio dodani użytkownicy (5)

2. **Ostatnie aktywności** (Table)
   - Lista ostatnich zmian (dodanie/edycja/usunięcie użytkowników)
   - Kolumny: Akcja, Użytkownik, Data, Wykonujący

**API Calls**:
- `GET /api/users?limit=5&offset=0`
- Statystyki agregowane lokalnie lub przez dedykowany endpoint

#### /admin/users
**Komponent**: `UsersList.astro` + `UsersTable.tsx` (React)

**Features**:
1. **Nagłówek**
   - Przycisk "Dodaj użytkownika"
   - Wyszukiwarka (filter po email/imieniu/nazwisku)
   
2. **Filtry**
   - Select: Rola (wszystkie/ADMINISTRATOR/HR/EMPLOYEE)
   - Checkbox: "Pokaż usuniętych"

3. **Tabela** (Shadcn/ui Table)
   - Kolumny: Imię, Nazwisko, Email, Rola, Status, Akcje
   - Sortowanie: wszystkie kolumny
   - Akcje: Edytuj, Usuń (soft-delete)
   - Usunięci użytkownicy: wyszarzeni, badge "Usunięty"

4. **Paginacja** (Shadcn/ui Pagination)
   - 50 użytkowników na stronę

**API Calls**:
- `GET /api/users?limit=50&offset=0&includeDeleted=true&role=EMPLOYEE`

**Dostępność**:
- `aria-label` dla przycisków akcji
- `role="table"` z odpowiednimi nagłówkami
- Keyboard navigation dla wierszy

#### /admin/users/new + /admin/users/:id/edit
**Komponent**: `UserForm.tsx` (React)

**Formularz** (React Hook Form + Zod):
- Imię (required, min 2 chars)
- Nazwisko (required, min 2 chars)
- Email (required, valid email, unique) - disabled w trybie edycji
- Rola (Select: ADMINISTRATOR/HR/EMPLOYEE) - disabled dla własnej roli
- Hasło tymczasowe (required tylko dla new, min 8 chars)

**Walidacja**:
- Real-time validation z Zod schema
- Error messages pod polami
- Disabled submit button podczas walidacji

**API Calls**:
- `POST /api/users` (new)
- `PATCH /api/users/:id` (edit)
- `GET /api/users/:id` (edit - initial data)

**Success flow**:
- Toast notification "Użytkownik został dodany/zaktualizowany"
- Redirect do `/admin/users`

### 4.2. HR

#### /hr/dashboard
**Komponent**: `HRDashboard.astro` + `HRDashboardContent.tsx` (React)

**Sekcje**:
1. **Kluczowe metryki** (Cards Grid)
   - Oczekujące wnioski (liczba)
   - Zespoły (liczba)
   - Pracownicy na urlopie dzisiaj (liczba)

2. **Oczekujące wnioski** (Compact Table)
   - 5 najnowszych wniosków do zaakceptowania
   - Quick actions: Akceptuj/Odrzuć inline
   - Link "Zobacz wszystkie wnioski"

3. **Kalendarz zespołów** (Mini preview)
   - Widok bieżącego tygodnia dla wszystkich zespołów
   - Link "Zobacz pełny kalendarz"

**API Calls**:
- `GET /api/vacation-requests?status=SUBMITTED&limit=5`
- `GET /api/teams?includeMemberCount=true`
- Statystyki agregowane

#### /hr/vacation-requests
**Komponent**: `VacationRequestsList.astro` + `VacationRequestsTable.tsx` (React)

**Features**:
1. **Zakładki** (Shadcn/ui Tabs)
   - Oczekujące (SUBMITTED)
   - Zaakceptowane (APPROVED)
   - Odrzucone (REJECTED)
   - Anulowane (CANCELLED)

2. **Filtry** (Dropdown/Select)
   - Zespół (wszystkie/wybór z listy)
   - Okres (data od-do)
   - Pracownik (autocomplete)

3. **Tabela**
   - Kolumny: Pracownik, Zespół, Data od, Data do, Dni robocze, Status, Data złożenia, Akcje
   - Akcje (dla SUBMITTED): Akceptuj, Odrzuć
   - Akcje (dla innych): Zobacz szczegóły
   - StatusBadge dla statusów

4. **Paginacja**
   - 50 wniosków na stronę

**API Calls**:
- `GET /api/vacation-requests?status=SUBMITTED&limit=50&offset=0&teamId=xxx`

**Akcje**:
- **Akceptuj**: 
  - `POST /api/vacation-requests/:id/approve`
  - Jeśli response zawiera `thresholdWarning` → pokaż ConfirmDialog z ostrzeżeniem
  - Toast notification sukcesu/błędu
- **Odrzuć**:
  - Dialog z polem "Powód odrzucenia" (opcjonalny)
  - `POST /api/vacation-requests/:id/reject`
  - Toast notification

#### /hr/vacation-requests/:id
**Komponent**: `VacationRequestDetail.astro` + `VacationRequestDetailContent.tsx` (React)

**Sekcje**:
1. **Informacje o wniosku** (Card)
   - Pracownik (link do profilu)
   - Zespół
   - Data od - do
   - Liczba dni roboczych
   - Status (StatusBadge)
   - Data złożenia
   - Rozpatrzony przez (jeśli applicable)
   - Data rozpatrzenia

2. **Akcje** (jeśli SUBMITTED)
   - Przycisk "Akceptuj"
   - Przycisk "Odrzuć"

3. **Historia** (Timeline - opcjonalnie)
   - Złożono: data, osoba
   - Rozpatrzono: data, osoba, akcja

**API Calls**:
- `GET /api/vacation-requests/:id`

#### /hr/teams
**Komponent**: `TeamsList.astro` + `TeamsGrid.tsx` (React)

**Features**:
1. **Nagłówek**
   - Przycisk "Utwórz zespół"

2. **Grid kart zespołów** (Shadcn/ui Card)
   - Nazwa zespołu
   - Liczba członków
   - Akcje: Edytuj, Usuń, Zobacz kalendarz
   - Link do szczegółów zespołu

**API Calls**:
- `GET /api/teams?includeMemberCount=true`

#### /hr/teams/:id
**Komponent**: `TeamDetail.astro` + `TeamDetailContent.tsx` (React)

**Sekcje**:
1. **Informacje o zespole** (Header)
   - Nazwa zespołu
   - Liczba członków
   - Przycisk "Edytuj"
   - Przycisk "Usuń zespół" (z confirmation)

2. **Członkowie zespołu** (Table)
   - Kolumny: Imię, Nazwisko, Email, Rola, Data dołączenia
   - Akcja: Usuń z zespołu (ikona X)
   - Empty state: "Brak członków w zespole"

3. **Dodaj członków** (Section)
   - Multi-select z wyszukiwaniem (Combobox Shadcn/ui)
   - Lista użytkowników NIE będących w zespole
   - Przycisk "Dodaj wybranych"

**API Calls**:
- `GET /api/teams/:id`
- `GET /api/users?limit=200` (dla multi-select)
- `POST /api/teams/:id/members` (dodawanie)
- `DELETE /api/teams/:id/members/:userId` (usuwanie)

#### /hr/teams/new + /hr/teams/:id/edit
**Komponent**: `TeamForm.tsx` (React)

**Formularz**:
- Nazwa zespołu (required, unique, max 100 chars)

**API Calls**:
- `POST /api/teams` (new)
- `PATCH /api/teams/:id` (edit)

#### /hr/calendar
**Komponent**: `CalendarView.astro` + `TeamCalendar.tsx` (React)

**Features**:
1. **Kontrolki** (Header)
   - Select: Wybór zespołu (wszystkie/konkretny zespół)
   - DatePicker: Wybór miesiąca
   - Przyciski nawigacji: Poprzedni/Następny miesiąc
   - Przyciski: "Dzisiaj", "Resetuj"

2. **Kalendarz tabelaryczny**
   - **Struktura**:
     - Wiersze: Pracownicy (imię + nazwisko)
     - Kolumny: Dni miesiąca
     - Nagłówek: Dzień tygodnia + data (Pn 1, Wt 2, ...)
   - **Komórki**:
     - Puste: dzień roboczy bez urlopu
     - Zaznaczone kolorem: urlop (różne kolory dla statusów)
     - Kolory:
       - APPROVED: zielony
       - SUBMITTED: żółty
       - Weekend: szary tło
       - Dzisiaj: niebieska ramka
   - **Przewijanie poziome**: dla wielu dni
   - **Sticky columns**: kolumna z nazwiskami

3. **Legenda** (Footer)
   - Kolory i ich znaczenie
   - Ikony dla różnych typów dni

**API Calls**:
- `GET /api/teams/:id/calendar?month=2026-01` (dla konkretnego zespołu)
- Dla "Wszystkie zespoły": wielokrotne wywołania lub dedykowany endpoint

**Responsive**:
- Desktop: pełny widok tabelaryczny
- Tablet: zmniejszone komórki, scroll horizontal
- Mobile: lista pracowników, rozwijane szczegóły

**Dostępność**:
- `role="grid"` dla tabeli
- `aria-label` dla komórek z datami
- Keyboard navigation

#### /hr/settings
**Komponent**: `Settings.astro` + `SettingsForm.tsx` (React)

**Formularz** (Cards dla każdej sekcji):

1. **Dni urlopowe** (Card)
   - Input number: Domyślna liczba dni urlopowych
   - Helper text: "Liczba dni przyznawanych nowym użytkownikom rocznie"
   - Zakres: 1-365

2. **Próg obłożenia zespołu** (Card)
   - Input number: Procent (0-100)
   - Helper text: "Maksymalny procent zespołu mogący być na urlopie jednocześnie"
   - Slider wizualizacja progu

3. **Przyciski**
   - "Zapisz zmiany"
   - "Anuluj"

**API Calls**:
- `GET /api/settings` (initial load)
- `PUT /api/settings/default_vacation_days`
- `PUT /api/settings/team_occupancy_threshold`

**Walidacja**:
- Real-time validation
- Success toast po zapisie

### 4.3. EMPLOYEE

#### /employee/dashboard
**Komponent**: `EmployeeDashboard.astro` + `EmployeeDashboardContent.tsx` (React)

**Sekcje**:
1. **Moje dni urlopowe** (Prominent Card)
   - VacationDaysCounter component
   - Główny licznik: Dostępne dni (suma)
   - Breakdown:
     - Dni bieżące: X
     - Dni z poprzedniego roku: Y (do 31.03)
   - Progress bar: wykorzystanie rocznej puli
   - Przycisk CTA: "Złóż wniosek"

2. **Moje najbliższe urlopy** (Card)
   - Lista najbliższych 3 zaakceptowanych urlopów
   - Format: "15-20 stycznia 2026 (4 dni)"
   - Link: "Zobacz wszystkie wnioski"

3. **Kalendarz zespołu** (Mini preview)
   - Widok bieżącego tygodnia
   - Link: "Zobacz pełny kalendarz"

**API Calls**:
- `GET /api/users/:userId/vacation-allowances/2026`
- `GET /api/vacation-requests?userId=:userId&status=APPROVED&limit=3`

#### /employee/vacation
**Komponent**: `MyVacation.astro` + `MyVacationContent.tsx` (React)

**Sekcje**:
1. **Dostępne dni** (Header Card)
   - VacationDaysCounter component
   - Przycisk: "Złóż nowy wniosek" → otwiera modal/dialog

2. **Moje wnioski** (Table)
   - Kolumny: Data od, Data do, Dni robocze, Status, Data złożenia, Akcje
   - StatusBadge dla statusów
   - Akcje:
     - SUBMITTED: Anuluj
     - APPROVED (przed rozpoczęciem): Anuluj
     - Inne: Brak akcji (tylko podgląd)
   - Sortowanie: najnowsze pierwsze

3. **Paginacja**
   - 50 wniosków na stronę

**API Calls**:
- `GET /api/users/:userId/vacation-allowances/2026`
- `GET /api/vacation-requests?userId=:userId&limit=50&offset=0`
- `POST /api/vacation-requests/:id/cancel` (anulowanie)

#### /employee/vacation/new (Modal/Dialog)
**Komponent**: `NewVacationRequestDialog.tsx` (React)

**Formularz** (React Hook Form + Zod):
1. **Wybór dat**
   - DatePicker "Od" (blokada weekendów, przeszłych dat)
   - DatePicker "Do" (blokada weekendów, min = data "Od")
   - Auto-calculate: Liczba dni roboczych

2. **Live preview** (Pod polami dat)
   - "Liczba dni roboczych: X"
   - "Po zaakceptowaniu pozostanie: Y dni"
   - Ostrzeżenia:
     - "Niewystarczająca liczba dni"
     - "Nakładające się wnioski"
     - Breakdown: wykorzystanie z puli zaległej vs bieżącej

3. **Przyciski**
   - "Złóż wniosek" (disabled jeśli błędy)
   - "Anuluj"

**Walidacja**:
- Real-time calculation podczas wyboru dat
- Blokada weekendów w DatePicker
- Sprawdzanie dostępnych dni
- Wykrywanie nakładających się wniosków

**API Calls**:
- `GET /api/users/:userId/vacation-allowances/2026` (dla live preview)
- `POST /api/vacation-requests` (submit)

**Success flow**:
- Toast notification "Wniosek został złożony"
- Zamknięcie dialogu
- Refresh listy wniosków

#### /employee/calendar
**Komponent**: `EmployeeCalendar.astro` + `EmployeeTeamCalendar.tsx` (React)

**Features**:
1. **Kontrolki** (Header)
   - Select: Wybór zespołu (jeśli użytkownik należy do wielu)
   - DatePicker: Wybór miesiąca
   - Przyciski nawigacji: Poprzedni/Następny miesiąc
   - Przycisk: "Dzisiaj"

2. **Kalendarz tabelaryczny** (identyczny jak HR, ale tylko dla własnych zespołów)
   - Wiersze: Członkowie zespołu
   - Kolumny: Dni miesiąca
   - Zaznaczenie urlopów (APPROVED/SUBMITTED)
   - Własne urlopy: wyróżnione (np. pogrubienie)

**API Calls**:
- `GET /api/teams` (dla listy zespołów użytkownika)
- `GET /api/teams/:id/calendar?month=2026-01`

## 5. Zarządzanie stanem i API

### 5.1. React Query Setup

**Konfiguracja** (`src/lib/queryClient.ts`):
```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minut
      cacheTime: 10 * 60 * 1000, // 10 minut
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
```

### 5.2. Custom Hooks

#### useUsers (Admin)
```typescript
// src/components/hooks/useUsers.ts
export const useUsers = (params: UsersQueryParams) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => fetchUsers(params),
  })
}

export const useCreateUser = () => {
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Użytkownik został dodany')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
```

#### useVacationRequests (HR/Employee)
```typescript
// src/components/hooks/useVacationRequests.ts
export const useVacationRequests = (params: VacationRequestsQueryParams) => {
  return useQuery({
    queryKey: ['vacation-requests', params],
    queryFn: () => fetchVacationRequests(params),
  })
}

export const useApproveVacationRequest = () => {
  return useMutation({
    mutationFn: ({ id, acknowledgeThresholdWarning }: ApproveParams) =>
      approveVacationRequest(id, acknowledgeThresholdWarning),
    onSuccess: (data) => {
      if (data.thresholdWarning) {
        // Pokaż dialog ostrzeżenia
        return
      }
      queryClient.invalidateQueries(['vacation-requests'])
      toast.success('Wniosek został zaakceptowany')
    },
  })
}
```

#### useVacationAllowances (Employee)
```typescript
// src/components/hooks/useVacationAllowances.ts
export const useVacationAllowances = (userId: string, year: number) => {
  return useQuery({
    queryKey: ['vacation-allowances', userId, year],
    queryFn: () => fetchVacationAllowances(userId, year),
  })
}
```

#### useTeams (HR)
```typescript
// src/components/hooks/useTeams.ts
export const useTeams = () => {
  return useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  })
}

export const useTeamCalendar = (teamId: string, month: string) => {
  return useQuery({
    queryKey: ['team-calendar', teamId, month],
    queryFn: () => fetchTeamCalendar(teamId, month),
  })
}
```

### 5.3. Error Handling

**Error Mapper** (`src/lib/errors.ts`):
```typescript
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return ERROR_MESSAGES[error.code] || error.message
  }
  return 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.'
}

const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Dane formularza są nieprawidłowe',
  AUTHENTICATION_REQUIRED: 'Musisz być zalogowany',
  INSUFFICIENT_PERMISSIONS: 'Nie masz uprawnień do tej akcji',
  RESOURCE_NOT_FOUND: 'Zasób nie został znaleziony',
  DUPLICATE_RESOURCE: 'Zasób o tych danych już istnieje',
  INSUFFICIENT_VACATION_DAYS: 'Niewystarczająca liczba dni urlopowych',
  OVERLAPPING_VACATION: 'Masz już wniosek na ten okres',
  WEEKEND_DATE_INVALID: 'Data nie może przypadać na weekend',
  PAST_DATE_INVALID: 'Nie można wybrać daty z przeszłości',
}
```

## 6. Middleware i autentykacja

### 6.1. Middleware Flow (`src/middleware/index.ts`)

```typescript
export async function onRequest(context, next) {
  const { url, locals, redirect } = context
  const supabase = locals.supabase
  
  // 1. Pobierz użytkownika z sesji
  const { data: { user } } = await supabase.auth.getUser()
  
  // 2. Publiczne ścieżki (login, forgot-password)
  if (PUBLIC_ROUTES.includes(url.pathname)) {
    if (user) {
      // Zalogowany użytkownik próbuje dostać się do /login
      return redirect('/')
    }
    return next()
  }
  
  // 3. Wymagana autentykacja
  if (!user) {
    return redirect('/login')
  }
  
  // 4. Pobierz profil użytkownika
  const profile = await fetchUserProfile(user.id, supabase)
  locals.user = profile
  
  // 5. Wymuszana zmiana hasła
  if (profile.requiresPasswordReset && url.pathname !== '/change-password') {
    return redirect('/change-password')
  }
  
  // 6. Sprawdź uprawnienia do ścieżki
  const routeRole = getRouteRole(url.pathname)
  if (routeRole && profile.role !== routeRole) {
    return redirect('/')
  }
  
  return next()
}
```

### 6.2. Przekierowania na dashboard

```typescript
// Mapowanie roli na domyślny dashboard
const ROLE_DASHBOARDS: Record<Role, string> = {
  ADMINISTRATOR: '/admin/dashboard',
  HR: '/hr/dashboard',
  EMPLOYEE: '/employee/dashboard',
}

// W middleware lub na stronie '/'
if (url.pathname === '/') {
  return redirect(ROLE_DASHBOARDS[locals.user.role])
}
```

## 7. Responsywność

### 7.1. Breakpoints (Tailwind)
```
sm: 640px   - małe tablety
md: 768px   - tablety
lg: 1024px  - małe laptopy
xl: 1280px  - desktopy
2xl: 1536px - duże ekrany
```

### 7.2. Strategie responsywności

#### Nawigacja
- **Desktop**: Poziomy TopBar z menu
- **Mobile**: Hamburger menu (Sheet/Drawer Shadcn/ui)

#### Tabele
- **Desktop**: Pełne tabele z wszystkimi kolumnami
- **Tablet**: Ukrycie mniej istotnych kolumn, scroll horizontal
- **Mobile**: Card layout zamiast tabeli (każdy wiersz jako Card)

#### Formularze
- **Desktop**: 2-3 kolumny
- **Tablet/Mobile**: 1 kolumna

#### Kalendarz
- **Desktop**: Pełny widok tabelaryczny
- **Tablet**: Scroll horizontal, sticky column z nazwiskami
- **Mobile**: Lista pracowników, rozwijane szczegóły

## 8. Dostępność (WCAG 2.1 AA)

### 8.1. Wymagania

#### Perceivable
- **Kontrast kolorów**: Min 4.5:1 dla tekstu, 3:1 dla UI components
- **Alternatywny tekst**: Wszystkie ikony z `aria-label`
- **Nagłówki semantyczne**: Hierarchia h1-h6
- **Focus indicators**: Widoczne ramki focus (Tailwind `focus-visible:`)

#### Operable
- **Keyboard navigation**: Wszystkie akcje dostępne z klawiatury
- **Skip links**: "Przejdź do treści głównej"
- **Tab order**: Logiczna kolejność focusów
- **No keyboard traps**: Możliwość wyjścia z modali (Esc)

#### Understandable
- **Etykiety formularzy**: Wszystkie pola z `<Label>`
- **Komunikaty błędów**: Jasne, konkretne, pomocne
- **Instrukcje**: Helper text dla złożonych pól
- **Język**: `lang="pl"` w HTML

#### Robust
- **Semantic HTML**: Używanie właściwych tagów
- **ARIA landmarks**: `main`, `nav`, `aside`, `header`, `footer`
- **ARIA roles**: Odpowiednie role dla custom components
- **Valid HTML**: Brak błędów walidacji

### 8.2. ARIA w praktyce

#### TopBar Navigation
```tsx
<nav role="navigation" aria-label="Nawigacja główna">
  <NavigationMenu>...</NavigationMenu>
</nav>
```

#### Tabele
```tsx
<table role="table" aria-label="Lista użytkowników">
  <thead>
    <tr>
      <th scope="col">Imię</th>
      ...
    </tr>
  </thead>
</table>
```

#### Przyciski akcji
```tsx
<Button aria-label="Usuń użytkownika Jan Kowalski">
  <TrashIcon />
</Button>
```

#### Status announcements
```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {vacationDaysRemaining} dni urlopowych pozostało
</div>
```

#### Modals
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent 
    aria-describedby="dialog-description"
    aria-labelledby="dialog-title"
  >
    <DialogTitle id="dialog-title">Usuń użytkownika</DialogTitle>
    <DialogDescription id="dialog-description">
      Czy na pewno chcesz usunąć tego użytkownika?
    </DialogDescription>
  </DialogContent>
</Dialog>
```

## 9. Style guide i design tokens

### 9.1. Kolory (Tailwind + Shadcn/ui)

#### Podstawowe
- **Primary**: Niebieski (akcje główne, linki)
- **Secondary**: Szary (akcje drugorzędne)
- **Destructive**: Czerwony (usuwanie, odrzucanie)
- **Success**: Zielony (zaakceptowane, sukces)
- **Warning**: Pomarańczowy/Żółty (ostrzeżenia, oczekujące)
- **Muted**: Jasnoszary (tła, disabled)

#### Statusy wniosków
- **SUBMITTED**: `bg-blue-100 text-blue-800`
- **APPROVED**: `bg-green-100 text-green-800`
- **REJECTED**: `bg-red-100 text-red-800`
- **CANCELLED**: `bg-gray-100 text-gray-800`

#### Kalendarz
- **Dzień roboczy**: `bg-white`
- **Weekend**: `bg-gray-100`
- **Dzisiaj**: `border-2 border-blue-500`
- **Urlop APPROVED**: `bg-green-200`
- **Urlop SUBMITTED**: `bg-yellow-200`

### 9.2. Typografia

#### Nagłówki
- **h1**: `text-3xl font-bold` (36px)
- **h2**: `text-2xl font-semibold` (30px)
- **h3**: `text-xl font-semibold` (24px)
- **h4**: `text-lg font-medium` (20px)

#### Tekst
- **Body**: `text-base` (16px)
- **Small**: `text-sm` (14px)
- **Tiny**: `text-xs` (12px)

### 9.3. Spacing
- **Card padding**: `p-6`
- **Section spacing**: `space-y-6`
- **Form fields**: `space-y-4`
- **Inline elements**: `space-x-2`

### 9.4. Buttons
- **Default**: Primary action, wypełnione
- **Outline**: Secondary action, kontur
- **Ghost**: Tertiary action, bez tła
- **Destructive**: Usuwanie, niebezpieczne akcje

### 9.5. Ikony
- **Biblioteka**: Lucide React (instalowana z Shadcn/ui)
- **Rozmiar**: `h-4 w-4` (16px) dla ikon inline, `h-6 w-6` (24px) dla przycisków

## 10. Performance i optymalizacja

### 10.1. Code splitting
- **Astro**: Automatyczne code splitting per-route
- **React**: Dynamic imports dla ciężkich komponentów
```tsx
const HeavyCalendar = lazy(() => import('./HeavyCalendar'))
```

### 10.2. Image optimization
- **Astro Image**: Użycie `<Image>` component
- **Lazy loading**: `loading="lazy"` dla obrazów poniżej fold

### 10.3. Bundle size
- **Tree shaking**: Import tylko używanych komponentów Shadcn/ui
- **Lodash**: Import konkretnych funkcji `import debounce from 'lodash/debounce'`

### 10.4. Caching
- **React Query**: Cache responses przez 5-10 minut
- **Supabase**: Session cache w localStorage
- **Static assets**: Long-term caching w Astro

## 11. Implementacja krok po kroku

### Faza 1: Foundation (Priorytet: Wysoki)
1. Setup Shadcn/ui i konfiguracja theme
2. Utworzenie MainLayout i AuthLayout
3. TopBar z Navigation Menu (responsywne)
4. Setup React Query i query client
5. Middleware z autentykacją i role-based routing
6. Custom hooks dla API (useUsers, useVacationRequests, etc.)
7. Error handling utilities i ErrorBoundary
8. Toast notifications setup

### Faza 2: Admin Panel (Priorytet: Wysoki)
9. /admin/dashboard - statystyki i aktywności
10. /admin/users - lista użytkowników z filtrowaniem
11. /admin/users/new - formularz dodawania użytkownika
12. /admin/users/:id/edit - formularz edycji użytkownika
13. Soft-delete functionality z confirmation dialog

### Faza 3: HR Panel - Core (Priorytet: Wysoki)
14. /hr/dashboard - przegląd oczekujących wniosków
15. /hr/vacation-requests - lista z zakładkami i filtrami
16. Approve/Reject functionality z threshold warning dialog
17. /hr/teams - lista zespołów
18. /hr/teams/:id - szczegóły zespołu z członkami
19. /hr/teams/new - tworzenie zespołu
20. Add/Remove members functionality

### Faza 4: Employee Panel (Priorytet: Wysoki)
21. /employee/dashboard - VacationDaysCounter
22. /employee/vacation - lista wniosków
23. /employee/vacation/new - dialog składania wniosku z live preview
24. Cancel request functionality

### Faza 5: Calendar Views (Priorytet: Średni)
25. TeamCalendar component - layout tabelaryczny
26. /hr/calendar - widok dla HR (wszystkie zespoły)
27. /employee/calendar - widok dla Employee (własne zespoły)
28. Responsive calendar (mobile list view)

### Faza 6: Settings & Polish (Priorytet: Średni)
29. /hr/settings - konfiguracja dni urlopowych i progu
30. Loading states (Skeleton components)
31. Empty states dla wszystkich list
32. /change-password - wymuszana zmiana hasła

### Faza 7: Accessibility & Testing (Priorytet: Wysoki)
33. Audit WCAG 2.1 AA compliance
34. Keyboard navigation testing
35. Screen reader testing
36. Contrast checking
37. Focus indicators dla wszystkich interactive elements

### Faza 8: Optimization (Priorytet: Niski)
38. Performance audit
39. Bundle size optimization
40. Lighthouse score optimization (> 90)

## 12. Komponenty do utworzenia - Checklist

### Layouts
- [ ] `MainLayout.astro`
- [ ] `AuthLayout.astro`

### Navigation
- [ ] `TopBar.tsx`
- [ ] `Breadcrumbs.tsx`
- [ ] `MobileNav.tsx`
- [ ] `UserDropdown.tsx`

### Shared Components
- [ ] `LoadingState.tsx` (skeleton variants)
- [ ] `ErrorBoundary.tsx`
- [ ] `ConfirmDialog.tsx`
- [ ] `StatusBadge.tsx`
- [ ] `VacationDaysCounter.tsx`
- [ ] `EmptyState.tsx`

### Admin Components
- [ ] `AdminDashboard.astro` + `DashboardStats.tsx`
- [ ] `UsersList.astro` + `UsersTable.tsx`
- [ ] `UserForm.tsx`

### HR Components
- [ ] `HRDashboard.astro` + `HRDashboardContent.tsx`
- [ ] `VacationRequestsList.astro` + `VacationRequestsTable.tsx`
- [ ] `VacationRequestDetail.tsx`
- [ ] `ThresholdWarningDialog.tsx`
- [ ] `TeamsList.astro` + `TeamsGrid.tsx`
- [ ] `TeamDetail.tsx`
- [ ] `TeamForm.tsx`
- [ ] `TeamMembersManager.tsx`
- [ ] `SettingsForm.tsx`

### Employee Components
- [ ] `EmployeeDashboard.astro` + `EmployeeDashboardContent.tsx`
- [ ] `MyVacation.astro` + `MyVacationContent.tsx`
- [ ] `NewVacationRequestDialog.tsx`
- [ ] `VacationRequestsList.tsx`

### Calendar Components
- [ ] `CalendarView.astro`
- [ ] `TeamCalendar.tsx`
- [ ] `CalendarControls.tsx`
- [ ] `CalendarGrid.tsx`
- [ ] `CalendarLegend.tsx`

### Hooks
- [ ] `useUsers.ts`
- [ ] `useVacationRequests.ts`
- [ ] `useVacationAllowances.ts`
- [ ] `useTeams.ts`
- [ ] `useSettings.ts`
- [ ] `useAuth.ts`

### Services
- [ ] `src/lib/api/users.ts`
- [ ] `src/lib/api/vacation-requests.ts`
- [ ] `src/lib/api/vacation-allowances.ts`
- [ ] `src/lib/api/teams.ts`
- [ ] `src/lib/api/settings.ts`
- [ ] `src/lib/errors.ts`
- [ ] `src/lib/queryClient.ts`

## 13. Podsumowanie decyzji projektowych

### ✅ Zatwierdzone decyzje
1. **Różne dashboardy dla ról**: Tak, każda rola ma dedykowany dashboard
2. **Dynamiczna nawigacja**: Tak, menu dostosowane do roli (bez możliwości zmiany roli w trakcie)
3. **Live preview w formularzu urlopu**: Tak, real-time obliczanie dni i ostrzeżenia
4. **Wybór zespołu w kalendarzu**: Dropdown na górze, pierwszy alfabetycznie domyślnie
5. **Layout kalendarza**: Tabelaryczny (pracownicy x dni)
6. **Wymuszana zmiana hasła**: Middleware redirect do /change-password
7. **Lista wniosków HR**: Zakładki (statusy) + filtry (zespół, daty)
8. **Ostrzeżenie o progu**: Modal z checkbox potwierdzenia
9. **Widok "Mój urlop"**: Tabelka z breakdown dni bieżących i zaległych
10. **Zarządzanie stanem**: React Query dla API, toast notifications, skeleton screens
11. **Biblioteka UI**: Shadcn/ui
12. **Nawigacja**: Navigation Menu w topbar
13. **Dostępność**: WCAG 2.1 Level AA

### 🎯 Kluczowe założenia techniczne
- **Framework**: Astro 5 + React 19
- **Stylowanie**: Tailwind CSS 4
- **State management**: React Query (TanStack Query)
- **Formularze**: React Hook Form + Zod
- **Notyfikacje**: Toast (Shadcn/ui Sonner)
- **Ikony**: Lucide React
- **Autentykacja**: Supabase Auth + JWT
- **Middleware**: Role-based routing i wymuszana zmiana hasła

### 📊 Metryki sukcesu implementacji
- Lighthouse Performance Score: > 90
- Lighthouse Accessibility Score: 100
- Keyboard navigation: 100% funkcjonalności dostępne
- Screen reader compatibility: Wszystkie komponenty
- Mobile usability: Wszystkie widoki responsywne
- Load time: < 2s (FCP), < 3s (LCP)

