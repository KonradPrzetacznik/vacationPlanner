# Implementacja akcji zatwierdzania/odrzucania urlopów w kalendarzu

## ✅ Zaimplementowano

Dodano możliwość zatwierdzania i odrzucania wniosków urlopowych bezpośrednio z widoku kalendarza zespołu.

## Funkcjonalność

### 1. Kliknięcie na urlop w kalendarzu

Użytkownik (HR/ADMINISTRATOR) może kliknąć na dowolny urlop wyświetlony w kalendarzu, co wyświetli dialog ze szczegółami i akcjami.

### 2. Dialog z akcjami (VacationActionDialog)

Dialog wyświetla:

- **Informacje o urlopie:**
  - Imię i nazwisko pracownika
  - Zakres dat (od-do)
  - Liczba dni roboczych
  - Aktualny status

- **Akcje (tylko dla statusu SUBMITTED):**
  - **Zatwierdź** - zatwierdza wniosek
  - **Odrzuć** - pokazuje formularz z polem na przyczynę odrzucenia

### 3. Zatwierdzanie urlopu

**Endpoint:** `POST /api/vacation-requests/:id/approve`

**Parametry:**

```json
{
  "acknowledgeThresholdWarning": true
}
```

**Przepływ:**

1. Kliknięcie "Zatwierdź"
2. Wysłanie requesta do API
3. Komunikat o sukcesie lub błędzie
4. Odświeżenie kalendarza (ponowne pobranie danych)
5. Zamknięcie dialogu

### 4. Odrzucanie urlopu

**Endpoint:** `POST /api/vacation-requests/:id/reject`

**Parametry:**

```json
{
  "reason": "Przyczyna odrzucenia"
}
```

**Przepływ:**

1. Kliknięcie "Odrzuć"
2. Wyświetlenie formularza z polem tekstowym (textarea)
3. Walidacja: przyczyna jest wymagana
4. Kliknięcie "Potwierdź odrzucenie"
5. Wysłanie requesta do API
6. Komunikat o sukcesie lub błędzie
7. Odświeżenie kalendarza
8. Zamknięcie dialogu

## Komponenty

### VacationActionDialog

**Plik:** `src/components/calendar/VacationActionDialog.tsx`

**Props:**

- `vacation: VacationRequestViewModel | null` - dane urlopu do wyświetlenia
- `open: boolean` - czy dialog jest otwarty
- `onOpenChange: (open: boolean) => void` - callback zmiany stanu
- `onSuccess: () => void` - callback po udanej akcji (używany do odświeżenia kalendarza)

**State:**

- `isApproving: boolean` - stan ładowania podczas zatwierdzania
- `isRejecting: boolean` - stan ładowania podczas odrzucania
- `showRejectForm: boolean` - czy pokazać formularz odrzucenia
- `rejectReason: string` - przyczyna odrzucenia
- `error: string | null` - komunikat błędu

**Funkcje:**

- `handleApprove()` - zatwierdza urlop
- `handleReject()` - odrzuca urlop z podaną przyczyną
- `resetForm()` - czyści formularz i błędy
- `handleClose()` - zamyka dialog (z blokowaniem podczas akcji)

**UI:**

- Ikony: User, Calendar, CheckCircle, XCircle, Loader2 (z lucide-react)
- Komponenty Shadcn/ui: Dialog, Button, Textarea, Label
- Kolorowanie statusów: SUBMITTED (żółty), APPROVED (zielony), REJECTED (czerwony), CANCELLED (szary)

### Zmiany w Calendar

**Plik:** `src/components/calendar/Calendar.tsx`

**Dodano:**

- Props: `onEventClick?: (vacation: VacationRequestViewModel) => void`
- Handler: `handleEventClick` - wywołuje callback po kliknięciu na wydarzenie
- FullCalendar config: `eventClick={handleEventClick}`

### Zmiany w CalendarView

**Plik:** `src/components/calendar/CalendarView.tsx`

**Dodano:**

- State: `selectedVacation` - przechowuje wybrany urlop
- State: `isDialogOpen` - czy dialog jest otwarty
- Handler: `handleEventClick` - otwiera dialog z wybranym urlopem
- Handler: `handleActionSuccess` - odświeża kalendarz po akcji
- Komponent: `<VacationActionDialog />` - renderuje dialog

## Integracja API

### Approve endpoint

**URL:** `POST /api/vacation-requests/:id/approve`

**Request body:**

```typescript
{
  acknowledgeThresholdWarning?: boolean;
}
```

