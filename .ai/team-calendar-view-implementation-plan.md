# Plan implementacji widoku: Kalendarz Zespołu

## 1. Przegląd

Celem tego dokumentu jest stworzenie szczegółowego planu wdrożenia widoku "Kalendarz Zespołu". Widok ten umożliwi menedżerom i administratorom wizualizację nieobecności w zespole lub w całej firmie. Będzie on przedstawiał kalendarz z oznaczonymi urlopami, z możliwością filtrowania i przeglądania szczegółów.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką:

- **Ścieżka:** `/calendar`
- **Plik:** `src/pages/calendar.astro`

## 3. Struktura komponentów

Hierarchia komponentów dla widoku kalendarza będzie następująca:

```
- CalendarView (React, /src/components/calendar/CalendarView.tsx)
  - TeamSelector (React, /src/components/calendar/TeamSelector.tsx)
    - Select (Shadcn/ui)
  - Calendar (React, /src/components/calendar/Calendar.tsx)
    - FullCalendar (biblioteka zewnętrzna)
    - VacationDetailsTooltip (React, /src/components/calendar/VacationDetailsTooltip.tsx)
  - VacationLegend (React, /src/components/calendar/VacationLegend.tsx)
```

## 4. Szczegóły komponentów

### `CalendarView`

- **Opis komponentu:** Główny komponent kontenera, który zarządza stanem całego widoku, pobiera dane i koordynuje interakcje między komponentami podrzędnymi.
- **Główne elementy:** `div` jako kontener, renderuje `TeamSelector`, `Calendar` i `VacationLegend`.
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji. Przekazuje dane i handlery do komponentów podrzędnych.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `TeamCalendarViewModel`, `VacationRequestViewModel`.
- **Propsy:**
  - `teams: Team[]`: Lista zespołów dostępnych dla zalogowanego użytkownika.
  - `initialTeamId: string`: ID początkowo wybranego zespołu.
  - `currentUser: User`: Informacje o zalogowanym użytkowniku (do określenia uprawnień).

### `TeamSelector`

- **Opis komponentu:** Komponent `select` pozwalający użytkownikowi (Admin/Manager) wybrać zespół, dla którego chce wyświetlić kalendarz.
- **Główne elementy:** Wykorzystuje komponent `Select` z biblioteki `Shadcn/ui`.
- **Obsługiwane interakcje:**
  - `onValueChange`: Wywoływane przy zmianie wybranego zespołu. Powoduje wywołanie handlera `onTeamChange` przekazanego w propsach.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `Team`.
- **Propsy:**
  - `teams: Team[]`: Lista zespołów do wyświetlenia w selektorze.
  - `selectedTeamId: string`: Aktualnie wybrane ID zespołu.
  - `onTeamChange: (teamId: string) => void`: Funkcja zwrotna wywoływana przy zmianie zespołu.
  - `disabled: boolean`: Określa, czy selektor jest nieaktywny (np. podczas ładowania danych).

### `Calendar`

- **Opis komponentu:** Komponent renderujący kalendarz z nieobecnościami. Wykorzystuje bibliotekę `FullCalendar` do wyświetlania danych.
- **Główne elementy:** Komponent `FullCalendar` z odpowiednią konfiguracją. Renderuje `VacationDetailsTooltip` przy interakcji z wydarzeniem.
- **Obsługiwane interakcje:**
  - `eventMouseEnter`: Wyświetla `VacationDetailsTooltip` ze szczegółami wniosku.
  - `eventMouseLeave`: Ukrywa `VacationDetailsTooltip`.
  - `datesSet`: Wywoływane przy zmianie zakresu dat w kalendarzu (np. zmiana miesiąca), co skutkuje ponownym pobraniem danych.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `VacationRequestViewModel`.
- **Propsy:**
  - `vacations: VacationRequestViewModel[]`: Lista urlopów do wyświetlenia.
  - `onDateRangeChange: (startDate: string, endDate: string) => void`: Funkcja zwrotna wywoływana przy zmianie widocznego zakresu dat.

