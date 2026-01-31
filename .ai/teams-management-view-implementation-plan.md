# Plan implementacji widoku Zarządzanie Zespołami

## 1. Przegląd
Widok "Zarządzanie Zespołami" umożliwia administratorom i menedżerom (HR) tworzenie, przeglądanie, modyfikowanie i usuwanie zespołów. Pozwala również na zarządzanie członkostwem w zespołach poprzez dodawanie i usuwanie użytkowników. Interfejs oparty jest na układzie master-detail, gdzie lista zespołów jest głównym widokiem, a po wybraniu zespołu wyświetlane są jego szczegóły i lista członków.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką `/teams`. Zostanie zaimplementowany jako strona Astro w pliku `src/pages/teams.astro`.

## 3. Struktura komponentów
Hierarchia komponentów dla widoku "Zarządzanie Zespołami" będzie następująca:

```
TeamsManagementView (React)
├── TeamsList (React)
│   └── TeamsListItem (React)
├── TeamDetails (React)
│   ├── TeamEditForm (React)
│   ├── TeamMembersList (React)
│   │   └── TeamMembersListItem (React)
│   └── AddTeamMemberModal (React)
│       └── UserSearch (React)
└── CreateTeamModal (React)
```

- **TeamsManagementView**: Główny komponent kontenera, zarządzający stanem całego widoku.
- **TeamsList**: Wyświetla listę dostępnych zespołów.
- **TeamsListItem**: Pojedynczy element na liście zespołów.
- **TeamDetails**: Wyświetla szczegóły wybranego zespołu, w tym formularz edycji i listę członków.
- **TeamEditForm**: Formularz do edycji nazwy zespołu.
- **TeamMembersList**: Lista członków należących do wybranego zespołu.
- **TeamMembersListItem**: Pojedynczy element na liście członków zespołu.
- **AddTeamMemberModal**: Modal do wyszukiwania i dodawania nowych członków do zespołu.
- **UserSearch**: Komponent wyszukiwania użytkowników.
- **CreateTeamModal**: Modal z formularzem do tworzenia nowego zespołu.

## 4. Szczegóły komponentów

### TeamsManagementView
- **Opis**: Główny komponent-kontener, który orkiestruje pracę pozostałych komponentów. Odpowiada za pobieranie danych, zarządzanie stanem (wybrany zespół, listy) i obsługę logiki biznesowej.
- **Główne elementy**: `TeamsList`, `TeamDetails`, `CreateTeamModal`.
- **Obsługiwane interakcje**: Wybór zespołu z listy, otwieranie modala do tworzenia zespołu.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `TeamWithMemberCount`, `TeamWithMembers`.
- **Propsy**: Brak.

### TeamsList
- **Opis**: Wyświetla listę zespołów. Umożliwia wybór zespołu do edycji.
- **Główne elementy**: Lista (`<ul>`), komponent `TeamsListItem`.
- **Obsługiwane interakcje**: Kliknięcie na element listy (`onTeamSelect`).
- **Obsługiwana walidacja**: Brak.
- **Typy**: `TeamWithMemberCount`.
- **Propsy**:
  - `teams: TeamWithMemberCount[]`
  - `selectedTeamId: string | null`
  - `onTeamSelect: (teamId: string) => void`

### TeamDetails
- **Opis**: Wyświetla szczegóły aktywnego zespołu, w tym formularz edycji nazwy i listę członków.
- **Główne elementy**: `TeamEditForm`, `TeamMembersList`, przycisk "Usuń zespół".
- **Obsługiwane interakcje**: Zapisanie nowej nazwy zespołu, usunięcie zespołu, otwarcie modala dodawania członków.
- **Obsługiwana walidacja**: Brak (delegowana do `TeamEditForm`).
- **Typy**: `TeamWithMembers`.
- **Propsy**:
  - `team: TeamWithMembers`
  - `onTeamUpdate: () => void`
  - `onTeamDelete: () => void`

