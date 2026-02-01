# Podsumowanie rozmowy - Planowanie architektury UI VacationPlanner MVP

<conversation_summary>

## <decisions>

### Decyzje podjęte przez użytkownika

1. **Dashboard różny dla każdej roli** - Każda rola (ADMINISTRATOR, HR, EMPLOYEE) otrzyma dedykowany dashboard pokazujący najważniejsze informacje i akcje specyficzne dla tej roli.

2. **Dynamiczna nawigacja bez możliwości zmiany roli** - Nawigacja główna będzie się dynamicznie dostosowywać do roli użytkownika, ukrywając niedostępne sekcje. Nie będzie możliwości zmiany roli w trakcie pracy z aplikacją.

3. **Live preview w formularzu urlopowym** - Formularz składania wniosku urlopowego będzie pokazywać dostępne dni w czasie rzeczywistym podczas wyboru dat, z automatycznym obliczaniem liczby dni roboczych i ostrzeżeniami.

4. **Organizacja kalendarza zespołu** - Strona kalendarza dla użytkowników należących do wielu zespołów będzie zawierać dropdown/tabs na górze widoku. Domyślnie pokazywany będzie pierwszy zespół alfabetycznie. HR otrzyma również widok "Wszystkie zespoły" pokazujący zbiorcze informacje.

5. **Layout tabelaryczny kalendarza** - Widok kalendarza używa layoutu tabelarycznego z pracownikami w wierszach i dniami w kolumnach, z możliwością przewijania poziomego.

6. **Proces wymuszonej zmiany hasła** - Po pomyślnym logowaniu system sprawdzi flagę `requiresPasswordReset`. Jeśli true, middleware w Astro przekieruje na dedykowaną stronę `/change-password` i zablokuje dostęp do innych tras.

7. **Lista wniosków z zakładkami i filtrami** - Lista wniosków urlopowych dla HR będzie podzielona na zakładki dla statusów ("Oczekujące", "Zaakceptowane", "Odrzucone") oraz dodatkowe filtry dropdown dla zespołów, okresów dat i użytkowników.

8. **Modal ostrzeżenia o przekroczeniu progu** - Ostrzeżenie o przekroczeniu progu obłożenia zespołu będzie wyświetlane w modalu po kliknięciu "Akceptuj". Modal będzie zawierał wyraźne ostrzeżenie wizualne (pomarańczowy/czerwony kolor), procent obłożenia i wymusi dodatkowe potwierdzenie przez checkbox przed finalnym zatwierdzeniem.

9. **Widok "Mój urlop" z tabelką** - Widok dla EMPLOYEE będzie zawierał tabelkę z głównym licznikiem "Dostępne dni: X" (suma), breakdown na "Dni bieżące: Y" i "Dni z poprzedniego roku: Z (do wykorzystania do 31.03)", listę wniosków z kolorowym oznaczeniem statusu oraz przycisk "Złóż nowy wniosek".

10. **React Query do zarządzania stanem API** - Aplikacja wykorzysta React Query (TanStack Query) do cache'owania i zarządzania stanem API, wraz z reużywalnymi komponentami React dla stanów ładowania (skeleton screens), błędów (error boundary z opcją retry) i sukcesu (toast notifications).

11. **Shadcn/ui jako biblioteka komponentów** - Aplikacja będzie korzystać z gotowych komponentów Shadcn/ui.

12. **Navigation Menu w formie topbara** - Nawigacja wykorzysta Navigation Menu od Shadcn/ui w formie topbara.

13. **Dostępność WCAG AA** - Aplikacja będzie dbać o dostępność na poziomie WCAG 2.1 Level AA.

</decisions>

## <matched_recommendations>

### Najistotniejsze zalecenia dopasowane do decyzji użytkownika

1. **Dashboard dostosowany do roli** ✅
   - **Zalecenie**: ADMINISTRATOR widzi statystyki użytkowników, HR widzi oczekujące wnioski i stan zespołów, EMPLOYEE widzi pulę dni i najbliższe urlopy zespołu.
   - **Implementacja**: Każda rola otrzyma dedykowany dashboard z specyficznymi widgetami i akcjami.

2. **Nawigacja ukrywająca niedostępne sekcje** ✅
   - **Zalecenie**: ADMINISTRATOR widzi tylko "Użytkownicy", HR widzi "Dashboard", "Zespoły", "Wnioski urlopowe", "Ustawienia", EMPLOYEE widzi "Dashboard", "Mój urlop", "Kalendarz zespołu".
   - **Implementacja**: Dynamiczne generowanie menu w TopBar na podstawie roli z `context.locals.user.role`.