### `VacationDetailsTooltip`

- **Opis komponentu:** Wyświetla dymek (tooltip) ze szczegółowymi informacjami o wniosku urlopowym po najechaniu na niego w kalendarzu.
- **Główne elementy:** Wykorzystuje komponenty `Tooltip` z `Shadcn/ui` do ostylowania. Zawiera pola: Imię i nazwisko, Daty urlopu, Status.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `VacationRequestViewModel`.
- **Propsy:**
  - `vacation: VacationRequestViewModel`: Szczegóły wniosku do wyświetlenia.
  - `triggerElement: HTMLElement`: Element, do którego dymek ma być przypięty.

### `VacationLegend`

- **Opis komponentu:** Prosty komponent wyświetlający legendę kolorów używanych w kalendarzu do oznaczania statusów urlopów (np. Zatwierdzony, Oczekujący).
- **Główne elementy:** Lista (`ul`, `li`) z kolorowymi kwadratami i opisami.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

## 5. Typy

### `TeamCalendarViewModel`

Reprezentuje dane potrzebne do wyświetlenia kalendarza dla jednego zespołu.

```typescript
interface TeamCalendarViewModel {
  teamId: string;
  teamName: string;
  startDate: string;
  endDate: string;
  members: TeamMemberViewModel[];
}
```

### `TeamMemberViewModel`

Reprezentuje członka zespołu wraz z jego wnioskami urlopowymi.

```typescript
interface TeamMemberViewModel {
  id: string;
  firstName: string;
  lastName: string;
  vacations: VacationRequestViewModel[];
}
```

### `VacationRequestViewModel`

Uproszczony model wniosku urlopowego, dostosowany do potrzeb widoku kalendarza.

```typescript
interface VacationRequestViewModel {
  id: string;
  startDate: string;
  endDate: string;
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
```

## 6. Zarządzanie stanem

Stan będzie zarządzany w głównym komponencie `CalendarView` przy użyciu hooków `useState` i `useEffect`. Zostanie stworzony customowy hook `useTeamCalendar` w celu hermetyzacji logiki pobierania i przetwarzania danych.

### `useTeamCalendar(initialTeamId: string)`

- **Cel:** Zarządzanie stanem kalendarza, w tym wybranym zespołem, zakresem dat, ładowaniem danych i obsługą błędów.
- **Zwracane wartości:**
  - `state`: Obiekt zawierający:
    - `isLoading: boolean`: Informuje, czy dane są w trakcie ładowania.
    - `error: Error | null`: Przechowuje ewentualny błąd z API.
    - `calendarData: VacationRequestViewModel[]`: Przetworzona lista urlopów do wyświetlenia.
    - `selectedTeamId: string`: ID aktualnie wybranego zespołu.
    - `dateRange: { start: string, end: string }`: Aktualny zakres dat.
  - `actions`: Obiekt zawierający funkcje do zmiany stanu:
    - `setSelectedTeamId: (teamId: string) => void`: Aktualizuje ID zespołu i inicjuje pobieranie danych.
    - `setDateRange: (range: { start: string, end: string }) => void`: Aktualizuje zakres dat i inicjuje pobieranie danych.

## 7. Integracja API

Komponent `CalendarView` (poprzez hook `useTeamCalendar`) będzie komunikował się z endpointem `/api/teams/:id/calendar`.

- **Endpoint:** `GET /api/teams/:id/calendar`
- **Parametry zapytania:**
  - `month` (string, format: `YYYY-MM`): Wysłany na podstawie aktualnie widocznego miesiąca w kalendarzu.
  - `includeStatus` (string[]): Domyślnie `['SUBMITTED', 'APPROVED']`.
- **Typy żądania:** Parametry będą częścią URL.
- **Typy odpowiedzi:** Odpowiedź API będzie miała strukturę zgodną z `TeamCalendarApiResponse` (zdefiniowaną w opisie endpointu), która zostanie zmapowana na `VacationRequestViewModel[]`.

## 8. Interakcje użytkownika