### TeamEditForm
- **Opis**: Formularz do aktualizacji nazwy wybranego zespołu.
- **Główne elementy**: `input[type="text"]`, przycisk "Zapisz".
- **Obsługiwane interakcje**: Wpisywanie tekstu, kliknięcie przycisku zapisu.
- **Obsługiwana walidacja**:
  - Nazwa zespołu jest wymagana.
  - Nazwa zespołu musi mieć co najmniej 3 znaki.
- **Typy**: `UpdateTeamDto`.
- **Propsy**:
  - `team: TeamWithMembers`
  - `onTeamUpdate: () => void`

### TeamMembersList
- **Opis**: Wyświetla listę członków zespołu z opcją ich usunięcia.
- **Główne elementy**: Lista (`<ul>`), komponent `TeamMembersListItem`, przycisk "Dodaj członka".
- **Obsługiwane interakcje**: Usunięcie członka z zespołu.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `TeamMember`.
- **Propsy**:
  - `teamId: string`
  - `members: TeamMember[]`
  - `onMemberRemove: () => void`

### AddTeamMemberModal
- **Opis**: Modal zawierający komponent do wyszukiwania i dodawania użytkowników do zespołu.
- **Główne elementy**: Komponent `UserSearch`, przyciski "Dodaj" i "Anuluj".
- **Obsługiwane interakcje**: Wybór użytkowników, potwierdzenie dodania.
- **Obsługiwana walidacja**:
  - Musi być wybrany co najmniej jeden użytkownik.
- **Typy**: `AddTeamMembersDto`.
- **Propsy**:
  - `teamId: string`
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onMembersAdd: () => void`

### CreateTeamModal
- **Opis**: Modal z formularzem do tworzenia nowego zespołu.
- **Główne elementy**: `input[type="text"]`, przyciski "Utwórz" i "Anuluj".
- **Obsługiwane interakcje**: Wprowadzenie nazwy, zatwierdzenie formularza.
- **Obsługiwana walidacja**:
  - Nazwa zespołu jest wymagana.
  - Nazwa zespołu musi mieć co najmniej 3 znaki.
- **Typy**: `CreateTeamDto`.
- **Propsy**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onTeamCreate: () => void`

## 5. Typy
Do implementacji widoku potrzebne będą następujące kluczowe typy i modele widoku:

- **`TeamWithMemberCount` (ViewModel)**: Używany w liście zespołów.
  - `id: string` - UUID zespołu.
  - `name: string` - Nazwa zespołu.
  - `memberCount: number` - Liczba członków.
  - `createdAt: string` - Data utworzenia.
  - `updatedAt: string` - Data ostatniej modyfikacji.

- **`TeamWithMembers` (ViewModel)**: Używany w widoku szczegółów zespołu.
  - `id: string` - UUID zespołu.
  - `name: string` - Nazwa zespołu.
  - `createdAt: string` - Data utworzenia.
  - `updatedAt: string` - Data ostatniej modyfikacji.
  - `members: TeamMember[]` - Lista członków zespołu.

- **`TeamMember` (ViewModel)**: Reprezentuje członka zespołu w liście.
  - `id: string` - UUID użytkownika.
  - `firstName: string` - Imię.
  - `lastName: string` - Nazwisko.
  - `email: string` - Adres email.
  - `role: UserRole` - Rola użytkownika.
  - `joinedAt: string` - Data dołączenia do zespołu.

- **`CreateTeamDto`**: Obiekt transferu danych do tworzenia zespołu.
  - `name: string` - Nazwa nowego zespołu.

- **`UpdateTeamDto`**: Obiekt transferu danych do aktualizacji zespołu.
  - `name: string` - Nowa nazwa zespołu.

- **`AddTeamMembersDto`**: Obiekt transferu danych do dodawania członków.
  - `userIds: string[]` - Tablica UUID użytkowników do dodania.