3. **Live preview obliczający dni robocze** ✅
   - **Zalecenie**: Formularz pokazuje liczbę dni roboczych wybranego okresu, pozostałą pulę dni po zaakceptowaniu oraz ostrzeżenia o nakładających się wnioskach i weekendach.
   - **Implementacja**: Real-time calculation używając `GET /api/users/:userId/vacation-allowances/:year` i lokalnej logiki obliczania dni roboczych.

4. **Dropdown wyboru zespołu z domyślnym pierwszym alfabetycznie** ✅
   - **Zalecenie**: Dropdown/tabs na górze kalendarza, domyślnie pierwszy zespół alfabetycznie, widok "Wszystkie zespoły" dla HR.
   - **Implementacja**: Select component z listą zespołów, `GET /api/teams/:id/calendar` dla wybranego zespołu.

5. **Layout tabelaryczny z przewijaniem poziomym** ✅
   - **Zalecenie**: Pracownicy w wierszach, dni w kolumnach, przewijanie poziome. Na mobile widok listy z możliwością rozwinięcia szczegółów.
   - **Implementacja**: Responsywny grid z sticky column dla nazwisk, mobile fallback do card layout.

6. **Middleware redirect dla wymuszonej zmiany hasła** ✅
   - **Zalecenie**: Sprawdzanie flagi `requiresPasswordReset`, middleware blokuje dostęp do innych tras, redirect na `/change-password`.
   - **Implementacja**: Middleware w `src/middleware/index.ts` sprawdzający flagę przed każdym request.

7. **Zakładki + filtry dla listy wniosków** ✅
   - **Zalecenie**: Główne zakładki dla statusów (SUBMITTED, APPROVED, REJECTED), dodatkowe filtry dla zespołów, dat i użytkowników.
   - **Implementacja**: Shadcn/ui Tabs + Select/DatePicker komponenty, `GET /api/vacation-requests` z parametrami query.

8. **Modal z checkbox potwierdzenia przekroczenia progu** ✅
   - **Zalecenie**: Modal z ostrzeżeniem wizualnym, procent obłożenia (np. "60.5% > 50%"), checkbox "Rozumiem i akceptuję przekroczenie progu".
   - **Implementacja**: Shadcn/ui Dialog z conditional rendering na podstawie `thresholdWarning` z API response, drugi request z `acknowledgeThresholdWarning: true`.

9. **Tabelka z breakdown dni urlopowych** ✅
   - **Zalecenie**: Główny licznik sumaryczny, breakdown na dni bieżące i zaległe, informacja o terminie wykorzystania (31.03), lista wniosków, przycisk CTA.
   - **Implementacja**: Custom component `VacationDaysCounter.tsx` używający danych z `GET /api/users/:userId/vacation-allowances/:year`.

10. **React Query + skeleton screens + toast notifications** ✅
    - **Zalecenie**: React Query do cache'owania, skeleton screens dla stanów ładowania, error boundary z retry, toast notifications dla feedback, confirmation modals dla krytycznych operacji.
    - **Implementacja**: TanStack Query z custom hooks, Shadcn/ui Skeleton, Sonner dla toasts, Dialog dla confirmations.

11. **Shadcn/ui jako podstawa UI** ✅
    - **Zalecenie**: Wykorzystanie gotowej biblioteki komponentów zapewniającej dostępność i spójność designu.
    - **Implementacja**: Import komponentów z `src/components/ui/`, theme customization w Tailwind config.

12. **Navigation Menu w topbar** ✅
    - **Zalecenie**: Shadcn/ui Navigation Menu w formie poziomego topbara, responsywne z hamburger menu na mobile.
    - **Implementacja**: `TopBar.tsx` z Navigation Menu, logo po lewej, menu główne, user dropdown po prawej.

13. **WCAG 2.1 AA compliance** ✅
    - **Zalecenie**: Kontrast kolorów min 4.5:1, ARIA landmarks, keyboard navigation, focus indicators, semantic HTML.
    - **Implementacja**: Wszystkie komponenty z odpowiednimi ARIA attributes, testowanie z keyboard i screen readers.

</matched_recommendations>

## <ui_architecture_planning_summary>

### Kompleksowe podsumowanie planowania architektury UI

#### 1. Główne wymagania dotyczące architektury UI

##### 1.1. Tech Stack

- **Framework**: Astro 5 dla stron statycznych + React 19 dla komponentów interaktywnych
- **Stylowanie**: Tailwind CSS 4 dla utility-first styling
- **Biblioteka UI**: Shadcn/ui zapewniająca gotowe, dostępne komponenty
- **Zarządzanie stanem**: React Query (TanStack Query) dla API state management
- **Walidacja formularzy**: React Hook Form + Zod schemas
- **Ikony**: Lucide React (z Shadcn/ui)
- **Notyfikacje**: Sonner (Shadcn/ui toast system)

##### 1.2. Wymagania funkcjonalne

