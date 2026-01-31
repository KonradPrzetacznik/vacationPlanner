# Plan implementacji widoku Zarządzania Użytkownikami

## 1. Przegląd

Widok Zarządzania Użytkownikami (`/admin/users`) jest dedykowanym panelem dla Administratorów, umożliwiającym kompleksowe zarządzanie kontami użytkowników w systemie. Widok zapewnia możliwość przeglądania listy wszystkich użytkowników (w tym usuniętych), dodawania nowych kont, edycji danych istniejących użytkowników oraz ich dezaktywacji (soft-delete). Kluczową funkcjonalnością jest zaawansowane filtrowanie i wyszukiwanie użytkowników według roli, statusu oraz danych osobowych, co umożliwia efektywne zarządzanie dużą bazą użytkowników.

## 2. Routing widoku

**Ścieżka:** `/admin/users`

**Dostęp:** Widok jest dostępny wyłącznie dla użytkowników z rolą `ADMINISTRATOR`. Próba dostępu przez użytkowników z innymi rolami powinna skutkować przekierowaniem lub wyświetleniem komunikatu o braku uprawnień.

**Typ:** Strona dynamiczna (server-side rendered) z klientowymi komponentami React dla interaktywności.

## 3. Struktura komponentów

```
UsersPage (Astro)
├── Layout
│   └── Header + Navigation
├── PageHeader (React)
│   ├── Title ("Zarządzanie użytkownikami")
│   └── AddUserButton
├── UsersFilters (React)
│   ├── SearchInput (szukaj po imieniu/nazwisku/emailu)
│   ├── RoleFilter (Select: Wszystkie/ADMINISTRATOR/HR/EMPLOYEE)
│   └── ShowDeletedCheckbox
├── UsersTable (React)
│   ├── TableHeader
│   │   ├── Columns: Imię, Nazwisko, Email, Rola, Status, Akcje
│   │   └── Sortowanie (opcjonalne w MVP)
│   ├── TableBody
│   │   └── UserRow[] (dla każdego użytkownika)
│   │       ├── UserData (imię, nazwisko, email, rola)
│   │       ├── StatusBadge (aktywny/usunięty)
│   │       └── UserActions
│   │           ├── EditButton
│   │           └── DeleteButton
│   └── EmptyState (gdy brak użytkowników)
├── Pagination (React - Shadcn/ui)
│   └── Controls: Poprzednia/Następna strona
├── UserFormDialog (React)
│   ├── DialogTrigger (AddUserButton lub EditButton)
│   ├── DialogContent
│   │   ├── DialogHeader (tytuł: "Dodaj użytkownika" / "Edytuj użytkownika")
│   │   └── UserForm
│   │       ├── FormFields
│   │       │   ├── FirstNameInput
│   │       │   ├── LastNameInput
│   │       │   ├── EmailInput (disabled w trybie edycji)
│   │       │   ├── RoleSelect (disabled gdy edytujesz siebie)
│   │       │   └── TemporaryPasswordInput (tylko w trybie dodawania)
│   │       └── FormActions
│   │           ├── CancelButton
│   │           └── SubmitButton
├── DeleteConfirmDialog (React)
│   ├── DialogTrigger (DeleteButton)
│   ├── DialogContent
│   │   ├── DialogHeader ("Potwierdź usunięcie")
│   │   ├── DialogDescription (ostrzeżenie o anulowaniu urlopów)
│   │   └── DialogActions
│   │       ├── CancelButton
│   │       └── ConfirmButton (destructive)
└── Toaster (Sonner)
    └── Toast notifications (sukces/błąd)
```

## 4. Szczegóły komponentów

### 4.1. UsersPage (Astro)

**Opis:** Główny komponent strony, renderowany po stronie serwera. Odpowiada za wstępne pobranie danych użytkowników i przekazanie ich do komponentów React. Zarządza autoryzacją i przekierowaniami.

**Główne elementy:**
- Layout wrapper z nawigacją
- Server-side data fetching z `/api/users`
- Przekazanie danych do komponentu `UsersManagement` (React)
- Obsługa błędów ładowania

**Obsługiwane zdarzenia:** Brak (komponent statyczny Astro)

**Warunki walidacji:**
- Sprawdzenie czy użytkownik jest zalogowany (middleware)
- Sprawdzenie czy użytkownik ma rolę `ADMINISTRATOR`
- Obsługa błędów API (404, 500)

**Typy:**
- `GetUsersResponseDTO` - odpowiedź z API
- `UserListItemDTO[]` - lista użytkowników

**Propsy:** Brak (główny komponent strony)

### 4.2. UsersManagement (React)

**Opis:** Główny komponent React zarządzający całym widokiem. Koordynuje stan filtrów, paginacji i operacji CRUD. Orkestruje komunikację między podkomponentami.

**Główne elementy:**
- PageHeader z przyciskiem dodawania
- UsersFilters
- UsersTable
- Pagination
- UserFormDialog
- DeleteConfirmDialog

**Obsługiwane zdarzenia:**
- Zmiana filtrów (wyszukiwanie, rola, pokaż usuniętych)
- Zmiana strony paginacji
- Otwarcie/zamknięcie dialogów
- Odświeżenie listy po operacjach CRUD

**Warunki walidacji:**
- Minimalna długość wyszukiwanej frazy (opcjonalnie)
- Walidacja parametrów paginacji

**Typy:**
- `UsersManagementProps` - propsy komponentu
- `UsersFiltersState` - stan filtrów
- `PaginationState` - stan paginacji

**Propsy:**
```typescript
interface UsersManagementProps {
  initialUsers: UserListItemDTO[];
  initialPagination: UsersPaginationDTO;
  currentUserId: string;
}
```

### 4.3. PageHeader (React)

**Opis:** Nagłówek strony zawierający tytuł oraz przycisk dodawania nowego użytkownika.

**Główne elementy:**
- `<h1>` z tytułem "Zarządzanie użytkownikami"
- Button (Shadcn/ui) "Dodaj użytkownika"

**Obsługiwane zdarzenia:**
- onClick przycisku "Dodaj użytkownika" - otwiera UserFormDialog

**Warunki walidacji:** Brak

**Typy:** Brak specyficznych

**Propsy:**
```typescript
interface PageHeaderProps {
  onAddUserClick: () => void;
}
```