## 6. Zarządzanie stanem
Zarządzanie stanem zostanie zrealizowane za pomocą hooków React (`useState`, `useEffect`) wewnątrz komponentu `TeamsManagementView`. Rozważone zostanie stworzenie niestandardowego hooka `useTeamsManagement`, aby hermetyzować logikę i uczynić komponent `TeamsManagementView` czystszym.

**Proponowany hook `useTeamsManagement` zarządzałby:**
- `teams: TeamWithMemberCount[]`: Lista zespołów.
- `selectedTeam: TeamWithMembers | null`: Aktualnie wybrany zespół.
- `isLoading: boolean`: Stan ładowania danych.
- `error: Error | null`: Ewentualne błędy.
- Funkcje do pobierania, tworzenia, aktualizacji i usuwania zespołów oraz zarządzania członkami.

## 7. Integracja API
Integracja z API będzie realizowana poprzez wywołania `fetch` do odpowiednich endpointów.

- **`GET /api/teams?includeMemberCount=true`**: Pobranie listy zespołów z liczbą członków.
  - **Odpowiedź**: `PaginatedResponse<TeamWithMemberCount>`
- **`GET /api/teams/:id`**: Pobranie szczegółów wybranego zespołu.
  - **Odpowiedź**: `TeamWithMembers`
- **`POST /api/teams`**: Utworzenie nowego zespołu.
  - **Żądanie**: `CreateTeamDto`
  - **Odpowiedź**: `Team`
- **`PATCH /api/teams/:id`**: Aktualizacja nazwy zespołu.
  - **Żądanie**: `UpdateTeamDto`
  - **Odpowiedź**: `Team`
- **`DELETE /api/teams/:id`**: Usunięcie zespołu.
  - **Odpowiedź**: `{ message: string, id: string }`
- **`POST /api/teams/:id/members`**: Dodanie członków do zespołu.
  - **Żądanie**: `AddTeamMembersDto`
  - **Odpowiedź**: `{ message: string, added: TeamMember[] }`
- **`DELETE /api/teams/:id/members/:userId`**: Usunięcie członka z zespołu.
  - **Odpowiedź**: `{ message: string }`
- **`GET /api/users`**: Pobranie listy użytkowników do dodania do zespołu (dla `UserSearch`).
  - **Odpowiedź**: `PaginatedResponse<User>`

## 8. Interakcje użytkownika
- **Wyświetlenie listy zespołów**: Po załadowaniu widoku, pobierana i wyświetlana jest lista zespołów.
- **Wybranie zespołu**: Kliknięcie na zespół na liście powoduje pobranie jego szczegółów i wyświetlenie ich w panelu `TeamDetails`.
- **Tworzenie zespołu**: Kliknięcie "Utwórz zespół" otwiera modal, gdzie użytkownik podaje nazwę. Po zatwierdzeniu, lista zespołów jest odświeżana.
- **Edycja nazwy zespołu**: Użytkownik zmienia nazwę w formularzu i klika "Zapisz". Nazwa jest aktualizowana, a widok odświeżany.
- **Usuwanie zespołu**: Kliknięcie "Usuń zespół" i potwierdzenie w oknie dialogowym powoduje usunięcie zespołu i odświeżenie listy.
- **Dodawanie członków**: Kliknięcie "Dodaj członka" otwiera modal z wyszukiwarką. Po wybraniu użytkowników i zatwierdzeniu, lista członków jest odświeżana.
- **Usuwanie członka**: Kliknięcie ikony usunięcia przy członku zespołu i potwierdzenie powoduje usunięcie go i odświeżenie listy członków.

## 9. Warunki i walidacja
- **Formularz tworzenia zespołu (`CreateTeamModal`)**:
  - Pole `name` nie może być puste.
  - Pole `name` musi mieć co najmniej 3 znaki.
  - Przycisk "Utwórz" jest nieaktywny, dopóki walidacja nie przejdzie pomyślnie.