- **Role-based UI**: Trzy różne interfejsy dla ADMINISTRATOR, HR i EMPLOYEE
- **Responsywność**: Mobile-first approach, breakpoints: 320px-1920px+
- **Dostępność**: WCAG 2.1 Level AA compliance
- **Język**: Polski (wszystkie UI strings, error messages, labels)
- **Autentykacja**: Supabase Auth z JWT tokens, middleware-based protection

##### 1.3. Wymagania niefunkcjonalne

- **Performance**: Lighthouse score > 90
- **Load time**: < 2s FCP, < 3s LCP
- **Accessibility score**: 100
- **Keyboard navigation**: 100% funkcjonalności dostępne
- **Bundle size**: Optymalizacja przez tree shaking i code splitting

#### 2. Kluczowe widoki, ekrany i przepływy użytkownika

##### 2.1. Struktura routing

**Publiczne (niezalogowane):**

```
/login                    - Formularz logowania
```

**Wymagające autoryzacji:**

```
/change-password          - Wymuszana zmiana hasła (wszystkie role)
/                         - Redirect do właściwego dashboardu

# ADMINISTRATOR
/admin/dashboard          - Statystyki użytkowników, ostatnie aktywności
/admin/users              - Lista użytkowników z filtrowaniem
/admin/users/new          - Formularz dodawania użytkownika
/admin/users/:id/edit     - Formularz edycji użytkownika

# HR
/hr/dashboard             - Przegląd oczekujących wniosków, statystyki
/hr/vacation-requests     - Lista wniosków z zakładkami i filtrami
/hr/vacation-requests/:id - Szczegóły pojedynczego wniosku
/hr/teams                 - Lista zespołów (grid kart)
/hr/teams/new             - Tworzenie nowego zespołu
/hr/teams/:id             - Szczegóły zespołu, zarządzanie członkami
/hr/teams/:id/edit        - Edycja zespołu
/hr/calendar              - Kalendarz zbiorczy wszystkich zespołów
/hr/settings              - Konfiguracja systemu (dni urlopu, próg)

# EMPLOYEE
/employee/dashboard       - Przegląd dni urlopowych, najbliższe urlopy
/employee/vacation        - Mój urlop (pula dni + lista wniosków)
/employee/vacation/new    - Dialog składania wniosku
/employee/calendar        - Kalendarz własnych zespołów
```

##### 2.2. Przepływy użytkownika

**A. Pierwsze logowanie (wszystkie role):**

1. Użytkownik wpisuje email i hasło tymczasowe
2. POST do `/api/auth/login`
3. Middleware wykrywa `requiresPasswordReset: true`
4. Redirect na `/change-password`
5. Użytkownik ustawia nowe hasło
6. PATCH `/api/users/:id` z nowym hasłem
7. Redirect na dashboard odpowiedni dla roli

**B. Składanie wniosku urlopowego (EMPLOYEE):**

1. Użytkownik klika "Złóż nowy wniosek" na `/employee/vacation`
2. Otwiera się dialog `NewVacationRequestDialog`
3. Wybór daty "od" (DatePicker blokuje weekendy i przeszłe daty)
4. Wybór daty "do" (DatePicker, min = data "od")
5. Live preview:
   - Obliczenie dni roboczych (frontend)
   - GET `/api/users/:userId/vacation-allowances/:year` dla dostępnych dni
   - Pokazanie: "Liczba dni: X", "Po zaakceptowaniu pozostanie: Y"
   - Ostrzeżenia: niewystarczające dni, nakładające się wnioski
6. Kliknięcie "Złóż wniosek"
7. POST `/api/vacation-requests`
8. Toast notification sukcesu
9. Zamknięcie dialogu, odświeżenie listy wniosków

**C. Akceptacja wniosku z ostrzeżeniem o progu (HR):**

1. HR widzi listę wniosków na `/hr/vacation-requests` (zakładka "Oczekujące")
2. Kliknięcie "Akceptuj" przy wniosku
3. POST `/api/vacation-requests/:id/approve` z `acknowledgeThresholdWarning: false`
4. API response zawiera `thresholdWarning: { hasWarning: true, teamOccupancy: 60.5, threshold: 50 }`
5. Wyświetlenie `ThresholdWarningDialog`:
   - Ostrzeżenie: "Przekroczenie progu: 60.5% > 50%"
   - Checkbox: "Rozumiem i akceptuję przekroczenie progu"
   - Przyciski: "Akceptuj mimo to", "Anuluj"
6. Jeśli HR zaznacza checkbox i klika "Akceptuj mimo to":
7. POST `/api/vacation-requests/:id/approve` z `acknowledgeThresholdWarning: true`
8. Toast notification sukcesu
9. Odświeżenie listy wniosków (usunięcie z zakładki "Oczekujące")

**D. Zarządzanie zespołem (HR):**

