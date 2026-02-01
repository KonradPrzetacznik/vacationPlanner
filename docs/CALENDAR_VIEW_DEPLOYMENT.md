# Wdrożenie widoku kalendarza na produkcję

## Checklist przed wdrożeniem

### 1. Weryfikacja kodu

- [x] Wszystkie komponenty utworzone i przetestowane lokalnie
- [x] Brak błędów TypeScript
- [x] Import stylów FullCalendar dodany
- [x] Hook useTeamCalendar zaimplementowany
- [x] Wszystkie propsy zgodne z typami

### 2. Sprawdzenie zależności

```bash
# Sprawdź czy wszystkie zależności są zainstalowane
npm list @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/interaction
```

Oczekiwany output:

```
├── @fullcalendar/core@6.x.x
├── @fullcalendar/daygrid@6.x.x
├── @fullcalendar/interaction@6.x.x
└── @fullcalendar/react@6.x.x
```

### 3. Testy manualne

- [ ] Wykonać testy z: `tests/manual/CALENDAR_VIEW_MANUAL_TEST.md`
- [ ] Przetestować na różnych przeglądarkach (Chrome, Firefox, Safari)
- [ ] Przetestować responsywność (desktop, tablet, mobile)

### 4. Sprawdzenie API

```bash
# Test endpointu calendar API
curl -X GET "http://localhost:3000/api/teams/{teamId}/calendar?startDate=2026-02-01&endDate=2026-02-28&includeStatus=APPROVED&includeStatus=SUBMITTED"
```

Oczekiwana odpowiedź: 200 OK z danymi kalendarza

### 5. Weryfikacja bezpieczeństwa

- [x] Sprawdzanie uprawnień na poziomie strony (tylko HR i ADMINISTRATOR)
- [x] Sprawdzanie uprawnień na poziomie API
- [x] Brak wrażliwych danych w konsoli przeglądarki (tylko dev logi)

## Pliki do wdrożenia

### Nowe pliki:

```
src/pages/calendar.astro
src/components/calendar/CalendarView.tsx
src/components/calendar/Calendar.tsx
src/components/calendar/TeamSelector.tsx
src/components/calendar/VacationLegend.tsx
src/components/calendar/VacationDetailsTooltip.tsx
src/components/hooks/useTeamCalendar.ts
```

### Zmodyfikowane pliki:

```
src/types.ts (dodane typy ViewModel)
src/components/Navigation.astro (dodany link do kalendarza)
```

### Dokumentacja:

```
docs/CALENDAR_VIEW_IMPLEMENTATION_COMPLETE.md
docs/CALENDAR_VIEW_QUICK_START.md
tests/manual/CALENDAR_VIEW_MANUAL_TEST.md
```

## Kroki wdrożenia

### 1. Commit i push zmian

```bash
git add .
git commit -m "feat: implement team calendar view

- Add calendar page at /calendar route
- Implement CalendarView container component
- Add Calendar component with FullCalendar integration
- Add TeamSelector, VacationLegend, and VacationDetailsTooltip
- Add useTeamCalendar hook for state management
- Add VacationRequestViewModel types
- Update navigation with calendar link
- Add manual test documentation

Closes #[issue-number]"

git push origin [branch-name]
```

### 2. Code Review

- [ ] Utworzyć Pull Request
- [ ] Poprosić o review od zespołu
- [ ] Zaadresować komentarze z review
- [ ] Uzyskać approval

### 3. Merge do głównej gałęzi

```bash
git checkout main
git pull origin main
git merge [branch-name]
git push origin main
```

### 4. Deploy na staging

- [ ] Uruchomić pipeline CI/CD dla staging
- [ ] Poczekać na zakończenie buildu
- [ ] Sprawdzić logi wdrożenia

### 5. Weryfikacja na staging

- [ ] Otworzyć aplikację na staging: https://staging.vacationplanner.com/calendar
- [ ] Wykonać podstawowe testy smoke:
  - Dostęp do strony
  - Wybór zespołu
  - Wyświetlanie urlopów
  - Zmiana miesiąca
  - Tooltip
- [ ] Sprawdzić logi aplikacji (brak błędów)
- [ ] Sprawdzić metryki wydajności

### 6. Deploy na produkcję

- [ ] Uruchomić pipeline CI/CD dla produkcji
- [ ] Poczekać na zakończenie buildu
- [ ] Sprawdzić logi wdrożenia

### 7. Weryfikacja na produkcji

- [ ] Otworzyć aplikację na produkcji: https://vacationplanner.com/calendar
- [ ] Wykonać testy smoke (jak na staging)
- [ ] Monitorować logi przez pierwsze 15 minut
- [ ] Sprawdzić metryki wydajności i błędów

### 8. Komunikacja

- [ ] Powiadomić zespół o nowej funkcjonalności
- [ ] Zaktualizować dokumentację użytkownika
- [ ] Dodać informację o nowej funkcji do release notes

## Rollback plan

W przypadku krytycznych problemów na produkcji:

### Opcja 1: Szybki rollback

```bash
git revert [commit-hash]
git push origin main
# Deploy poprzedniej wersji
```

### Opcja 2: Wyłączenie widoku

Jeśli problem dotyczy tylko widoku kalendarza:

1. Usunąć link z Navigation.astro
2. Zablokować routing `/calendar` w middleware
3. Deploy hotfix

### Opcja 3: Pełny rollback

```bash
# Przywróć poprzednią wersję z tagu
git checkout [previous-tag]
git push origin main --force
# Deploy poprzedniej wersji
```

## Monitoring po wdrożeniu

### Metryki do monitorowania (pierwsze 24h):

- [ ] Liczba odwiedzin strony `/calendar`
- [ ] Średni czas ładowania kalendarza
- [ ] Liczba błędów 403/404/500
- [ ] Liczba wywołań API `/api/teams/:id/calendar`
- [ ] Feedback od użytkowników

### Potencjalne problemy i rozwiązania:

**Problem**: Kalendarz ładuje się zbyt wolno (>2s)

- Rozwiązanie: Zoptymalizować zapytanie do bazy danych, dodać cache

**Problem**: Błędy 403 dla uprawnionych użytkowników

- Rozwiązanie: Sprawdzić logikę autoryzacji, sprawdzić dane w tabeli profiles

**Problem**: Tooltip nie wyświetla się poprawnie

- Rozwiązanie: Sprawdzić positioning, sprawdzić z-index

**Problem**: Wydarzenia nie wyświetlają się w kalendarzu

- Rozwiązanie: Sprawdzić transformację danych z API, sprawdzić filtry statusów

## Kontakt w razie problemów

- **Tech Lead**: [imię nazwisko] - [email/slack]
- **Backend Lead**: [imię nazwisko] - [email/slack]
- **DevOps**: [imię nazwisko] - [email/slack]

## Dokumentacja

- Techniczne szczegóły: `docs/CALENDAR_VIEW_IMPLEMENTATION_COMPLETE.md`
- Przewodnik użytkownika: `docs/CALENDAR_VIEW_QUICK_START.md`
- Testy manualne: `tests/manual/CALENDAR_VIEW_MANUAL_TEST.md`
- Plan implementacji: `.ai/team-calendar-view-implementation-plan.md`