- **Formularz edycji zespołu (`TeamEditForm`)**:
  - Pole `name` nie może być puste.
  - Pole `name` musi mieć co najmniej 3 znaki.
  - Przycisk "Zapisz" jest nieaktywny, dopóki walidacja nie przejdzie pomyślnie.
- **Modal dodawania członków (`AddTeamMemberModal`)**:
  - Przycisk "Dodaj" jest nieaktywny, dopóki nie zostanie wybrany co najmniej jeden użytkownik.

## 10. Obsługa błędów
- **Błędy sieciowe/API**: W przypadku niepowodzenia wywołania API, użytkownikowi zostanie wyświetlony komunikat (np. za pomocą komponentu `Toast`/`Sonner`) informujący o problemie.
- **Błędy walidacji (serwer)**: Jeśli API zwróci błąd 400 (np. nazwa zespołu już istnieje), odpowiedni komunikat zostanie wyświetlony przy polu formularza.
- **Brak uprawnień (403 Forbidden)**: Jeśli użytkownik nie ma uprawnień do wykonania akcji, zostanie o tym poinformowany. W idealnym przypadku, przyciski inicjujące akcje, do których użytkownik nie ma uprawnień, nie powinny być w ogóle renderowane.
- **Stan ładowania**: Podczas pobierania danych, komponenty będą wyświetlać wskaźniki ładowania (np. `Spinner`), aby poinformować użytkownika o trwającym procesie.
- **Puste stany**: Jeśli lista zespołów jest pusta, zostanie wyświetlony komunikat zachęcający do utworzenia pierwszego zespołu. Podobnie dla pustej listy członków.

## 11. Kroki implementacji
1. **Utworzenie pliku strony**: Stworzenie pliku `src/pages/admin/teams.astro` i osadzenie w nim głównego komponentu React `TeamsManagementView`.
2. **Implementacja głównego komponentu (`TeamsManagementView`)**: Stworzenie szkieletu komponentu, który będzie zarządzał stanem i renderował komponenty podrzędne.
3. **Implementacja `useTeamsManagement` (opcjonalnie)**: Wydzielenie logiki zarządzania stanem i komunikacji z API do niestandardowego hooka.
4. **Implementacja listy zespołów (`TeamsList`, `TeamsListItem`)**: Stworzenie komponentów do wyświetlania listy zespołów. Podłączenie logiki pobierania danych i obsługi wyboru zespołu.
5. **Implementacja widoku szczegółów (`TeamDetails`)**: Stworzenie komponentu, który będzie wyświetlał dane wybranego zespołu.
6. **Implementacja formularza edycji (`TeamEditForm`)**: Stworzenie formularza z walidacją do edycji nazwy zespołu i integracja z API.
7. **Implementacja listy członków (`TeamMembersList`, `TeamMembersListItem`)**: Stworzenie komponentów do wyświetlania i usuwania członków zespołu.
8. **Implementacja modala tworzenia zespołu (`CreateTeamModal`)**: Stworzenie modala z formularzem i walidacją do tworzenia nowego zespołu.
9. **Implementacja modala dodawania członków (`AddTeamMemberModal`, `UserSearch`)**: Stworzenie modala i komponentu wyszukiwarki użytkowników.
10. **Obsługa interakcji i stanu**: Połączenie wszystkich komponentów, zapewnienie płynnego przepływu danych i aktualizacji interfejsu w odpowiedzi na akcje użytkownika.
11. **Obsługa błędów i stanów krańcowych**: Implementacja wskaźników ładowania, obsługi błędów API oraz komunikatów dla pustych stanów.
12. **Stylowanie i dostępność**: Dopracowanie wyglądu komponentów zgodnie z systemem projektowym (Shadcn/ui, Tailwind) oraz zapewnienie zgodności z zasadami dostępności (ARIA).
13. **Testowanie manualne**: Przetestowanie wszystkich historyjek użytkownika (US-009, US-010, US-011) w celu weryfikacji poprawności działania.