1. HR przechodzi na `/hr/teams/:id`
2. Widzi listę członków zespołu w tabeli
3. Sekcja "Dodaj członków":
   - Multi-select Combobox z wyszukiwaniem
   - GET `/api/users?limit=200` dla listy użytkowników
   - Filtrowanie użytkowników NIE będących w zespole
4. Wybór użytkowników i kliknięcie "Dodaj wybranych"
5. POST `/api/teams/:id/members` z `{ userIds: [...] }`
6. Toast notification sukcesu
7. Odświeżenie tabeli członków
8. Usuwanie członka: kliknięcie ikony X
9. Confirmation dialog: "Czy na pewno usunąć [Imię Nazwisko] z zespołu?"
10. DELETE `/api/teams/:id/members/:userId`
11. Toast notification, odświeżenie tabeli

**E. Przeglądanie kalendarza zespołu (EMPLOYEE/HR):**

1. Użytkownik przechodzi na `/employee/calendar` lub `/hr/calendar`
2. GET `/api/teams` dla listy zespołów użytkownika
3. Domyślnie wybrany pierwszy zespół alfabetycznie
4. GET `/api/teams/:id/calendar?month=2026-01` dla danych kalendarza
5. Renderowanie tabeli:
   - Wiersze: członkowie zespołu (imię + nazwisko)
   - Kolumny: dni miesiąca (1-31)
   - Komórki kolorowane dla urlopów:
     - APPROVED: zielony
     - SUBMITTED: żółty
     - Weekend: szary
     - Dzisiaj: niebieska ramka
6. Zmiana miesiąca: przyciski "Poprzedni"/"Następny" lub DatePicker
7. GET `/api/teams/:id/calendar?month=YYYY-MM`
8. Re-render tabeli z nowymi danymi
9. (HR only) Zmiana zespołu: dropdown → GET dla nowego zespołu

#### 3. Strategia integracji z API i zarządzania stanem

##### 3.1. React Query Configuration

**Query Client Setup** (`src/lib/queryClient.ts`):

```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minut
      cacheTime: 10 * 60 * 1000, // 10 minut
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

##### 3.2. Custom Hooks Pattern

**Struktura hooks dla każdego resource:**

```
src/components/hooks/
  useUsers.ts              - Admin: CRUD użytkowników
  useVacationRequests.ts   - HR/Employee: wnioski urlopowe
  useVacationAllowances.ts - Employee: pula dni
  useTeams.ts              - HR: zarządzanie zespołami
  useSettings.ts           - HR: ustawienia systemu
  useAuth.ts               - Wszystkie: autentykacja
```

**Przykład implementacji hook:**

```typescript
// useVacationRequests.ts
export const useVacationRequests = (params: VacationRequestsQueryParams) => {
  return useQuery({
    queryKey: ["vacation-requests", params],
    queryFn: () => fetchVacationRequests(params),
  });
};

export const useApproveVacationRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, acknowledgeThresholdWarning }: ApproveParams) =>
      approveVacationRequest(id, acknowledgeThresholdWarning),
    onSuccess: (data) => {
      if (data.thresholdWarning) {
        // Obsługa w komponencie (pokazanie dialogu)
        return;
      }
      queryClient.invalidateQueries(["vacation-requests"]);
      toast.success("Wniosek został zaakceptowany");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
```

##### 3.3. API Service Layer

**Struktura services:**

```
src/lib/api/
  users.ts               - fetchUsers, createUser, updateUser, deleteUser
  vacation-requests.ts   - fetchRequests, createRequest, approveRequest, etc.
  vacation-allowances.ts - fetchAllowances, updateAllowances
  teams.ts               - fetchTeams, createTeam, addMembers, removeMembers
  settings.ts            - fetchSettings, updateSetting
```

**Przykład service function:**

```typescript
// vacation-requests.ts
export async function fetchVacationRequests(params: VacationRequestsQueryParams): Promise<VacationRequestsResponse> {
  const queryString = new URLSearchParams({
    limit: params.limit?.toString() || "50",
    offset: params.offset?.toString() || "0",
    ...(params.status && { status: params.status.join(",") }),
    ...(params.teamId && { teamId: params.teamId }),
  }).toString();

  const response = await fetch(`/api/vacation-requests?${queryString}`);

  if (!response.ok) {
    throw new ApiError(await response.json());
  }

  return response.json();
}
```

##### 3.4. Error Handling Strategy

**Error Mapper** (`src/lib/errors.ts`):

```typescript
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return ERROR_MESSAGES[error.code] || error.message;
  }
  return "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";
};

