# Teams Management View - Dokumentacja

## Przegląd

Widok Zarządzania Zespołami to interfejs administracyjny do zarządzania zespołami w aplikacji VacationPlanner. Jest dostępny pod adresem `/teams` i jest dostępny tylko dla użytkowników z rolami `HR` i `ADMINISTRATOR`.

## Struktura Komponentów

```
TeamsPage (Astro) - /src/pages/teams.astro
└── TeamsManagementView (React) - Główny komponent orkiestrujący
    ├── TeamsList (React) - Lista zespołów
    │   └── TeamsListItem (React) - Pojedynczy element listy
    ├── TeamDetails (React) - Szczegóły wybranego zespołu
    │   ├── TeamEditForm (React) - Formularz edycji zespołu
    │   │   └── AlertDialog - Potwierdzenie usunięcia
    │   └── TeamMembersList (React) - Lista członków zespołu
    │       ├── TeamMembersListItem (implicit) - Element członka
    │       ├── AddTeamMemberModal (React) - Modal dodawania członków
    │       │   └── UserSearch (implicit) - Wyszukiwarka użytkowników
    │       └── AlertDialog - Potwierdzenie usunięcia członka
    └── CreateTeamModal (React) - Modal tworzenia zespołu
```

## Hook zarządzania stanem

```
useTeamsManagement - /src/components/hooks/useTeamsManagement.ts
├── Stan
│   ├── teams: TeamListItemDTO[]
│   ├── selectedTeam: TeamDetailsDTO | null
│   ├── pagination: { limit, offset, total }
│   ├── isLoading: boolean
│   └── isLoadingDetails: boolean
└── Operacje
    ├── fetchTeams() - Pobieranie listy zespołów
    ├── selectTeam(teamId) - Wybór i pobranie szczegółów zespołu
    ├── createTeam(data) - Tworzenie nowego zespołu
    ├── updateTeam(teamId, data) - Aktualizacja zespołu
    ├── deleteTeam(teamId) - Usunięcie zespołu
    ├── addTeamMembers(teamId, data) - Dodanie członków
    └── removeTeamMember(teamId, userId) - Usunięcie członka
```

## Główne funkcjonalności

### 1. Przeglądanie zespołów

- Lista wszystkich zespołów w organizacji
- Wyświetlanie nazwy zespołu i liczby członków
- Oznaczanie aktualnie wybranego zespołu
- Stan pustej listy z zachętą do utworzenia pierwszego zespołu

### 2. Tworzenie zespołu

- Modal z formularzem tworzenia
- Walidacja:
  - Nazwa jest wymagana
  - Minimalna długość: 3 znaki
  - Maksymalna długość: 100 znaków
- Automatyczne odświeżanie listy po utworzeniu

### 3. Edycja zespołu

- Formularz edycji nazwy zespołu
- Przycisk "Zapisz" aktywny tylko gdy są zmiany
- Walidacja identyczna jak przy tworzeniu
- Wyświetlanie metadanych (data utworzenia, ostatnia modyfikacja)

### 4. Usuwanie zespołu

- Przycisk z AlertDialog potwierdzenia
- Ostrzeżenie o nieodwracalności operacji
- Informacja o usunięciu wszystkich członków
- Automatyczne wyczyszczenie szczegółów i odświeżenie listy

### 5. Zarządzanie członkami

- Lista członków z informacjami:
  - Imię i nazwisko
  - Email
  - Rola (z kolorowym badge)
  - Data dołączenia do zespołu
- Przycisk "Dodaj członka"
- Przycisk usunięcia przy każdym członku
- Stan pustej listy z zachętą do dodania pierwszego członka

### 6. Dodawanie członków

- Modal z wyszukiwarką użytkowników
- Filtrowanie po imieniu, nazwisku i emailu
- Debounce wyszukiwania (300ms)
- Selekcja wielokrotna z checkboxami
- Licznik wybranych użytkowników
- Walidacja: minimum 1 użytkownik musi być wybrany
- Wykluczenie użytkowników usuniętych z listy
- Wykluczenie użytkowników już będących członkami zespołu
- Scrollowalna lista użytkowników

### 7. Usuwanie członków

- AlertDialog z potwierdzeniem
- Wyświetlanie imienia i nazwiska użytkownika
- Informacja o skutkach usunięcia

## Layout i UX

### Master-Detail Pattern

- **Lewa kolumna (1/3 szerokości)**: Lista zespołów
- **Prawa kolumna (2/3 szerokości)**: Szczegóły wybranego zespołu
- **Mobile**: Kolumny układają się pionowo (1 kolumna)

