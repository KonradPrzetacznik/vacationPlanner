# Plan implementacji widoku Moje Wnioski

## 1. Przegląd

Widok "Moje Wnioski" (`/requests`) pozwoli pracownikom na zarządzanie własnymi wnioskami urlopowymi. Użytkownicy będą mogli przeglądać listę swoich wniosków, filtrować je, sprawdzać ich status, a także składać nowe i anulować istniejące. Widok będzie również prezentował podsumowanie dostępnych dni urlopowych oraz kalendarz urlopów dla zespołu.

## 2. Routing widoku

- Główna strona widoku będzie dostępna pod ścieżką: `/requests`.
- Strona do tworzenia nowego wniosku: `/requests/new`.
- Strona do edycji istniejącego wniosku: `/requests/[id]/edit` (choć edycja nie jest opisana w dostarczonych historyjkach, przewidujemy taką możliwość).

## 3. Struktura komponentów

```
/src/pages/requests.astro
└── /src/components/requests/MyRequestsView.tsx (komponent kliencki)
    ├── /src/components/requests/VacationSummary.tsx
    ├── /src/components/requests/RequestList.tsx
    │   ├── /src/components/requests/RequestListFilters.tsx
    │   └── /src/components/requests/RequestListItem.tsx
    │       └── /src/components/ui/Badge.tsx (dla statusu)
    ├── /src/components/requests/TeamCalendar.tsx
    └── /src/components/requests/RequestForm.tsx (dla /requests/new i /requests/[id]/edit)
        ├── /src/components/ui/DatePicker.tsx
        └── /src/components/ui/Button.tsx
```

## 4. Szczegóły komponentów

### `MyRequestsView.tsx`

- **Opis:** Główny komponent React, który orkiestruje cały widok. Zarządza stanem, pobiera dane i renderuje komponenty podrzędne.
- **Główne elementy:** `VacationSummary`, `RequestList`, `TeamCalendar`, przycisk "Złóż nowy wniosek".
- **Obsługiwane interakcje:** Przełączanie filtrów w `RequestListFilters`, nawigacja do formularza nowego wniosku.
- **Typy:** `VacationRequest[]`, `UserVacationAllowance`.
- **Propsy:** `initialRequests: VacationRequest[]`, `initialAllowance: UserVacationAllowance`.

### `VacationSummary.tsx`

- **Opis:** Wyświetla podsumowanie dostępnych dni urlopowych użytkownika, z podziałem na pulę bieżącą i zaległą.
- **Główne elementy:** Pola tekstowe z liczbą dni.
- **Typy:** `UserVacationAllowance`.
- **Propsy:** `allowance: UserVacationAllowance`.

### `RequestList.tsx`

- **Opis:** Wyświetla listę wniosków urlopowych użytkownika.
- **Główne elementy:** `RequestListFilters`, lista komponentów `RequestListItem`.
- **Obsługiwane interakcje:** Sortowanie i filtrowanie listy.
- **Typy:** `VacationRequest[]`.
- **Propsy:** `requests: VacationRequest[]`.

### `RequestListFilters.tsx`

- **Opis:** Komponent z kontrolkami do filtrowania listy wniosków (np. po statusie).
- **Główne elementy:** `Select`, `Checkbox`.
- **Obsługiwane zdarzenia:** `onFilterChange`.
- **Propsy:** `onFilterChange: (filters: RequestFilters) => void`.

### `RequestListItem.tsx`

- **Opis:** Reprezentuje pojedynczy wniosek na liście. Wyświetla kluczowe informacje i akcje.
- **Główne elementy:** Dane wniosku (daty, status), przycisk "Anuluj wniosek".
- **Obsługiwane interakcje:** Kliknięcie przycisku "Anuluj".
- **Warunki walidacji:** Przycisk "Anuluj" jest widoczny tylko dla wniosków ze statusem `SUBMITTED` lub `APPROVED` (jeśli urlop się jeszcze nie zaczął).
- **Typy:** `VacationRequest`.
- **Propsy:** `request: VacationRequest`, `onCancel: (id: string) => void`.

### `RequestForm.tsx`

- **Opis:** Formularz do składania nowego lub edycji istniejącego wniosku urlopowego.
- **Główne elementy:** `DatePicker` dla daty początkowej i końcowej, pole na komentarz, przycisk "Wyślij".
- **Obsługiwane zdarzenia:** `onSubmit`.
- **Warunki walidacji:**
  - Data końcowa nie może być wcześniejsza niż data początkowa.
  - Nie można wybrać dat z przeszłości.
  - Nie można wybrać weekendów jako daty początkowej/końcowej.
  - Walidacja po stronie serwera jest kluczowa.
- **Typy:** `CreateVacationRequestDto`.
- **Propsy:** `onSubmit: (data: CreateVacationRequestDto) => void`, `initialData?: VacationRequest`.

## 5. Typy

### `RequestFilters` (ViewModel)

```typescript
interface RequestFilters {
  status?: VacationRequestStatus[];
}
```

### `CreateVacationRequestDto` (DTO)

Zgodny z `POST /api/vacation-requests`.

```typescript
interface CreateVacationRequestDto {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  comment?: string;
}
```

### `UserVacationAllowance` (ViewModel)

Typ reprezentujący dostępne dni urlopowe użytkownika.

```typescript
interface UserVacationAllowance {
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  fromPreviousYear: {
    total: number;
    utilizationDeadline: string; // "YYYY-MM-DD"
  };
}
```

## 6. Zarządzanie stanem

Do zarządzania stanem widoku "Moje Wnioski" stworzymy customowy hook `useMyRequests`.

### `useMyRequests.ts`