const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "Dane formularza są nieprawidłowe",
  AUTHENTICATION_REQUIRED: "Musisz być zalogowany",
  INSUFFICIENT_PERMISSIONS: "Nie masz uprawnień do tej akcji",
  RESOURCE_NOT_FOUND: "Zasób nie został znaleziony",
  DUPLICATE_RESOURCE: "Zasób o tych danych już istnieje",
  INSUFFICIENT_VACATION_DAYS: "Niewystarczająca liczba dni urlopowych",
  OVERLAPPING_VACATION: "Masz już wniosek na ten okres",
  WEEKEND_DATE_INVALID: "Data nie może przypadać na weekend",
  PAST_DATE_INVALID: "Nie można wybrać daty z przeszłości",
};
```

##### 3.5. State Management Patterns

**Global State (Supabase Auth):**

- Session state: `context.locals.user` (server-side via middleware)
- Client-side: Supabase client auto-manages session in localStorage

**Server State (React Query):**

- API data: Managed by React Query cache
- Automatic background refetching
- Optimistic updates for mutations
- Cache invalidation on mutations

**Local State (React useState):**

- Form inputs: React Hook Form
- UI state: Modal open/close, dropdown selections
- Temporary calculations: Live preview w formularzu

**URL State (Astro routing):**

- Current page, filters, pagination
- Query params dla filtrów: `?status=SUBMITTED&teamId=xxx`

#### 4. Responsywność, dostępność i bezpieczeństwo

##### 4.1. Strategia responsywności

**Breakpoints (Tailwind CSS 4):**

```
Mobile:  320px - 639px   (default, no prefix)
Tablet:  640px - 1023px  (sm:)
Desktop: 1024px+         (lg:, xl:, 2xl:)
```

**Responsive Patterns:**

**Nawigacja:**

- Desktop: Poziomy TopBar z pełnym menu
- Mobile: Hamburger icon → Sheet/Drawer z vertical menu

**Tabele:**

- Desktop: Pełna tabela ze wszystkimi kolumnami
- Tablet: Ukrycie mniej istotnych kolumn (np. "Data złożenia"), scroll horizontal
- Mobile: Card layout - każdy wiersz jako osobna karta

**Formularze:**

- Desktop: 2-3 kolumny w grid
- Tablet/Mobile: 1 kolumna, pełna szerokość

**Kalendarz:**

- Desktop: Pełny grid, wszystkie dni widoczne
- Tablet: Sticky column z nazwiskami, scroll horizontal dla dni
- Mobile: Lista accordion - pracownik + rozwijane dni z urlopami

**Dashboard Cards:**

- Desktop: Grid 3 kolumny
- Tablet: Grid 2 kolumny
- Mobile: Stack vertical, 1 kolumna

##### 4.2. Dostępność (WCAG 2.1 AA)

**Perceivable (Postrzegalność):**

- Kontrast kolorów: Minimum 4.5:1 dla tekstu, 3:1 dla UI components
- Alternatywny tekst: Wszystkie ikony z `aria-label`
- Nagłówki semantyczne: Hierarchia h1-h6 na każdej stronie
- Focus indicators: Widoczne ramki focus (Tailwind `focus-visible:ring-2`)

**Operable (Obsługiwalność):**

- Keyboard navigation: Tab, Shift+Tab, Enter, Space, Arrow keys
- Skip links: "Przejdź do treści głównej" na początku każdej strony
- No keyboard traps: Escape zamyka modals, możliwość wyjścia z każdego elementu
- Sufficient time: Brak time-limitów, które nie mogą być wyłączone

**Understandable (Zrozumiałość):**

- Etykiety formularzy: Wszystkie pola z `<Label>` i `htmlFor`
- Komunikaty błędów: Jasne, konkretne, pomocne (np. "Imię musi mieć co najmniej 2 znaki")
- Instrukcje: Helper text dla złożonych pól (np. "Wybierz datę rozpoczęcia urlopu")
- Język: `<html lang="pl">`, wszystkie teksty w języku polskim

**Robust (Solidność):**

- Semantic HTML: `<nav>`, `<main>`, `<article>`, `<aside>`, `<button>`, `<a>`
- ARIA landmarks: `role="navigation"`, `role="main"`, `role="complementary"`
- ARIA roles: `role="table"`, `role="dialog"`, `role="alert"`
- Valid HTML: Brak błędów walidacji W3C

**Przykłady implementacji ARIA:**

```tsx
// TopBar Navigation
<nav role="navigation" aria-label="Nawigacja główna">
  <NavigationMenu>
    <NavigationMenuItem>
      <NavigationMenuLink href="/hr/dashboard">
        Dashboard
      </NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenu>
</nav>

// Tabela użytkowników
<table role="table" aria-label="Lista użytkowników">
  <thead>
    <tr>
      <th scope="col">Imię</th>
      <th scope="col">Nazwisko</th>
      <th scope="col">Email</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Jan</td>
      <td>Kowalski</td>
      <td>jan@example.com</td>
    </tr>
  </tbody>
</table>

// Przycisk usuwania z kontekstem
<Button
  aria-label="Usuń użytkownika Jan Kowalski"
  onClick={handleDelete}