### Stany UI

- **Loading**: Spinner podczas ładowania danych
- **Empty**: Komunikat gdy brak zespołów/członków
- **Error**: Komunikaty błędów w toastach
- **Success**: Potwierdzenia operacji w toastach
- **Disabled**: Przyciski nieaktywne podczas operacji

### Responsywność

- Desktop: Layout 3-kolumnowy (grid)
- Tablet/Mobile: Pionowy układ kolumn
- Scrollowalne listy z max-height

## Integracja z API

### Endpointy używane przez widok

| Metoda | Endpoint                             | Cel                                         |
| ------ | ------------------------------------ | ------------------------------------------- |
| GET    | `/api/teams?includeMemberCount=true` | Lista zespołów z liczbą członków            |
| GET    | `/api/teams/:id`                     | Szczegóły zespołu z listą członków          |
| POST   | `/api/teams`                         | Tworzenie nowego zespołu                    |
| PATCH  | `/api/teams/:id`                     | Aktualizacja nazwy zespołu                  |
| DELETE | `/api/teams/:id`                     | Usunięcie zespołu                           |
| POST   | `/api/teams/:id/members`             | Dodanie członków do zespołu                 |
| DELETE | `/api/teams/:id/members/:userId`     | Usunięcie członka z zespołu                 |
| GET    | `/api/users`                         | Lista użytkowników (dla AddTeamMemberModal) |

## Walidacja

### Formularz tworzenia zespołu (CreateTeamModal)

```typescript
name: z.string()
  .min(1, "Nazwa zespołu jest wymagana")
  .min(3, "Nazwa zespołu musi mieć co najmniej 3 znaki")
  .max(100, "Nazwa zespołu nie może przekraczać 100 znaków")
  .transform((val) => val.trim());
```

### Formularz edycji zespołu (TeamEditForm)

- Identyczna walidacja jak przy tworzeniu
- Przycisk "Zapisz" disabled gdy brak zmian (dirty check)

### Dodawanie członków (AddTeamMemberModal)

- Minimum 1 użytkownik musi być wybrany
- Przycisk "Dodaj" disabled gdy selection jest pusty
- Użytkownicy usunięci (`deletedAt !== null`) są wykluczeni z listy
- Użytkownicy już będący członkami zespołu są wykluczeni z listy

## Typy użyte w widoku

```typescript
// Lista zespołów
interface TeamListItemDTO {
  id: string;
  name: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Szczegóły zespołu
interface TeamDetailsDTO {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMemberDTO[];
}

// Członek zespołu
interface TeamMemberDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  joinedAt: string;
}

// DTO operacji
interface CreateTeamDTO {
  name: string;
}

interface UpdateTeamDTO {
  name: string;
}

interface AddTeamMembersDTO {
  userIds: string[];
}
```

## Uprawnienia

| Rola          | Uprawnienia                                                                |
| ------------- | -------------------------------------------------------------------------- |
| ADMINISTRATOR | Pełny dostęp: tworzenie, edycja, usuwanie zespołów i zarządzanie członkami |
| HR            | Pełny dostęp: tworzenie, edycja, usuwanie zespołów i zarządzanie członkami |
| EMPLOYEE      | Brak dostępu do widoku (redirect do `/`)                                   |

## Obsługa błędów

### Błędy sieciowe/API

- Wyświetlanie toasta z komunikatem błędu (Sonner)
- Logowanie błędów do konsoli
- Graceful degradation - UI pozostaje użyteczne

### Błędy walidacji

- Wyświetlanie komunikatów pod polami formularza
- Blokada submisji przy błędach walidacji
- Komunikat w alert box dla błędów serwera

### Błędy uprawnień

- Redirect na stronę główną dla użytkowników bez uprawnień
- Obsługa 403 z API (teoretycznie nie powinno się zdarzyć)

## Optymalizacja wydajności

### React optimizations

- `useCallback` dla handlerów eventów
- Destructuring state do prymitywów (limit, offset, total)
- Lazy loading komponentów modalnych

### API optimizations

- Debounce dla wyszukiwania (300ms)
- Pagination dla długich list
- Selective refresh - tylko zmienione dane

### UX optimizations

- Loading states dla wszystkich operacji asynchronicznych
- Optimistic updates nie są używane (bezpieczeństwo > szybkość)
- Automatyczne odświeżanie list po operacjach

## Accessibility (A11y)

### Keyboard Navigation

- Wszystkie interaktywne elementy dostępne z klawiatury
- Focus-visible styles dla lepszej widoczności focus
- Tab order zgodny z wizualnym layoutem