### 4.4. UsersFilters (React)

**Opis:** Komponent zawierający wszystkie mechanizmy filtrowania listy użytkowników. Umożliwia wyszukiwanie tekstowe oraz filtrowanie po roli i statusie usunięcia.

**Główne elementy:**
- Input (Shadcn/ui) - pole wyszukiwania z ikoną lupy
- Select (Shadcn/ui) - wybór roli
- Checkbox (Shadcn/ui) - "Pokaż usuniętych użytkowników"
- Button "Wyczyść filtry" (opcjonalnie)

**Obsługiwane zdarzenia:**
- onChange w polu wyszukiwania (debounce 300ms)
- onChange w Select roli
- onChange w Checkbox pokazywania usuniętych
- onClick "Wyczyść filtry"

**Warunki walidacji:**
- Wyszukiwanie: min 0 znaków (puste pole = pokaż wszystkich)
- Role: tylko wartości z enum
- Checkbox: boolean

**Typy:**
```typescript
interface UsersFiltersProps {
  searchQuery: string;
  roleFilter: "ALL" | "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  showDeleted: boolean;
  onSearchChange: (query: string) => void;
  onRoleFilterChange: (role: UsersFiltersProps["roleFilter"]) => void;
  onShowDeletedChange: (show: boolean) => void;
  onClearFilters?: () => void;
}
```

**Typy:**
- `UsersFiltersState` (ViewModel)

**Propsy:** Zobacz interfejs wyżej

### 4.5. UsersTable (React)

**Opis:** Tabela wyświetlająca listę użytkowników z możliwością wykonywania akcji (edycja, usunięcie). Wyróżnia wizualnie usuniętych użytkowników.

**Główne elementy:**
- Table (Shadcn/ui)
  - TableHeader z kolumnami: Imię, Nazwisko, Email, Rola, Status, Akcje
  - TableBody z TableRow dla każdego użytkownika
  - TableCell dla każdego pola
- Badge (Shadcn/ui) dla statusu (Aktywny/Usunięty)
- Badge (Shadcn/ui) dla roli
- DropdownMenu (Shadcn/ui) dla akcji lub Button inline

**Obsługiwane zdarzenia:**
- onClick "Edytuj" - otwiera UserFormDialog z danymi użytkownika
- onClick "Usuń" - otwiera DeleteConfirmDialog
- Hover effects na wierszach

**Warunki walidacji:**
- Nie można edytować własnej roli
- Nie można usunąć siebie (opcjonalne w MVP)
- Przyciski disabled dla już usuniętych użytkowników

**Typy:**
- `UserListItemDTO[]` - dane użytkowników
- `UserRowProps` - propsy pojedynczego wiersza

**Propsy:**
```typescript
interface UsersTableProps {
  users: UserListItemDTO[];
  currentUserId: string;
  isLoading?: boolean;
  onEditUser: (user: UserListItemDTO) => void;
  onDeleteUser: (userId: string) => void;
}

interface UserRowProps {
  user: UserListItemDTO;
  isCurrentUser: boolean;
  onEdit: () => void;
  onDelete: () => void;
}
```

### 4.6. UserFormDialog (React)

**Opis:** Dialog (modal) zawierający formularz dodawania lub edycji użytkownika. Obsługuje walidację i komunikację z API.

**Główne elementy:**
- Dialog (Shadcn/ui)
- DialogContent
  - DialogHeader z tytułem dynamicznym
  - Form (react-hook-form + zod)
    - Input dla firstName
    - Input dla lastName
    - Input dla email (disabled w trybie edycji)
    - Select dla role (disabled dla własnej roli)
    - Input dla temporaryPassword (tylko w trybie dodawania)
  - DialogFooter z przyciskami Cancel/Submit

**Obsługiwane zdarzenia:**
- onSubmit formularza
- onChange w polach (walidacja live)
- onOpenChange dialogu
- onClick Cancel
- onClick Submit

**Warunki walidacji:**
- **firstName**: wymagane, min 1 znak, max 100 znaków, trim
- **lastName**: wymagane, min 1 znak, max 100 znaków, trim
- **email**: wymagane, poprawny format email, lowercase, trim (tylko przy dodawaniu)
- **role**: wymagane, wartość z enum ["ADMINISTRATOR", "HR", "EMPLOYEE"]
- **temporaryPassword**: wymagane przy dodawaniu, min 8 znaków, max 100 znaków
- Nie można zmienić własnej roli (sprawdzenie po stronie UI i API)
- Email musi być unikalny (sprawdzenie po stronie API)

**Typy:**
- `UserFormDialogProps`
- `UserFormValues` (schemat formularza)
- `CreateUserDTO` lub `UpdateUserDTO` (żądanie API)
- `CreateUserResponseDTO` lub `UpdateUserResponseDTO` (odpowiedź API)

**Propsy:**
```typescript
interface UserFormDialogProps {
  mode: "create" | "edit";
  user?: UserListItemDTO; // wymagane w trybie edit
  currentUserId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface UserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  temporaryPassword?: string; // tylko w trybie create
}
```

### 4.7. DeleteConfirmDialog (React)

**Opis:** Dialog potwierdzenia usunięcia użytkownika. Informuje o konsekwencjach (anulowanie przyszłych urlopów).

**Główne elementy:**
- AlertDialog (Shadcn/ui)
- AlertDialogContent
  - AlertDialogHeader
    - AlertDialogTitle: "Potwierdź usunięcie użytkownika"
    - AlertDialogDescription: Ostrzeżenie o skutkach
  - AlertDialogFooter
    - AlertDialogCancel: "Anuluj"
    - AlertDialogAction: "Usuń" (destructive variant)

**Obsługiwane zdarzenia:**
- onClick "Usuń" - wywołuje DELETE API
- onClick "Anuluj" - zamyka dialog
- onOpenChange

**Warunki walidacji:**
- userId musi być poprawnym UUID
- Użytkownik musi istnieć i nie być już usuniętym (sprawdza API)

**Typy:**
- `DeleteConfirmDialogProps`
- `DeleteUserResponseDTO`

**Propsy:**
```typescript
interface DeleteConfirmDialogProps {
  userId: string;
  userName: string; // do wyświetlenia w komunikacie
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (result: DeleteUserResponseDTO) => void;
}
```

### 4.8. Pagination (React)