>
  <TrashIcon aria-hidden="true" />
</Button>

// Status announcement dla screen readers
<div role="status" aria-live="polite" aria-atomic="true">
  {remainingDays} dni urlopowych pozostało
</div>

// Modal confirmation
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent
    aria-describedby="dialog-description"
    aria-labelledby="dialog-title"
  >
    <DialogTitle id="dialog-title">
      Usuń użytkownika
    </DialogTitle>
    <DialogDescription id="dialog-description">
      Czy na pewno chcesz usunąć użytkownika Jan Kowalski?
      Ta akcja spowoduje anulowanie wszystkich jego przyszłych urlopów.
    </DialogDescription>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Anuluj
      </Button>
      <Button variant="destructive" onClick={handleConfirm}>
        Usuń użytkownika
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

##### 4.3. Bezpieczeństwo

**Autentykacja:**

- Supabase Auth z JWT tokens
- Tokens w httpOnly cookies (if possible) lub secure localStorage
- Auto-refresh tokenów przez Supabase SDK
- Logout: Wywołanie `supabase.auth.signOut()` + clear cache

**Autoryzacja:**

- Middleware sprawdza rolę przed każdym request
- Role-based routing: `getRouteRole(pathname)` → sprawdzenie `user.role`
- RLS policies w Supabase jako primary defense
- Frontend checks jako UX improvement (ukrywanie przycisków)

**Middleware Flow:**

```typescript
// src/middleware/index.ts
export async function onRequest(context, next) {
  const { url, locals, redirect } = context;
  const supabase = locals.supabase;

  // Publiczne ścieżki
  if (PUBLIC_ROUTES.includes(url.pathname)) {
    return next();
  }

  // Sprawdź autentykację
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login");
  }

  // Pobierz profil
  const profile = await fetchUserProfile(user.id, supabase);
  locals.user = profile;

  // Wymuszana zmiana hasła
  if (profile.requiresPasswordReset && url.pathname !== "/change-password") {
    return redirect("/change-password");
  }

  // Sprawdź uprawnienia do ścieżki
  const requiredRole = getRouteRole(url.pathname);
  if (requiredRole && profile.role !== requiredRole) {
    return redirect(ROLE_DASHBOARDS[profile.role]);
  }

  return next();
}
```

**Route Protection:**

```typescript
const ROUTE_ROLES: Record<string, Role> = {
  "/admin": "ADMINISTRATOR",
  "/hr": "HR",
  "/employee": "EMPLOYEE",
};

function getRouteRole(pathname: string): Role | null {
  for (const [route, role] of Object.entries(ROUTE_ROLES)) {
    if (pathname.startsWith(route)) {
      return role;
    }
  }
  return null;
}
```

**XSS Prevention:**

- Astro auto-escapes output
- React auto-escapes JSX
- Nie używać `dangerouslySetInnerHTML` bez sanitization
- Walidacja wszystkich user inputs z Zod

**CSRF Protection:**

- Supabase SDK automatycznie dodaje CSRF protection
- SameSite cookies dla session tokens

#### 5. Komponenty architektoniczne

##### 5.1. Layout Components

**MainLayout.astro** - Główny layout dla zalogowanych użytkowników:

```astro
---
interface Props {
  title: string;
  role: Role;
}
const { title, role } = Astro.props;
const user = Astro.locals.user;
---

<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} | VacationPlanner</title>
  </head>
  <body>
    <a href="#main-content" class="skip-link">Przejdź do treści głównej</a>
    <TopBar role={role} user={user} client:load />
    <main id="main-content" role="main">
      <Breadcrumbs />
      <slot />
    </main>
    <footer role="contentinfo">
      <p>&copy; 2026 VacationPlanner</p>
    </footer>
  </body>
</html>
```

**AuthLayout.astro** - Layout dla stron publicznych (login):

```astro
---
interface Props {
  title: string;
}
const { title } = Astro.props;
---

<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} | VacationPlanner</title>
  </head>
  <body class="bg-gray-50">
    <div class="min-h-screen flex items-center justify-center py-12 px-4">
      <div class="max-w-md w-full">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold">VacationPlanner</h1>
        </div>
        <slot />
      </div>
    </div>
  </body>
</html>
```

##### 5.2. Navigation Components

**TopBar.tsx** - Główna nawigacja z Shadcn/ui Navigation Menu:

- Logo aplikacji (po lewej)
- Navigation Menu (center/left) - dynamiczne według roli
- User dropdown (po prawej): [User name] ▼ → Profil, Wyloguj
- Mobile: Hamburger icon → Sheet/Drawer

**Breadcrumbs.tsx** - Ścieżka nawigacji:

- Wykorzystuje Shadcn/ui Breadcrumb component
- Auto-generowanie na podstawie URL
- ARIA: `aria-label="breadcrumb"`