### ARIA

- Przyciski z odpowiednimi labels
- Dialogs z role="dialog"
- Alert dialogs z role="alertdialog"
- Loading states z aria-busy

### Screen Readers

- Semantic HTML (button, nav, main)
- Opisowe teksty dla ikon (lucide-react)
- Status updates przez toasty (live regions)

## Testowanie

### Scenariusze testowe

1. **Tworzenie zespołu**
   - Otwarcie modala
   - Wypełnienie formularza
   - Walidacja nazwy
   - Utworzenie zespołu
   - Sprawdzenie czy pojawił się na liście

2. **Edycja zespołu**
   - Wybór zespołu z listy
   - Zmiana nazwy
   - Zapisanie zmian
   - Sprawdzenie aktualizacji

3. **Usuwanie zespołu**
   - Wybór zespołu
   - Kliknięcie "Usuń zespół"
   - Potwierdzenie w dialogu
   - Sprawdzenie czy zniknął z listy

4. **Dodawanie członków**
   - Wybór zespołu
   - Otwarcie modala dodawania
   - Wyszukanie użytkowników
   - Selekcja użytkowników
   - Dodanie do zespołu
   - Sprawdzenie czy pojawili się na liście

5. **Usuwanie członków**
   - Wybór zespołu z członkami
   - Kliknięcie usuń przy członku
   - Potwierdzenie
   - Sprawdzenie czy zniknął z listy

### Przypadki brzegowe

- Pusta lista zespołów
- Zespół bez członków
- Bardzo długa nazwa zespołu
- Duplikaty nazw (obsługa błędu z API)
- Brak połączenia z API
- Równoczesne operacje na tym samym zespole

## Pliki źródłowe

```
src/
├── pages/
│   └── admin/
│       └── teams.astro                    # Strona Astro
├── components/
│   ├── teams/
│   │   ├── TeamsManagementView.tsx       # Główny komponent
│   │   ├── TeamsList.tsx                 # Lista zespołów
│   │   ├── TeamDetails.tsx               # Szczegóły zespołu
│   │   ├── TeamEditForm.tsx              # Formularz edycji
│   │   ├── TeamMembersList.tsx           # Lista członków
│   │   ├── AddTeamMemberModal.tsx        # Modal dodawania członków
│   │   ├── CreateTeamModal.tsx           # Modal tworzenia zespołu
│   │   └── index.ts                      # Eksporty
│   └── hooks/
│       └── useTeamsManagement.ts         # Custom hook
└── types.ts                               # Definicje typów
```

## Zależności

### Biblioteki zewnętrzne

- `react` v19 - UI framework
- `react-hook-form` - zarządzanie formularzami
- `zod` - walidacja schematów
- `@hookform/resolvers` - integracja zod z react-hook-form
- `sonner` - system toastów
- `lucide-react` - ikony

### Komponenty Shadcn/ui

- `Dialog` - modale
- `AlertDialog` - dialogi potwierdzenia
- `Card` - karty
- `Button` - przyciski
- `Input` - pola tekstowe
- `Checkbox` - checkboxy
- `Badge` - odznaki
- `Form` - komponenty formularzy

## Znane ograniczenia

1. **Brak paginacji w AddTeamMemberModal**
   - Obecnie pokazuje tylko 50 pierwszych użytkowników
   - Dla dużych organizacji może być problematyczne
   - Rozwiązanie: dodać paginację lub wirtualizację listy

2. **Brak filtrowania członków już w zespole**
   - AddTeamMemberModal pokazuje wszystkich użytkowników
   - Backend powinien filtrować duplikaty
   - UX improvement: ukryć już dodanych członków

3. **Brak undo dla usunięcia zespołu**
   - Operacja jest nieodwracalna
   - Rozwiązanie: soft-delete z możliwością odzyskania

4. **Brak bulk operations**
   - Nie można usunąć wielu członków na raz
   - Nie można dodać zespołu do wielu użytkowników na raz

## Dalszy rozwój

### Planowane ulepszenia

1. Filtrowanie i sortowanie listy zespołów
2. Wyszukiwanie w liście zespołów
3. Bulk operations dla członków
4. Export listy członków (CSV, Excel)
5. Historia zmian w zespole (audit log)
6. Statystyki zespołu (liczba urlopów, dostępność)
7. Role w zespole (team leader, member)
8. Powiadomienia o zmianach w zespole

### Integracje

1. Kalendarz zespołu (już zaplanowany)
2. Wnioski urlopowe zespołu
3. Dashboard zespołu
4. Raportowanie
