# Calendar Components

Komponenty React dla widoku kalendarza zespołu.

## Struktura komponentów

```
calendar/
├── CalendarView.tsx          # Główny kontener
├── Calendar.tsx              # Komponent kalendarza (FullCalendar)
├── TeamSelector.tsx          # Selektor zespołu
├── VacationLegend.tsx        # Legenda statusów
├── VacationsList.tsx         # Lista urlopów
├── VacationDetailsTooltip.tsx # Tooltip ze szczegółami
└── VacationActionDialog.tsx  # Dialog akcji (zatwierdzanie/odrzucanie)
```

## CalendarView

Główny komponent kontenera zarządzający stanem całego widoku.

**Props:**

- `teams: TeamListItemDTO[]` - Lista zespołów
- `initialTeamId: string` - ID początkowego zespołu
- `currentUser: User` - Aktualny użytkownik (zarezerwowane na przyszłość)

**Stan:** Zarządzany przez `useTeamCalendar` hook

## Calendar

Komponent wyświetlający kalendarz z wykorzystaniem FullCalendar.

**Props:**

- `vacations: VacationRequestViewModel[]` - Lista urlopów do wyświetlenia
- `onDateRangeChange: (startDate, endDate) => void` - Callback przy zmianie zakresu dat

**Features:**

- Polski interfejs
- Widok miesięczny
- Kolorowanie wydarzeń według statusu
- Wyświetla tylko urlopy ze statusem SUBMITTED i APPROVED
- REJECTED i CANCELLED są widoczne tylko w liście poniżej
- Tooltip przy najechaniu na wydarzenie
- Responsywny design

## TeamSelector

Komponent wyboru zespołu.

**Props:**

- `teams: TeamListItemDTO[]` - Lista zespołów
- `selectedTeamId: string` - ID wybranego zespołu
- `onTeamChange: (teamId) => void` - Callback przy zmianie zespołu
- `disabled?: boolean` - Stan nieaktywny

## VacationLegend

Statyczny komponent wyświetlający legendę kolorów statusów.

**Statusy na kalendarzu:**

- 🟢 Zatwierdzony (APPROVED)
- 🟡 Oczekujący (SUBMITTED)

**Statusy widoczne tylko w liście poniżej:**

- 🔴 Odrzucony (REJECTED)
- ⚫ Anulowany (CANCELLED)

## VacationsList

Komponent wyświetlający listę wszystkich urlopów w wybranym okresie.

**Props:**

- `vacations: VacationRequestViewModel[]` - Lista urlopów do wyświetlenia
- `onVacationClick?: (vacation) => void` - Callback przy kliknięciu na urlop

**Features:**

- Wyświetla wszystkie statusy (włącznie z REJECTED i CANCELLED)
- Sortowanie według daty rozpoczęcia
- Informacje: pracownik, daty, liczba dni, status
- Klikalne elementy (otwierają dialog akcji)
- Responsywny design

## VacationDetailsTooltip

Tooltip ze szczegółami wniosku urlopowego.

**Props:**

- `vacation: VacationRequestViewModel` - Dane urlopu
- `position: {x, y}` - Pozycja tooltipa

**Wyświetlane informacje:**

- Imię i nazwisko pracownika
- Daty urlopu (od-do)
- Liczba dni roboczych
- Status wniosku

## Użycie

```tsx
import { CalendarView } from "@/components/calendar/CalendarView";

<CalendarView teams={teams} initialTeamId={teamId} currentUser={user} />;
```

## Zależności

- `@fullcalendar/react` - Biblioteka kalendarza
- `@fullcalendar/core` - Rdzeń FullCalendar
- `@fullcalendar/daygrid` - Widok miesięczny
- `@fullcalendar/interaction` - Interakcje użytkownika
- `@/components/ui` - Komponenty Shadcn/ui (Select, Label)
- `lucide-react` - Ikony (Loader2)

## Style

Style FullCalendar importowane bezpośrednio w komponencie Calendar:

```tsx
import "@fullcalendar/core/index.css";
import "@fullcalendar/daygrid/index.css";
```

Custom style zintegrowane z motywem aplikacji przez CSS-in-JS.

## API Integration

Komponenty komunikują się z endpointem:

```
GET /api/teams/:id/calendar
```

Za pomocą hooka `useTeamCalendar`.

## Dokumentacja

- Implementacja: `docs/CALENDAR_VIEW_IMPLEMENTATION_COMPLETE.md`
- Przewodnik użytkownika: `docs/CALENDAR_VIEW_QUICK_START.md`
- Testy: `tests/manual/CALENDAR_VIEW_MANUAL_TEST.md`