##### 5.3. Custom Shared Components

**LoadingState.tsx** - Uniwersalny komponent ładowania:

```typescript
interface LoadingStateProps {
  variant: "skeleton-table" | "skeleton-form" | "skeleton-card" | "spinner";
  rows?: number;
}
```

**ErrorBoundary.tsx** - React Error Boundary:

```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}
// Features: Wyświetlanie friendly error message, przycisk "Spróbuj ponownie"
```

**ConfirmDialog.tsx** - Modal potwierdzenia:

```typescript
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
}
```

**StatusBadge.tsx** - Badge dla statusów:

```typescript
interface StatusBadgeProps {
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
}
// Kolory: SUBMITTED (niebieski), APPROVED (zielony), REJECTED (czerwony), CANCELLED (szary)
```

**VacationDaysCounter.tsx** - Wizualizacja dni urlopowych:

```typescript
interface VacationDaysCounterProps {
  totalDays: number;
  remainingCurrentYearDays: number;
  remainingCarryoverDays: number;
  carryoverExpiresAt: string;
}
// Features: Główny licznik, breakdown, progress bar, ostrzeżenie o wygasających dniach
```

##### 5.4. Role-specific Components

**Admin:**

- `AdminDashboard.tsx` - Statystyki i ostatnie aktywności
- `UsersTable.tsx` - Tabela użytkowników z sortowaniem, filtrowaniem
- `UserForm.tsx` - Formularz dodawania/edycji użytkownika

**HR:**

- `HRDashboard.tsx` - Oczekujące wnioski, statystyki zespołów
- `VacationRequestsTable.tsx` - Tabela z zakładkami (statusy) i filtrami
- `ThresholdWarningDialog.tsx` - Modal ostrzeżenia o przekroczeniu progu
- `TeamsList.tsx` - Grid kart zespołów
- `TeamDetail.tsx` - Szczegóły zespołu, członkowie, dodawanie/usuwanie
- `TeamCalendar.tsx` - Kalendarz tabelaryczny
- `SettingsForm.tsx` - Formularz ustawień

**Employee:**

- `EmployeeDashboard.tsx` - Przegląd dni i najbliższych urlopów
- `MyVacationContent.tsx` - Lista wniosków, VacationDaysCounter
- `NewVacationRequestDialog.tsx` - Dialog składania wniosku z live preview
- `EmployeeTeamCalendar.tsx` - Kalendarz własnych zespołów

#### 6. Plan implementacji (8 faz)

**Faza 1: Foundation (Priorytet: WYSOKI)**

- Setup Shadcn/ui + theme configuration
- MainLayout + AuthLayout
- TopBar z Navigation Menu (responsive)
- React Query setup + query client
- Middleware (auth + role-based routing + password reset)
- Custom hooks (useUsers, useVacationRequests, etc.)
- Error handling utilities + ErrorBoundary
- Toast notifications setup

**Faza 2: Admin Panel (Priorytet: WYSOKI)**

- /admin/dashboard
- /admin/users (lista z filtrowaniem)
- /admin/users/new (formularz)
- /admin/users/:id/edit
- Soft-delete functionality

**Faza 3: HR Panel - Core (Priorytet: WYSOKI)**

- /hr/dashboard
- /hr/vacation-requests (zakładki + filtry)
- Approve/Reject + threshold warning dialog
- /hr/teams (lista)
- /hr/teams/:id (szczegóły + członkowie)
- /hr/teams/new
- Add/Remove members

**Faza 4: Employee Panel (Priorytet: WYSOKI)**

- /employee/dashboard
- /employee/vacation (lista + VacationDaysCounter)
- /employee/vacation/new (dialog z live preview)
- Cancel request functionality

**Faza 5: Calendar Views (Priorytet: ŚREDNI)**

- TeamCalendar component (tabelaryczny layout)
- /hr/calendar
- /employee/calendar
- Responsive calendar (mobile list view)

**Faza 6: Settings & Polish (Priorytet: ŚREDNI)**

- /hr/settings
- Loading states (Skeleton components)
- Empty states
- /change-password

**Faza 7: Accessibility & Testing (Priorytet: WYSOKI)**

- WCAG 2.1 AA audit
- Keyboard navigation testing
- Screen reader testing
- Contrast checking
- Focus indicators

**Faza 8: Optimization (Priorytet: NISKI)**

- Performance audit
- Bundle size optimization
- Lighthouse score > 90

</ui_architecture_planning_summary>

## <unresolved_issues>

### Kwestie wymagające dalszych wyjaśnień lub decyzji