**Response (200 OK):**

```typescript
{
  id: string;
  status: "APPROVED";
  processedByUserId: string;
  processedAt: string; // ISO datetime
  thresholdWarning: ThresholdWarningDTO | null;
}
```

### Reject endpoint

**URL:** `POST /api/vacation-requests/:id/reject`

**Request body:**

```typescript
{
  reason: string; // REQUIRED
}
```

**Response (200 OK):**

```typescript
{
  id: string;
  status: "REJECTED";
  processedByUserId: string;
  processedAt: string; // ISO datetime
}
```

## Obsługa błędów

- **Błędy sieci** - wyświetlane w dialogu w czerwonym polu
- **Błędy API** - parsowane i wyświetlane jako czytelne komunikaty
- **Walidacja** - brak przyczyny odrzucenia → komunikat "Podaj przyczynę odrzucenia"
- **Timeout** - dzięki implementacji AbortController (30s)

## Odświeżanie danych

Po udanej akcji (zatwierdź/odrzuć):

1. Wywołanie `onSuccess()` callback
2. CalendarView wykonuje: `actions.setDateRange({ start: currentRange.start, end: currentRange.end })`
3. Hook `useTeamCalendar` wykrywa zmianę (nawet jeśli wartości są te same, wywołuje fetch)
4. API zwraca zaktualizowane dane
5. Kalendarz wyświetla nowy status urlopu

## UX/UI

### Stan ładowania

- Buttony disabled podczas akcji
- Spinner + tekst "Zatwierdzanie..." / "Odrzucanie..."
- Dialog nie może być zamknięty podczas akcji

### Walidacja

- Przycisk "Potwierdź odrzucenie" disabled gdy brak przyczyny
- Textarea disabled podczas odrzucania

### Dostępność

- Labele dla textarea (Label z Shadcn/ui)
- Ikony z opisami
- Semantic HTML (DialogTitle, DialogDescription)

## Instalowane komponenty

```bash
npx shadcn@latest add dialog    # Dialog
npx shadcn@latest add textarea  # Textarea dla przyczyny odrzucenia
```

## Testowanie

### Test 1: Zatwierdzanie urlopu

1. Otwórz kalendarz zespołu
2. Kliknij na urlop ze statusem "Oczekujący" (żółty)
3. W dialogu kliknij "Zatwierdź"
4. Sprawdź:
   - ✅ Dialog pokazuje loader
   - ✅ Po sukcesie kalendarz odświeża się
   - ✅ Status urlopu zmienia się na "Zatwierdzony" (zielony)
   - ✅ Dialog zamyka się

### Test 2: Odrzucanie urlopu

1. Kliknij na urlop "Oczekujący"
2. Kliknij "Odrzuć"
3. Wpisz przyczynę w textarea
4. Kliknij "Potwierdź odrzucenie"
5. Sprawdź:
   - ✅ Dialog pokazuje loader
   - ✅ Kalendarz odświeża się
   - ✅ Status zmienia się na "Odrzucony" (czerwony)
   - ✅ Dialog zamyka się

### Test 3: Walidacja

1. Kliknij "Odrzuć"
2. NIE wpisuj przyczyny
3. Sprawdź:
   - ✅ Przycisk "Potwierdź odrzucenie" jest disabled
4. Wpisz spację
5. Sprawdź:
   - ✅ Przycisk nadal disabled (trim sprawdza puste stringi)

### Test 4: Anulowanie

1. Kliknij "Odrzuć"
2. Wpisz tekst
3. Kliknij "Anuluj"
4. Sprawdź:
   - ✅ Formularz się chowa
   - ✅ Tekst jest wyczyszczony

### Test 5: Urlop nieoczekujący

1. Kliknij na urlop "Zatwierdzony" lub "Odrzucony"
2. Sprawdź:
   - ✅ Brak buttonów akcji
   - ✅ Tylko przycisk "Zamknij"
   - ✅ Komunikat "Ten wniosek nie może być już edytowany"

## Status

✅ **ZAIMPLEMENTOWANO** - Pełna funkcjonalność zatwierdzania/odrzucania urlopów z kalendarza!

## Pliki

**Nowe:**

- `src/components/calendar/VacationActionDialog.tsx` (282 linie)
- `src/components/ui/textarea.tsx` (zainstalowany przez CLI)

**Zmodyfikowane:**

- `src/components/calendar/Calendar.tsx` - dodano obsługę kliknięć
- `src/components/calendar/CalendarView.tsx` - dodano stan dialogu i handlery
