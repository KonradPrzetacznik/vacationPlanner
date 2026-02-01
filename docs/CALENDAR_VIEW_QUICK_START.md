# Kalendarz zespołu - Szybki start

## Dostęp

Widok kalendarza zespołu jest dostępny pod adresem `/calendar`.

Wymagane uprawnienia: **HR** lub **ADMINISTRATOR**

## Funkcjonalność

### 1. Wybór zespołu
- Z rozwijanej listy wybierz zespół, którego kalendarz chcesz wyświetlić
- Lista zawiera wszystkie zespoły dostępne dla Twojej roli

### 2. Przeglądanie kalendarza
- Kalendarz wyświetla urlopy członków wybranego zespołu
- Każde wydarzenie (urlop) jest kolorowane według statusu:
  - 🟢 **Zielony** - Zatwierdzony
  - 🟡 **Żółty** - Oczekujący
  - 🔴 **Czerwony** - Odrzucony
  - ⚫ **Szary** - Anulowany

### 3. Szczegóły urlopu
- Najedź kursorem na wydarzenie, aby zobaczyć szczegóły:
  - Imię i nazwisko pracownika
  - Daty urlopu
  - Liczba dni roboczych
  - Status wniosku

### 4. Nawigacja
- Użyj przycisków **← →** aby przejść do poprzedniego/następnego miesiąca
- Przycisk **Dzisiaj** przenosi widok do bieżącego miesiąca

## API

Widok korzysta z endpointu:
```
GET /api/teams/:id/calendar?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&includeStatus[]=APPROVED&includeStatus[]=SUBMITTED
```

## Implementacja

Szczegóły techniczne implementacji znajdują się w:
- `docs/CALENDAR_VIEW_IMPLEMENTATION_COMPLETE.md`
- `.ai/team-calendar-view-implementation-plan.md`