1. **Persistencja wyboru zespołu w kalendarzu**
   - **Pytanie**: Czy wybór zespołu w kalendarzu powinien być zapisywany w localStorage/cookies, aby po odświeżeniu strony był zapamiętany?
   - **Alternatywy**:
     - Zawsze pokazywać pierwszy zespół alfabetycznie
     - Zapisywać w localStorage preferencję użytkownika
     - Zapisywać w profilu użytkownika (wymaga nowego pola w bazie)
   - **Wpływ**: UX convenience vs prostota implementacji

2. **Widok "Wszystkie zespoły" dla HR w kalendarzu**
   - **Pytanie**: Jak powinien wyglądać widok zbiorczy dla wszystkich zespołów? Czy jako:
     - Pojedyncza tabela ze wszystkimi pracownikami z wszystkich zespołów (może być bardzo długa)
     - Zakładki/accordion z osobną tabelą dla każdego zespołu
     - Dashboard z mini-kalendarzami dla każdego zespołu
   - **Wpływ**: Użyteczność dla HR, performance z dużą liczbą danych

3. **Mobile view dla kalendarza**
   - **Pytanie**: Czy mobile view kalendarza jako lista accordion (pracownik → rozwijane dni) jest wystarczający, czy potrzeba innej visualizacji?
   - **Alternatywy**:
     - Lista accordion
     - Swipeable cards (jeden pracownik na ekran)
     - Uproszczony timeline view
   - **Wpływ**: Użyteczność na mobile devices

4. **Strategie cache invalidation**
   - **Pytanie**: Czy invalidacja cache powinna być:
     - Agresywna (invalidate wszystkie powiązane queries po każdej mutacji)
     - Selektywna (invalidate tylko bezpośrednio dotknięte queries)
     - Pessimistic (refetch po każdej mutacji)
   - **Wpływ**: Świeżość danych vs liczba requestów do API

5. **Obsługa stref czasowych**
   - **Pytanie**: Czy aplikacja powinna obsługiwać różne strefy czasowe użytkowników?
   - **Kontekst**: PRD nie wspomina o strefach czasowych, ale może być istotne dla distributed teams
   - **Wpływ**: Complexity vs global usability

6. **Limit urlopów "na żądanie" czy wymóg wyprzedzenia**
   - **Pytanie**: Czy można składać wniosek na urlop rozpoczynający się jutro, czy jest wymagane minimum X dni wyprzedzenia?
   - **Kontekst**: PRD mówi "nie można składać wniosków na daty przeszłe", ale nie określa minimum wyprzedzenia
   - **Wpływ**: Business logic w walidacji formularza

7. **Widoczność wniosków "w trakcie" (ongoing)**
   - **Pytanie**: Czy wniosek urlopowy, który jest "w trakcie realizacji" (urlop rozpoczął się, ale jeszcze się nie zakończył) powinien mieć specjalny status lub wyróżnienie w UI?
   - **Kontekst**: API ma statusy SUBMITTED/APPROVED/REJECTED/CANCELLED, ale brak statusu "ONGOING"
   - **Wpływ**: Czytelność kalendarza i listy wniosków

8. **Email notifications (out of scope MVP)**
   - **Pytanie**: Czy interfejs powinien zawierać placeholder/messaging informujący, że powiadomienia email będą dostępne w przyszłości?
   - **Kontekst**: PRD explicitly wymienia to jako out of scope
   - **Wpływ**: Zarządzanie oczekiwaniami użytkowników

9. **Bulk operations dla HR**
   - **Pytanie**: Czy HR powinien móc wykonywać bulk operations (np. zaakceptować wiele wniosków jednocześnie, dodać wielu użytkowników do zespołu naraz)?
   - **Kontekst**: API wspomina batch operations jako "Future Enhancement"
   - **Wpływ**: Efficiency dla HR z dużą liczbą wniosków

10. **Soft-deleted users visibility**
    - **Pytanie**: Czy usunięci użytkownicy powinni być widoczni w:
      - Historycznych danych kalendarza (urlopy z przeszłości)
      - Historycznych wniosków jako "Złożony przez"
      - Listy członków zespołu (historical view)
    - **Kontekst**: PRD mówi "soft-delete", "dane historyczne pozostają", "niewidoczni dla HR i EMPLOYEE"
    - **Wpływ**: Data integrity vs UI clarity

11. **Eksport danych (raportowanie)**
    - **Pytanie**: Czy potrzebna jest funkcjonalność eksportu danych do CSV/PDF (lista użytkowników, raport urlopów)?
    - **Kontekst**: PRD wymienia "Zaawansowane raporty i statystyki" jako out of scope, ale prosty eksport może być użyteczny
    - **Wpływ**: Użyteczność dla HR, complexity

12. **Dark mode**
    - **Pytanie**: Czy aplikacja powinna wspierać dark mode?
    - **Kontekst**: Nie wymienione w PRD, ale może być istotne dla accessibility/user preference
    - **Wpływ**: Effort vs user satisfaction

</unresolved_issues>

</conversation_summary>