- **Wybór zespołu:** Użytkownik wybiera zespół z `TeamSelector`. Wywołuje to `onTeamChange`, co aktualizuje stan w `useTeamCalendar` i pobiera nowe dane dla wybranego zespołu.
- **Zmiana miesiąca:** Użytkownik nawiguje do poprzedniego/następnego miesiąca w kalendarzu. Wywołuje to `onDateRangeChange`, co aktualizuje zakres dat w `useTeamCalendar` i pobiera dane dla nowego miesiąca.
- **Najazd na urlop:** Użytkownik najeżdża kursorem na wydarzenie w kalendarzu. Wyświetlony zostaje `VacationDetailsTooltip` ze szczegółami danego urlopu.

## 9. Warunki i walidacja

- **Uprawnienia:** Przed renderowaniem komponentu, na poziomie strony `calendar.astro`, sprawdzane są uprawnienia użytkownika. Widok jest dostępny tylko dla ról `MANAGER` i `ADMIN`.
- **Dostęp do zespołu:** API zapewnia, że menedżer może pobrać dane tylko dla zespołów, którymi zarządza. Frontend nie musi implementować tej logiki, ale powinien obsłużyć błąd `403 Forbidden`.
- **Wybór zespołu:** Komponent `TeamSelector` jest nieaktywny (`disabled`) podczas ładowania danych, aby zapobiec wielokrotnym wywołaniom API.

## 10. Obsługa błędów

- **Błąd ładowania danych:** Jeśli wywołanie API zakończy się niepowodzeniem, hook `useTeamCalendar` ustawi stan `error`. Komponent `CalendarView` wyświetli komunikat o błędzie (np. "Nie udało się załadować danych kalendarza.") zamiast kalendarza.
- **Brak zespołów:** Jeśli zalogowany menedżer nie zarządza żadnym zespołem, `TeamSelector` będzie pusty, a na ekranie pojawi się informacja "Nie zarządzasz żadnym zespołem".
- **Brak urlopów:** Jeśli w wybranym okresie nie ma żadnych wniosków urlopowych, kalendarz wyświetli się pusty, co jest oczekiwanym zachowaniem.

## 11. Kroki implementacji

1. **Stworzenie pliku strony:** Utworzyć plik `src/pages/calendar.astro`. Dodać w nim logikę sprawdzania uprawnień użytkownika (rola `MANAGER` lub `ADMIN`) i pobierania listy zespołów, które zostaną przekazane do komponentu React.
2. **Instalacja biblioteki:** Dodać `FullCalendar` i jego wtyczki do projektu: `npm install @fullcalendar/react @fullcalendar/daygrid`.
3. **Struktura komponentów:** Utworzyć pliki dla wszystkich zdefiniowanych komponentów React w katalogu `src/components/calendar/`.
4. **Implementacja `VacationLegend`:** Stworzyć statyczny komponent legendy.
5. **Implementacja `TeamSelector`:** Stworzyć komponent selektora zespołów, wykorzystując `Select` z `Shadcn/ui`.
6. **Implementacja `VacationDetailsTooltip`:** Stworzyć komponent dymka na szczegóły urlopu.
7. **Implementacja `Calendar`:** Zaimplementować komponent kalendarza, konfigurując `FullCalendar` do wyświetlania wydarzeń i obsługi interakcji.
8. **Implementacja hooka `useTeamCalendar`:** Stworzyć logikę zarządzania stanem, w tym funkcje do pobierania danych z API i ich transformacji.
9. **Implementacja `CalendarView`:** Połączyć wszystkie komponenty w całość. Przekazać dane i handlery z hooka `useTeamCalendar` do odpowiednich komponentów podrzędnych.
10. **Stylowanie:** Dodać style dla kolorów statusów urlopów w pliku `global.css` lub bezpośrednio w komponencie `Calendar` z użyciem `styled-jsx` lub podobnego mechanizmu.
11. **Testowanie:** Przetestować wszystkie interakcje użytkownika, obsługę błędów i poprawność wyświetlania danych dla różnych ról i scenariuszy.