- **Cel:** Hermetyzacja logiki pobierania danych, filtrowania, anulowania i składania wniosków.
- **Zarządzany stan:**
  - `requests: VacationRequest[]`: Lista wniosków.
  - `allowance: UserVacationAllowance`: Dostępne dni urlopowe.
  - `filters: RequestFilters`: Aktualne filtry.
  - `isLoading: boolean`: Status ładowania danych.
  - `error: Error | null`: Ewentualne błędy.
- **Użycie:**
  ```typescript
  const { requests, allowance, isLoading, error, cancelRequest, createRequest, setFilters } = useMyRequests(
    initialRequests,
    initialAllowance
  );
  ```

## 7. Integracja API

- **Pobieranie listy wniosków (US-017):**
  - **Endpoint:** `GET /api/vacation-requests`
  - **Akcja:** Wywołanie przy montowaniu komponentu `MyRequestsView` oraz przy zmianie filtrów.
  - **Typ odpowiedzi:** `PaginatedResponse<VacationRequest>`

- **Składanie nowego wniosku (US-016):**
  - **Endpoint:** `POST /api/vacation-requests`
  - **Akcja:** Wywołanie po poprawnym zwalidowaniu i wysłaniu formularza `RequestForm`.
  - **Typ żądania:** `CreateVacationRequestDto`
  - **Typ odpowiedzi:** `VacationRequest`

- **Anulowanie wniosku (US-018, US-019):**
  - **Endpoint:** `POST /api/vacation-requests/:id/cancel`
  - **Akcja:** Wywołanie po kliknięciu przycisku "Anuluj" w `RequestListItem`.
  - **Typ odpowiedzi:** `{ id: string; status: "CANCELLED"; ... }`

- **Pobieranie dostępnych dni urlopowych (US-020):**
  - Wymaga stworzenia nowego endpointu, np. `GET /api/users/me/allowance`. Na potrzeby planu zakładamy, że taki endpoint istnieje i zwraca dane w formacie `UserVacationAllowance`.

## 8. Interakcje użytkownika

- **Filtrowanie listy:** Użytkownik wybiera status w `RequestListFilters`, co wywołuje `setFilters` z hooka `useMyRequests` i ponowne pobranie danych z API.
- **Składanie wniosku:** Użytkownik klika "Złóż nowy wniosek", jest przenoszony do `/requests/new`, wypełnia formularz, a po wysłaniu wniosek jest dodawany do listy.
- **Anulowanie wniosku:** Użytkownik klika "Anuluj", co wywołuje `cancelRequest(id)`. Po pomyślnej odpowiedzi z API, status wniosku na liście jest aktualizowany na "Anulowany".

## 9. Warunki i walidacja

- **Formularz wniosku (`RequestForm`):**
  - Data "do" musi być równa lub późniejsza niż data "od".
  - Obie daty muszą być w przyszłości.
  - Walidacja w czasie rzeczywistym z użyciem biblioteki `zod` i `react-hook-form`.
- **Anulowanie wniosku (`RequestListItem`):**
  - Przycisk "Anuluj" jest aktywny, jeśli `request.status` to `SUBMITTED`.
  - Przycisk "Anuluj" jest aktywny, jeśli `request.status` to `APPROVED` i `request.startDate` jest datą przyszłą lub dzisiejszą. W przeciwnym razie jest nieaktywny.

## 10. Obsługa błędów

- **Błędy API:** Hook `useMyRequests` będzie łapał błędy z `fetch` i wystawiał je w stanie `error`. Komponent `MyRequestsView` wyświetli globalny komunikat o błędzie (np. za pomocą `Toast`).
- **Błędy walidacji formularza:** `react-hook-form` wyświetli komunikaty o błędach pod odpowiednimi polami formularza.
- **Błąd anulowania wniosku:** Jeśli anulowanie się nie powiedzie (np. z powodu zmiany statusu w międzyczasie), użytkownik otrzyma powiadomienie `Toast` z informacją o przyczynie.
- **Brak danych:** Jeśli lista wniosków jest pusta, `RequestList` wyświetli stosowny komunikat.

## 11. Kroki implementacji

1. **Stworzenie plików:** Utworzenie nowej strony Astro `/src/pages/requests.astro` oraz wszystkich wymaganych komponentów React w katalogu `/src/components/requests/`.
2. **Routing:** Skonfigurowanie routingu w Astro dla ścieżek `/requests` i `/requests/new`.
3. **Stworzenie hooka `useMyRequests`:** Implementacja logiki zarządzania stanem, w tym funkcji do komunikacji z API.
4. **Implementacja komponentu `MyRequestsView`:** Zintegrowanie hooka i poskładanie widoku z komponentów podrzędnych.
5. **Implementacja komponentów `VacationSummary`, `RequestList`, `RequestListItem`:** Stworzenie statycznych części interfejsu.
6. **Implementacja `RequestForm`:** Zbudowanie formularza z walidacją po stronie klienta przy użyciu `react-hook-form` i `zod`.
7. **Integracja z API:** Podłączenie akcji (pobieranie, tworzenie, anulowanie) do odpowiednich endpointów API.
8. **Obsługa stanu ładowania i błędów:** Dodanie wskaźników ładowania i komunikatów o błędach.
9. **Implementacja `TeamCalendar`:** Stworzenie widoku kalendarza urlopów zespołu (może wymagać osobnego endpointu `GET /api/teams/:id/calendar`).
10. **Stylowanie i dostępność:** Dopracowanie wyglądu zgodnie z systemem designu (Shadcn/ui, Tailwind) i zapewnienie zgodności z WCAG.
11. **Testy:** Napisanie testów jednostkowych dla logiki w hooku oraz testów end-to-end dla kluczowych przepływów użytkownika.