**Opis:** Komponent paginacji wykorzystujący Shadcn/ui Pagination lub własną implementację z buttonami.

**Główne elementy:**
- Pagination wrapper
- PaginationPrevious button
- PaginationContent (liczby stron lub info)
- PaginationNext button
- Info tekstowa: "Showing X-Y of Z users"

**Obsługiwane zdarzenia:**
- onClick Previous (jeśli offset > 0)
- onClick Next (jeśli są kolejne strony)
- onClick konkretnej strony (opcjonalnie)

**Warunki walidacji:**
- offset >= 0
- limit między 1 a 100
- Previous disabled gdy offset = 0
- Next disabled gdy offset + limit >= total

**Typy:**
- `PaginationProps`
- `UsersPaginationDTO`

**Propsy:**
```typescript
interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (newOffset: number) => void;
}
```

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

**UserListItemDTO** - reprezentuje pojedynczego użytkownika na liście:
```typescript
interface UserListItemDTO {
  id: string;                                        // UUID użytkownika
  firstName: string;                                 // Imię
  lastName: string;                                  // Nazwisko
  email: string;                                     // Email (unikalny)
  role: "ADMINISTRATOR" | "HR" | "EMPLOYEE";        // Rola
  deletedAt: string | null;                         // Data usunięcia (null = aktywny)
  createdAt: string;                                // Data utworzenia (ISO 8601)
  updatedAt: string;                                // Data ostatniej aktualizacji
}
```

**GetUsersResponseDTO** - odpowiedź z GET /api/users:
```typescript
interface GetUsersResponseDTO {
  data: UserListItemDTO[];
  pagination: UsersPaginationDTO;
}
```

**UsersPaginationDTO** - metadane paginacji:
```typescript
interface UsersPaginationDTO {
  total: number;    // Całkowita liczba użytkowników
  limit: number;    // Liczba użytkowników na stronę
  offset: number;   // Przesunięcie (od którego rekordu)
}
```

**CreateUserDTO** - żądanie utworzenia użytkownika (POST /api/users):
```typescript
interface CreateUserDTO {
  firstName: string;
  lastName: string;
  email: string;
  role?: "ADMINISTRATOR" | "HR" | "EMPLOYEE";  // default: EMPLOYEE
  temporaryPassword: string;
}
```

**CreateUserResponseDTO** - odpowiedź po utworzeniu:
```typescript
interface CreateUserResponseDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  requiresPasswordReset: boolean;
  createdAt: string;
}
```

**UpdateUserDTO** - żądanie aktualizacji (PATCH /api/users/:id):
```typescript
interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  role?: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
}
```

**UpdateUserResponseDTO** - odpowiedź po aktualizacji:
```typescript
interface UpdateUserResponseDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  updatedAt: string;
}
```

**DeleteUserResponseDTO** - odpowiedź po usunięciu (DELETE /api/users/:id):
```typescript
interface DeleteUserResponseDTO {
  message: string;
  id: string;
  deletedAt: string;
  cancelledVacations: number;
}
```

### 5.2. Nowe typy (ViewModel - do stworzenia)

**UsersFiltersState** - stan filtrów w UI:
```typescript
interface UsersFiltersState {
  searchQuery: string;                               // Fraza wyszukiwania
  roleFilter: "ALL" | "ADMINISTRATOR" | "HR" | "EMPLOYEE";  // Filtr roli
  showDeleted: boolean;                              // Czy pokazywać usuniętych
}
```

**PaginationState** - stan paginacji w UI:
```typescript
interface PaginationState {
  limit: number;      // Liczba na stronę (default: 50)
  offset: number;     // Obecne przesunięcie
  total: number;      // Całkowita liczba (z API)
}
```

**UserFormMode** - tryb formularza:
```typescript
type UserFormMode = "create" | "edit";
```

**UserFormValues** - wartości formularza (react-hook-form):
```typescript
interface UserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  temporaryPassword?: string;  // tylko w trybie create
}
```

**UserFormDialogState** - stan dialogu formularza:
```typescript
interface UserFormDialogState {
  isOpen: boolean;
  mode: UserFormMode;
  editingUser?: UserListItemDTO;
}
```

**DeleteDialogState** - stan dialogu usuwania:
```typescript
interface DeleteDialogState {
  isOpen: boolean;
  userId?: string;
  userName?: string;
}
```

## 6. Zarządzanie stanem

### 6.1. Stan lokalny (React useState/useReducer)

**UsersManagement Component:**
- `users` - aktualna lista użytkowników (UserListItemDTO[])
- `pagination` - stan paginacji (PaginationState)
- `filters` - stan filtrów (UsersFiltersState)
- `isLoading` - flaga ładowania
- `userFormDialog` - stan dialogu formularza (UserFormDialogState)
- `deleteDialog` - stan dialogu usuwania (DeleteDialogState)

### 6.2. Custom Hook: useUsersManagement

**Cel:** Enkapsulacja logiki zarządzania stanem i operacji CRUD.

**Funkcjonalność:**
```typescript
function useUsersManagement(
  initialUsers: UserListItemDTO[],
  initialPagination: UsersPaginationDTO,
  currentUserId: string
) {
  // Stan
  const [users, setUsers] = useState<UserListItemDTO[]>(initialUsers);
  const [pagination, setPagination] = useState<PaginationState>(initialPagination);
  const [filters, setFilters] = useState<UsersFiltersState>({
    searchQuery: "",
    roleFilter: "ALL",
    showDeleted: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Funkcje
  const fetchUsers = async () => { /* ... */ };
  const createUser = async (data: CreateUserDTO) => { /* ... */ };
  const updateUser = async (userId: string, data: UpdateUserDTO) => { /* ... */ };
  const deleteUser = async (userId: string) => { /* ... */ };
  
  // Effects
  useEffect(() => {
    // Fetch users gdy zmienią się filtry lub paginacja
    fetchUsers();
  }, [filters, pagination.offset]);

  return {
    users,
    pagination,
    filters,
    isLoading,
    setFilters,
    setPagination,
    createUser,
    updateUser,
    deleteUser,
    refreshUsers: fetchUsers,
  };
}
```

### 6.3. Custom Hook: useDebounce

**Cel:** Debouncing wyszukiwania, aby nie wysyłać zbyt wielu zapytań.

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**Użycie:** W UsersFilters dla searchQuery z delay 300ms.

## 7. Integracja API

### 7.1. GET /api/users - Pobieranie listy użytkowników

**Request:**
- Method: GET
- Query params:
  - `limit` (number, default: 50)
  - `offset` (number, default: 0)
  - `role` (string, optional): ADMINISTRATOR | HR | EMPLOYEE
  - `includeDeleted` (boolean, default: false)
  - `teamId` (UUID, optional) - nieużywane w tym widoku

**Response (200 OK):**
```typescript
GetUsersResponseDTO {
  data: UserListItemDTO[],
  pagination: UsersPaginationDTO
}
```

**Error Responses:**
- 401 Unauthorized - nie zalogowany
- 403 Forbidden - brak uprawnień (nie ADMINISTRATOR)
- 500 Internal Server Error

**Kiedy wywołujemy:**
- Initial load (server-side w Astro)
- Po zmianie filtrów (client-side)
- Po zmianie strony paginacji
- Po udanym create/update/delete (refresh)

**Implementacja client-side:**
```typescript
const fetchUsers = async (
  filters: UsersFiltersState,
  pagination: { limit: number; offset: number }
): Promise<GetUsersResponseDTO> => {
  const params = new URLSearchParams({
    limit: pagination.limit.toString(),
    offset: pagination.offset.toString(),
    includeDeleted: filters.showDeleted.toString(),
  });

  if (filters.roleFilter !== "ALL") {
    params.append("role", filters.roleFilter);
  }

  // Note: searchQuery będzie filtrowany po stronie klienta
  // lub wymaga dodania search param do API (poza zakresem MVP)

  const response = await fetch(`/api/users?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }

  return response.json();
};
```

**Uwaga:** Wyszukiwanie tekstowe (`searchQuery`) może być implementowane:
1. Client-side filtering (prostsze, wystarczy dla MVP do ~1000 userów)
2. Server-side search param (wymaga modyfikacji API - opcjonalne)

### 7.2. POST /api/users - Tworzenie użytkownika

**Request:**
- Method: POST
- Headers: `Content-Type: application/json`
- Body: `CreateUserDTO`

**Response (201 Created):**
```typescript
CreateUserResponseDTO
```

**Error Responses:**
- 400 Bad Request - błędy walidacji lub email już istnieje
- 401 Unauthorized
- 403 Forbidden - nie ADMINISTRATOR
- 500 Internal Server Error

**Kiedy wywołujemy:**
- Po submicie formularza dodawania użytkownika

**Implementacja:**
```typescript
const createUser = async (data: CreateUserDTO): Promise<CreateUserResponseDTO> => {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Nie udało się utworzyć użytkownika");
  }

  return response.json();
};
```

### 7.3. PATCH /api/users/:id - Aktualizacja użytkownika

**Request:**
- Method: PATCH
- Headers: `Content-Type: application/json`
- Path param: `id` (UUID)
- Body: `UpdateUserDTO`

**Response (200 OK):**
```typescript
UpdateUserResponseDTO
```

**Error Responses:**
- 400 Bad Request - błędy walidacji, próba zmiany własnej roli
- 401 Unauthorized
- 403 Forbidden - brak uprawnień
- 404 Not Found - użytkownik nie istnieje
- 500 Internal Server Error

**Kiedy wywołujemy:**
- Po submicie formularza edycji użytkownika

**Implementacja:**
```typescript
const updateUser = async (
  userId: string,
  data: UpdateUserDTO
): Promise<UpdateUserResponseDTO> => {
  const response = await fetch(`/api/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Nie udało się zaktualizować użytkownika");
  }

  return response.json();
};
```

### 7.4. DELETE /api/users/:id - Usuwanie użytkownika (soft-delete)

**Request:**
- Method: DELETE
- Path param: `id` (UUID)

**Response (200 OK):**
```typescript
DeleteUserResponseDTO {
  message: string,
  id: string,
  deletedAt: string,
  cancelledVacations: number
}
```

**Error Responses:**
- 401 Unauthorized
- 403 Forbidden - nie ADMINISTRATOR
- 404 Not Found - użytkownik nie istnieje
- 500 Internal Server Error

**Kiedy wywołujemy:**
- Po potwierdzeniu w DeleteConfirmDialog

**Implementacja:**
```typescript
const deleteUser = async (userId: string): Promise<DeleteUserResponseDTO> => {
  const response = await fetch(`/api/users/${userId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Nie udało się usunąć użytkownika");
  }

  return response.json();
};
```

## 8. Interakcje użytkownika

### 8.1. Wyszukiwanie użytkowników

**Akcja:** Użytkownik wpisuje tekst w pole wyszukiwania.

**Oczekiwany wynik:**
1. Po 300ms debounce, lista użytkowników jest filtrowana
2. Filtrowanie odbywa się po: firstName, lastName, email (case-insensitive)
3. Jeśli brak wyników, wyświetlany jest EmptyState
4. Licznik wyników aktualizuje się w paginacji

**Implementacja:**
- useDebounce hook dla searchQuery
- Client-side filtering tablicy users lub server-side call
- Update stanu users

### 8.2. Filtrowanie po roli

**Akcja:** Użytkownik wybiera rolę z dropdown (Wszystkie/ADMINISTRATOR/HR/EMPLOYEE).

**Oczekiwany wynik:**
1. Natychmiastowe wywołanie API z parametrem `role`
2. Offset resetuje się do 0 (pierwsza strona)
3. Lista użytkowników aktualizuje się
4. Select pokazuje wybraną wartość

**Implementacja:**
- onChange na Select
- Update filters.roleFilter
- useEffect wywołuje fetchUsers z nowym filtrem

### 8.3. Pokazywanie/ukrywanie usuniętych użytkowników

**Akcja:** Użytkownik zaznacza/odznacza checkbox "Pokaż usuniętych użytkowników".

**Oczekiwany wynik:**
1. API call z `includeDeleted=true/false`
2. Offset resetuje się do 0
3. Lista aktualizuje się
4. Usunięci użytkownicy są wizualnie wyróżnieni (opacity, wyszarzenie, badge)

**Implementacja:**
- onChange na Checkbox
- Update filters.showDeleted
- useEffect wywołuje fetchUsers

### 8.4. Paginacja - zmiana strony

**Akcja:** Użytkownik klika "Następna" lub "Poprzednia" strona.

**Oczekiwany wynik:**
1. API call z nowym offset
2. Lista użytkowników aktualizuje się
3. Przyciski Previous/Next są disabled jeśli brak kolejnych/poprzednich stron
4. Informacja "Showing X-Y of Z" aktualizuje się
5. Scroll do góry strony (optional)

**Implementacja:**
- onClick Previous: offset -= limit
- onClick Next: offset += limit
- Update pagination.offset
- useEffect wywołuje fetchUsers

### 8.5. Dodawanie nowego użytkownika

**Akcja:** Użytkownik klika "Dodaj użytkownika".

**Oczekiwany wynik:**
1. Otwiera się UserFormDialog w trybie "create"
2. Formularz jest pusty
3. Wszystkie pola są edytowalne
4. Pole "Hasło tymczasowe" jest widoczne

**Po wypełnieniu i kliknięciu "Zapisz":**
1. Walidacja formularza (react-hook-form + zod)
2. POST request do /api/users
3. W przypadku sukcesu:
   - Toast success: "Użytkownik został utworzony"
   - Dialog się zamyka
   - Lista użytkowników odświeża się
   - Nowy użytkownik jest widoczny na liście
4. W przypadku błędu:
   - Toast error z opisem błędu
   - Formularz pozostaje otwarty
   - Błędy walidacji pod polami (np. "Email już istnieje")

**Implementacja:**
- Dialog state: isOpen, mode="create"
- Form submission handler wywołuje createUser
- Success: toast + closeDialog + refreshUsers
- Error: toast + show error in form

### 8.6. Edycja użytkownika

**Akcja:** Użytkownik klika "Edytuj" przy użytkowniku.

**Oczekiwany wynik:**
1. Otwiera się UserFormDialog w trybie "edit"
2. Formularz jest wypełniony danymi użytkownika
3. Pole "Email" jest disabled
4. Pole "Hasło tymczasowe" jest ukryte
5. Pole "Rola" jest disabled jeśli edytujesz siebie

**Po edycji i kliknięciu "Zapisz":**
1. Walidacja formularza
2. PATCH request do /api/users/:id
3. W przypadku sukcesu:
   - Toast success: "Dane użytkownika zostały zaktualizowane"
   - Dialog się zamyka
   - Lista użytkowników odświeża się lub aktualizuje lokalnie
4. W przypadku błędu:
   - Toast error
   - Formularz pozostaje otwarty

**Implementacja:**
- Dialog state: isOpen, mode="edit", editingUser=UserListItemDTO
- Form defaultValues z editingUser
- Conditional rendering: email disabled, role disabled if isCurrentUser
- Form submission handler wywołuje updateUser

### 8.7. Usuwanie użytkownika

**Akcja:** Użytkownik klika "Usuń" przy użytkowniku.

**Oczekiwany wynik:**
1. Otwiera się DeleteConfirmDialog
2. Dialog zawiera:
   - Tytuł: "Potwierdź usunięcie użytkownika"
   - Opis: "Czy na pewno chcesz usunąć użytkownika [Imię Nazwisko]? Ta akcja spowoduje dezaktywację konta oraz automatyczne anulowanie wszystkich przyszłych urlopów tego użytkownika."
   - Przyciski: "Anuluj" (secondary), "Usuń" (destructive)

**Po kliknięciu "Usuń":**
1. DELETE request do /api/users/:id
2. W przypadku sukcesu:
   - Toast success: "Użytkownik został usunięty. Anulowano X przyszłych urlopów."
   - Dialog się zamyka
   - Lista użytkowników odświeża się
   - Jeśli showDeleted=false, użytkownik znika z listy
   - Jeśli showDeleted=true, użytkownik jest wizualnie wyróżniony jako usunięty
3. W przypadku błędu:
   - Toast error
   - Dialog się zamyka

**Implementacja:**
- DeleteDialog state: isOpen, userId, userName
- Confirmation handler wywołuje deleteUser
- Success: toast z info o anulowanych urlopach + closeDialog + refreshUsers
- Error: toast + closeDialog

### 8.8. Anulowanie operacji w dialogach

**Akcja:** Użytkownik klika "Anuluj" lub zamyka dialog (X, ESC, click outside).

**Oczekiwany wynik:**
1. Dialog się zamyka
2. Żadne zmiany nie są zapisywane
3. Stan formularza jest resetowany

**Implementacja:**
- onOpenChange(false) zamyka dialog
- Form reset on close

## 9. Warunki i walidacja

### 9.1. Warunki dostępu do widoku

**Komponent:** UsersPage (Astro)

**Warunki:**
- Użytkownik musi być zalogowany (middleware)
- Użytkownik musi mieć rolę `ADMINISTRATOR`

**Jak weryfikujemy:**
- Middleware sprawdza sesję
- Server-side w Astro sprawdzamy role z context.locals.user lub API call
- Jeśli nie ADMINISTRATOR: redirect do / lub strona błędu 403

**Wpływ na UI:**
- Jeśli brak dostępu: użytkownik nie widzi strony, jest przekierowany

### 9.2. Warunki wyświetlania elementów UI

**Przycisk "Edytuj rolę":**
- Disabled jeśli edytujesz siebie (currentUserId === user.id)
- Weryfikacja: porównanie id w UI

**Przycisk "Usuń":**
- Opcjonalnie hidden/disabled jeśli usuwasz siebie
- Hidden dla już usuniętych użytkowników (gdy deletedAt !== null)
- Weryfikacja: sprawdzenie deletedAt i id

**Pole "Rola" w formularzu edycji:**
- Disabled jeśli currentUserId === editingUser.id
- Weryfikacja: porównanie id

**Pole "Email" w formularzu edycji:**
- Zawsze disabled (email nie może być edytowany)

**Pole "Hasło tymczasowe":**
- Widoczne tylko w trybie "create"
- Weryfikacja: mode === "create"

### 9.3. Walidacja formularza dodawania użytkownika

**Komponent:** UserFormDialog

**Schema (Zod):**
```typescript
const createUserFormSchema = z.object({
  firstName: z
    .string()
    .min(1, "Imię jest wymagane")
    .max(100, "Imię może mieć maksymalnie 100 znaków")
    .trim(),
  lastName: z
    .string()
    .min(1, "Nazwisko jest wymagane")
    .max(100, "Nazwisko może mieć maksymalnie 100 znaków")
    .trim(),
  email: z
    .string()
    .email("Nieprawidłowy format email")
    .toLowerCase()
    .trim(),
  role: z
    .enum(["ADMINISTRATOR", "HR", "EMPLOYEE"])
    .default("EMPLOYEE"),
  temporaryPassword: z
    .string()
    .min(8, "Hasło musi mieć minimum 8 znaków")
    .max(100, "Hasło może mieć maksymalnie 100 znaków"),
});
```

**Kiedy walidujemy:**
- Live validation on blur (react-hook-form)
- Full validation on submit
- Server-side validation w API (duplikat)

**Komunikaty błędów:**
- Pod każdym polem (FormMessage z Shadcn/ui)
- Toast dla błędów API (np. "Email już istnieje")

**Wpływ na UI:**
- Pola z błędami mają czerwone obramowanie
- FormMessage wyświetla tekst błędu
- Przycisk Submit jest disabled podczas submitu (isSubmitting)

### 9.4. Walidacja formularza edycji użytkownika

**Schema (Zod):**
```typescript
const updateUserFormSchema = z.object({
  firstName: z
    .string()
    .min(1, "Imię nie może być puste")
    .max(100, "Imię może mieć maksymalnie 100 znaków")
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(1, "Nazwisko nie może być puste")
    .max(100, "Nazwisko może mieć maksymalnie 100 znaków")
    .trim()
    .optional(),
  role: z
    .enum(["ADMINISTRATOR", "HR", "EMPLOYEE"])
    .optional(),
})
.refine((data) => Object.keys(data).length > 0, {
  message: "Przynajmniej jedno pole musi zostać zmienione",
});
```

**Dodatkowa walidacja:**
- Nie można zmienić własnej roli (UI i API)
- Email jest disabled więc nie może być zmieniony

**Wpływ na UI:**
- Podobnie jak w formularzu dodawania
- Pole "Rola" disabled jeśli isCurrentUser

### 9.5. Walidacja filtrów

**SearchQuery:**
- Min 0 znaków (puste = pokaż wszystkich)
- Max 255 znaków (opcjonalnie)
- Trim before search

**RoleFilter:**
- Tylko wartości z enum lub "ALL"
- Select nie pozwala na inne wartości

**ShowDeleted:**
- Boolean checkbox

**Wpływ na UI:**
- Filtry nie blokują UI, zawsze można je zmienić
- Błędy API (np. timeout) są wyświetlane jako toast

### 9.6. Walidacja paginacji

**Limit:**
- Min 1, max 100
- Default 50

**Offset:**
- Min 0
- Musi być wielokrotnością limit (opcjonalnie)

**Wpływ na UI:**
- Previous disabled gdy offset = 0
- Next disabled gdy offset + limit >= total
- Przycisk Submit jest disabled gdy brak zmian w formularzu (opcjonalnie)

## 10. Obsługa błędów

### 10.1. Błędy ładowania strony (server-side)

**Scenariusz:** Nie udało się pobrać listy użytkowników podczas initial load.

**Obsługa:**
- Astro page wyświetla komunikat błędu zamiast listy
- Komunikat: "Nie udało się załadować użytkowników. Spróbuj odświeżyć stronę."
- Opcjonalnie przycisk "Spróbuj ponownie"

**Implementacja:**
```typescript
// W UsersPage.astro
let users: UserListItemDTO[] = [];
let pagination: UsersPaginationDTO | null = null;
let errorMessage: string | null = null;

try {
  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error("Failed to fetch");
  const data = await response.json();
  users = data.data;
  pagination = data.pagination;
} catch (error) {
  errorMessage = "Nie udało się załadować użytkowników.";
}
```

### 10.2. Błędy API podczas operacji (client-side)

**Scenariusze:**
1. **Network error** - brak połączenia
2. **401 Unauthorized** - sesja wygasła
3. **403 Forbidden** - brak uprawnień (nie powinno się zdarzyć)
4. **404 Not Found** - użytkownik nie istnieje
5. **400 Bad Request** - błędy walidacji, email już istnieje
6. **500 Internal Server Error** - błąd serwera

**Obsługa:**
- Try-catch w każdej funkcji API
- Toast error z komunikatem
- Log do console.error
- Rollback stanu UI jeśli potrzeba

**Komunikaty:**
- 401: "Sesja wygasła. Zaloguj się ponownie." + redirect do /login
- 403: "Brak uprawnień do wykonania tej operacji."
- 404: "Użytkownik nie został znaleziony."
- 400: Konkretny komunikat z API (np. "Email już istnieje")
- 500: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Network: "Brak połączenia z serwerem."

**Implementacja:**
```typescript
try {
  await createUser(data);
  toast.success("Użytkownik został utworzony");
  closeDialog();
  refreshUsers();
} catch (error) {
  const message = error instanceof Error ? error.message : "Nieznany błąd";
  toast.error(message);
  console.error("Create user error:", error);
}
```

### 10.3. Błędy walidacji formularza

**Scenariusz:** Użytkownik próbuje zapisać formularz z błędnymi danymi.

**Obsługa:**
- React-hook-form + Zod automatycznie blokuje submit
- Komunikaty błędów pod polami (FormMessage)
- Pole z błędem ma czerwone obramowanie
- Focus na pierwszym polu z błędem

**Nie wywołujemy API** dopóki walidacja nie przejdzie.

### 10.4. Błędy stanu (Edge cases)

**Próba edycji usuniętego użytkownika:**
- API zwraca 404
- Toast: "Użytkownik został już usunięty"
- Refresh listy

**Próba usunięcia już usuniętego użytkownika:**
- API zwraca 404
- Toast: "Użytkownik został już usunięty"
- Refresh listy

**Próba zmiany własnej roli:**
- UI blokuje (disabled field)
- Jeśli ktoś ominie UI: API zwraca 400
- Toast: "Nie możesz zmienić własnej roli"

**Email już istnieje:**
- API zwraca 400 z komunikatem
- Toast: "Użytkownik z tym adresem email już istnieje"
- Formularz pozostaje otwarty, focus na polu email

### 10.5. Timeout i Slow Network

**Scenariusz:** Request trwa zbyt długo (>30s).

**Obsługa:**
- Browser timeout (domyślnie)
- Loading state w UI (spinner, disabled buttons)
- Komunikat: "Operacja trwa dłużej niż zwykle..."
- Po timeout: Toast error "Request timeout. Spróbuj ponownie."

**Implementacja:**
- isLoading state dla każdej operacji
- Conditional rendering: spinner w przyciskach, skeleton w tabeli

### 10.6. Empty States

**Brak użytkowników (po filtrach):**
- EmptyState component w UsersTable
- Komunikat: "Nie znaleziono użytkowników spełniających kryteria."
- Przycisk "Wyczyść filtry" jeśli filtry są aktywne

**Brak użytkowników w systemie (edge case):**
- EmptyState: "Brak użytkowników w systemie."
- Przycisk "Dodaj pierwszego użytkownika"

## 11. Kroki implementacji

### Krok 1: Utworzenie komponentów UI z Shadcn/ui

**Cel:** Zainstalowanie brakujących komponentów z Shadcn/ui.

**Działania:**
1. Zainstaluj komponenty Shadcn/ui:
   ```bash
   npx shadcn@latest add table
   npx shadcn@latest add dialog
   npx shadcn@latest add alert-dialog
   npx shadcn@latest add select
   npx shadcn@latest add checkbox
   npx shadcn@latest add badge
   npx shadcn@latest add dropdown-menu
   ```
2. Sprawdź czy istnieją już: button, input, form, card, sonner (powinny)

### Krok 2: Definicja typów ViewModel

**Cel:** Utworzenie pliku z typami specyficznymi dla widoku.

**Działania:**
1. Utwórz plik: `src/lib/types/users-management.types.ts`
2. Zdefiniuj typy:
   - `UsersFiltersState`
   - `PaginationState`
   - `UserFormMode`
   - `UserFormValues`
   - `UserFormDialogState`
   - `DeleteDialogState`
   - Propsy wszystkich komponentów (interfaces)

### Krok 3: Utworzenie schematów walidacji Zod

**Cel:** Schematy walidacji formularzy dla frontendu.

**Działania:**
1. Utwórz plik: `src/lib/schemas/user-form.schema.ts`
2. Zdefiniuj schematy:
   - `createUserFormSchema` - dla tworzenia użytkownika
   - `updateUserFormSchema` - dla edycji użytkownika
3. Export typów: `CreateUserFormValues`, `UpdateUserFormValues`

### Krok 4: Implementacja Custom Hooks

**Cel:** Enkapsulacja logiki stanu i API calls.

**Działania:**
1. Utwórz plik: `src/lib/hooks/useUsersManagement.ts`
   - Implementuj logikę stanu users, pagination, filters
   - Implementuj funkcje: fetchUsers, createUser, updateUser, deleteUser
   - Implementuj useEffect dla auto-refresh przy zmianach filtrów

2. Utwórz plik: `src/lib/hooks/useDebounce.ts`
   - Implementuj debouncing dla searchQuery

### Krok 5: Implementacja komponentów atomowych

**Cel:** Najmniejsze, reużywalne komponenty.

**Działania:**
1. `src/components/users/StatusBadge.tsx`
   - Badge pokazujący status (Aktywny/Usunięty)
   - Props: isDeleted

2. `src/components/users/RoleBadge.tsx`
   - Badge pokazujący rolę z odpowiednim kolorem
   - Props: role

### Krok 6: Implementacja komponentu UserFormDialog

**Cel:** Dialog do dodawania/edycji użytkowników.

**Działania:**
1. Utwórz plik: `src/components/users/UserFormDialog.tsx`
2. Implementuj:
   - Dialog wrapper (Shadcn/ui Dialog)
   - Form z react-hook-form + zodResolver
   - Pola: firstName, lastName, email, role, temporaryPassword
   - Conditional rendering based on mode (create/edit)
   - Disabled fields: email (edit), role (edit own)
   - Submit handler z API call
   - Error handling i toast notifications
3. Testuj walidację i submit

### Krok 7: Implementacja komponentu DeleteConfirmDialog

**Cel:** Dialog potwierdzenia usunięcia użytkownika.

**Działania:**
1. Utwórz plik: `src/components/users/DeleteConfirmDialog.tsx`
2. Implementuj:
   - AlertDialog (Shadcn/ui)
   - Dynamic content z userName
   - Confirm handler z DELETE API call
   - Success toast z info o anulowanych urlopach
   - Error handling
3. Testuj flow usuwania

### Krok 8: Implementacja komponentu UsersTable

**Cel:** Tabela wyświetlająca listę użytkowników.

**Działania:**
1. Utwórz plik: `src/components/users/UsersTable.tsx`
2. Implementuj:
   - Table z Shadcn/ui (Table, TableHeader, TableBody, TableRow, TableCell)
   - TableHeader z kolumnami
   - TableRow dla każdego użytkownika
   - StatusBadge i RoleBadge w odpowiednich komórkach
   - Actions column z przyciskami Edit/Delete lub DropdownMenu
   - Conditional styling dla usuniętych użytkowników (opacity, color)
   - EmptyState gdy users.length === 0
3. Testuj z mock data

### Krok 9: Implementacja komponentu UsersFilters

**Cel:** Filtry i wyszukiwarka.

**Działania:**
1. Utwórz plik: `src/components/users/UsersFilters.tsx`
2. Implementuj:
   - Input dla searchQuery z ikoną Search (lucide-react)
   - Select dla roleFilter (opcje: Wszystkie, Administrator, HR, Pracownik)
   - Checkbox dla showDeleted
   - Opcjonalnie: przycisk "Wyczyść filtry"
   - onChange handlers przekazane przez props
   - useDebounce dla searchQuery
3. Testuj zmiany filtrów

### Krok 10: Implementacja komponentu Pagination

**Cel:** Nawigacja między stronami listy.

**Działania:**
1. Utwórz plik: `src/components/users/UsersPagination.tsx`
   (lub użyj Shadcn/ui Pagination component)
2. Implementuj:
   - Previous button (disabled gdy offset = 0)
   - Next button (disabled gdy offset + limit >= total)
   - Info tekstowa: "Wyświetlono X-Y z Z użytkowników"
   - onClick handlers dla Previous/Next
3. Testuj nawigację

### Krok 11: Implementacja głównego komponentu UsersManagement

**Cel:** Kompozycja wszystkich komponentów z zarządzaniem stanem.

**Działania:**
1. Utwórz plik: `src/components/users/UsersManagement.tsx`
2. Implementuj:
   - Import i użycie useUsersManagement hook
   - Stan dialogów (userFormDialog, deleteDialog)
   - Renderowanie wszystkich podkomponentów:
     - PageHeader
     - UsersFilters
     - UsersTable
     - UsersPagination
     - UserFormDialog
     - DeleteConfirmDialog
     - Toaster
   - Przekazanie odpowiednich props i handlers
   - Loading state (skeleton lub spinner)
3. Testuj całą kompozycję

### Krok 12: Utworzenie strony Astro

**Cel:** Server-side rendered page z initial data fetch.

**Działania:**
1. Utwórz plik: `src/pages/admin/users.astro`
2. Implementuj:
   - export const prerender = false
   - Sprawdzenie autoryzacji (middleware + role check)
   - Fetch initial data z GET /api/users
   - Error handling dla server-side errors
   - Layout z nawigacją
   - Renderowanie UsersManagement component z client:load
   - Przekazanie initialUsers, initialPagination, currentUserId
3. Testuj server-side rendering i hydration

### Krok 13: Stylowanie i responsywność

**Cel:** Dopracowanie wyglądu i responsywności.

**Działania:**
1. Sprawdź responsive design na różnych rozdzielczościach
2. Mobile: table może być scrollable lub kartami
3. Tailwind breakpoints: sm, md, lg, xl
4. Dark mode support (jeśli jest w projekcie)
5. Accessibility: aria-labels, keyboard navigation, focus states
6. Hover effects, transitions

### Krok 14: Obsługa błędów i Edge Cases

**Cel:** Pokrycie wszystkich scenariuszy błędów.

**Działania:**
1. Implementuj error boundaries (React)
2. Testuj wszystkie scenariusze błędów z sekcji 10
3. Dodaj toast notifications dla wszystkich operacji
4. Implementuj retry logic dla failed requests (opcjonalnie)
5. Testuj timeout scenarios

### Krok 15: Optymalizacja wydajności

**Cel:** Zapewnienie płynności działania.

**Działania:**
1. React.memo dla komponentów które często re-renderują się
2. useCallback dla funkcji przekazywanych jako props
3. useMemo dla expensive computations (filtrowanie client-side)
4. Debouncing dla searchQuery (już zrobione)
5. Lazy loading dla dialogów (React.lazy + Suspense) - opcjonalnie

### Krok 16: Testowanie manualne

**Cel:** Weryfikacja wszystkich User Stories.

**Działania:**
1. **US-003: Dodawanie nowego użytkownika**
   - Wypełnij formularz poprawnymi danymi → sukces
   - Spróbuj dodać z duplikatem email → błąd
   - Sprawdź czy nowy użytkownik pojawia się na liście

2. **US-004: Zmiana roli użytkownika**
   - Edytuj rolę innego użytkownika → sukces
   - Spróbuj zmienić własną rolę → zablokowane w UI

3. **US-005: Edycja danych użytkownika**
   - Zmień imię i nazwisko → sukces
   - Sprawdź czy email jest disabled

4. **US-006: Usuwanie użytkownika**
   - Usuń użytkownika → sukces
   - Sprawdź toast z liczbą anulowanych urlopów
   - Sprawdź czy użytkownik jest wizualnie wyróżniony (jeśli showDeleted=true)

5. **Filtrowanie i wyszukiwanie**
   - Wyszukaj po imieniu, nazwisku, emailu
   - Filtruj po roli
   - Pokaż/ukryj usuniętych

6. **Paginacja**
   - Przejdź między stronami
   - Sprawdź disabled states

7. **Obsługa błędów**
   - Symuluj network error (offline)
   - Symuluj 500 error (modyfikując API)
   - Testuj wszystkie scenariusze z sekcji 10

### Krok 17: Dostępność (Accessibility)

**Cel:** Zapewnienie zgodności z WCAG 2.1 AA.

**Działania:**
1. Sprawdź navigację klawiaturą (Tab, Enter, Escape)
2. Dodaj aria-labels dla ikon i przycisków bez tekstu
3. Sprawdź role i landmarks (table, dialog, etc.)
4. Testuj z screen readerem (NVDA, VoiceOver)
5. Sprawdź kontrast kolorów (min 4.5:1)
6. Focus indicators są widoczne

### Krok 18: Dokumentacja

**Cel:** Dokumentacja dla przyszłych developerów.

**Działania:**
1. Dodaj JSDoc comments do wszystkich komponentów
2. Dokumentuj propsy i interfejsy
3. Dodaj README w folderze `src/components/users/`
4. Opisz flow operacji CRUD
5. Dokumentuj custom hooks

### Krok 19: Code Review i Refactoring

**Cel:** Czyszczenie i optymalizacja kodu.

**Działania:**
1. Przejrzyj kod pod kątem duplikacji
2. Wydziel reużywalne utility functions
3. Sprawdź naming conventions
4. Usuń console.logi (zostawić tylko w catch)
5. Sprawdź ESLint warnings
6. Format kodu (Prettier)

### Krok 20: Deploy i monitoring

**Cel:** Wdrożenie na produkcję i monitorowanie.

**Działania:**
1. Merge do main branch
2. Deploy przez CI/CD (GitHub Actions + DigitalOcean)
3. Monitoruj logi błędów
4. Monitoruj performance (Time to Interactive, Largest Contentful Paint)
5. Zbierz feedback od użytkowników
6. Zaplanuj iteracje (np. server-side search, advanced sorting)

---

## Podsumowanie

Ten plan implementacji obejmuje kompleksowe wdrożenie widoku Zarządzania Użytkownikami zgodnie z PRD i User Stories. Kluczowe aspekty to:

- **Modularność**: Komponenty są podzielone na małe, reużywalne części
- **Typ-safety**: TypeScript + Zod zapewniają bezpieczeństwo typów
- **UX**: Filtry, wyszukiwanie, paginacja, toast notifications
- **Accessibility**: ARIA attributes, keyboard navigation
- **Error handling**: Comprehensive obsługa błędów API i walidacji
- **Performance**: Debouncing, memoization, lazy loading

Implementacja powinna zająć około 3-5 dni dla doświadczonego developera frontendowego, z dodatkowym czasem na testowanie i polish.
