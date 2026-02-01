<conversation_summary>
<decisions>

1.  Role użytkowników (`ADMINISTRATOR`, `HR`, `EMPLOYEE`) będą przechowywane jako typ `ENUM` w PostgreSQL.
2.  Mechanizm "soft-delete" dla użytkowników zostanie zaimplementowany za pomocą kolumny `deleted_at` (`TIMESTAMPTZ`) w tabeli `profiles`.
3.  Relacja wiele-do-wielu między użytkownikami a zespołami zostanie zrealizowana przez tabelę łączącą `team_members`.
4.  Statusy wniosków urlopowych (`SUBMITTED`, `APPROVED`, `REJECTED`, `CANCELLED`) będą przechowywane jako typ `ENUM`. Tabela będzie nosić nazwę `vacation_requests`.
5.  Zaległe dni urlopowe będą zarządzane w tabeli `vacation_allowances` z kolumnami `user_id`, `year`, `total_days` i `carryover_days`.
6.  Globalne ustawienia aplikacji (np. domyślna liczba dni urlopu) będą przechowywane w tabeli `settings` z kolumnami `key` (TEXT) i `value` (JSONB).
7.  Wszystkie tabele będą używać `UUID` jako kluczy głównych.
8.  Liczba dni roboczych wniosku urlopowego będzie obliczana i przechowywana w kolumnie `business_days_count` w tabeli `vacation_requests`.
9.  Zostaną zaimplementowane szczegółowe zasady bezpieczeństwa na poziomie wiersza (RLS) dla ról `HR`, `ADMINISTRATOR` i `EMPLOYEE`.
10. Zostanie utworzony trigger, który automatycznie anuluje przyszłe urlopy użytkownika po jego usunięciu (soft-delete).
11. Rozszerzenie `pg_cron` zostanie użyte do zerowania zaległych dni urlopowych 1 kwietnia oraz do tworzenia nowych rocznych uprawnień 1 stycznia.
12. Zostanie utworzona funkcja PostgreSQL `get_team_occupancy` do obliczania obłożenia zespołu.
13. Logika obsługi akceptacji własnych wniosków przez jedynego HR-owca w systemie zostanie zaimplementowana w warstwie aplikacyjnej.
14. Tabela `profiles` zostanie połączona z `auth.users` za pomocą klucza obcego z regułą `ON DELETE CASCADE`.
15. Usunięcie zespołu spowoduje kaskadowe usunięcie powiązań w tabeli `team_members` (`ON DELETE CASCADE`).
16. Zostanie utworzona funkcja `calculate_business_days` w PostgreSQL, która będzie uwzględniać weekendy i będzie przygotowana na przyszłą obsługę świąt.
17. Tabela `vacation_requests` będzie zawierać kolumnę `processed_by_user_id` do śledzenia, kto przetworzył wniosek.
18. Tabela `settings` zostanie wstępnie wypełniona wartościami `default_vacation_days` i `team_occupancy_threshold`.
19. Do tabeli `vacation_requests` zostaną dodane ograniczenia `CHECK`, aby zapewnić, że `start_date <= end_date` oraz że urlop nie zaczyna się i nie kończy w weekend.
20. Zostaną dodane ograniczenia `UNIQUE` na nazwie zespołu (`teams.name`) oraz na parze `(user_id, year)` w tabeli `vacation_allowances`.
    </decisions>

<matched_recommendations>

1.  Zdefiniuj niestandardowy typ `ENUM` w PostgreSQL o nazwie `user_role` z wartościami `ADMINISTRATOR`, `HR` i `EMPLOYEE`.
2.  W tabeli `profiles` dodaj kolumnę `deleted_at` typu `TIMESTAMPTZ`, która domyślnie jest `NULL`. Zasady RLS powinny filtrować wiersze dla ról innych niż `ADMINISTRATOR`.
3.  Utwórz tabelę łączącą `team_members` z kluczami obcymi `team_id` i `user_id`.
4.  Stwórz typ `ENUM` o nazwie `request_status` z wartościami `SUBMITTED`, `APPROVED`, `REJECTED` i `CANCELLED`.
5.  Utwórz tabelę `vacation_allowances` z kolumnami `user_id`, `year`, `total_days` i `carryover_days`.
6.  Użyj `UUID` jako kluczy głównych dla wszystkich tabel.
7.  Dodaj kolumnę `business_days_count` typu `INTEGER` do tabeli `vacation_requests`.
8.  Stwórz funkcję w PostgreSQL wywoływaną przez trigger na tabeli `profiles`, która po operacji "soft-delete" zmieni status przyszłych wniosków urlopowych na `CANCELLED`.
9.  Użyj `pg_cron`, aby zaplanować zadanie, które 1 kwietnia będzie zerować `carryover_days` w tabeli `vacation_allowances`.
10. Tabela `profiles` powinna mieć kolumnę `id` typu `UUID`, która jest kluczem głównym i obcym wskazującym na `auth.users.id` z `ON DELETE CASCADE`.
11. W tabeli `team_members` dla klucza obcego `team_id` ustaw regułę `ON DELETE CASCADE`.
12. Stwórz funkcję `calculate_business_days(start_date, end_date)`, która pomija weekendy i jest gotowa na przyszłą obsługę świąt poprzez odwołanie do tabeli `public_holidays`.
13. W tabeli `vacation_requests` dodaj kolumnę `processed_by_user_id` typu `UUID` jako klucz obcy do tabeli `profiles`.
14. Dodaj ograniczenie `CHECK (start_date <= end_date)` oraz `CHECK` uniemożliwiające rozpoczynanie i kończenie urlopu w weekend do tabeli `vacation_requests`.
15. Dodaj ograniczenie `UNIQUE` na kolumnie `name` w tabeli `teams` oraz na parze `(user_id, year)` w tabeli `vacation_allowances`.
    </matched_recommendations>

<database_planning_summary>
Na podstawie przeprowadzonych dyskusji, schemat bazy danych PostgreSQL dla aplikacji VacationPlanner MVP zostanie zaprojektowany w oparciu o następujące założenia:

**Główne wymagania dotyczące schematu:**
Schemat będzie zorientowany na obsługę trzech ról użytkowników, zarządzanie zespołami oraz proces składania i akceptacji wniosków urlopowych. Kluczowe jest zapewnienie integralności danych poprzez użycie typów `ENUM` dla ról i statusów, a także odpowiednich ograniczeń (`CHECK`, `UNIQUE`). Wszystkie tabele będą używać `UUID` jako kluczy głównych w celu zachowania spójności z systemem autentykacji Supabase.

**Kluczowe encje i ich relacje:**

- `profiles`: Przechowuje dane użytkowników (imię, nazwisko, rola) i jest połączona relacją jeden-do-jednego z tabelą `auth.users` od Supabase. Zawiera kolumnę `deleted_at` do obsługi "soft-delete".
- `teams`: Przechowuje nazwy zespołów.
- `team_members`: Tabela łącząca, realizująca relację wiele-do-wielu między `profiles` a `teams`.
- `vacation_requests`: Główna tabela transakcyjna przechowująca wnioski urlopowe. Posiada relacje do `profiles` (kto złożył wniosek i kto go przetworzył), zawiera daty, status (`ENUM`) oraz pre-kalkulowaną liczbę dni roboczych.
- `vacation_allowances`: Śledzi roczne pule urlopowe dla każdego użytkownika, w tym dni przeniesione z poprzedniego roku.
- `settings`: Tabela klucz-wartość (`JSONB`) do przechowywania globalnych konfiguracji.

**Bezpieczeństwo i skalowalność:**

- **Bezpieczeństwo:** Dostęp do danych będzie ściśle kontrolowany za pomocą polityk RLS (Row-Level Security) w PostgreSQL. Polityki te zapewnią, że pracownicy widzą tylko swoje dane i kalendarze swoich zespołów, HR ma dostęp do zarządzania urlopami i zespołami, a Administrator zarządza tylko profilami użytkowników.
- **Skalowalność:** Użycie `UUID` jako kluczy głównych jest dobrym rozwiązaniem pod kątem przyszłego rozproszenia systemu. Automatyzacja procesów rocznych (tworzenie uprawnień, zerowanie dni zaległych) za pomocą `pg_cron` odciąży aplikację i zapewni wydajność. Pre-kalkulacja liczby dni roboczych we wnioskach oraz tworzenie dedykowanych funkcji (np. `get_team_occupancy`) zoptymalizuje często wykonywane zapytania.

</database_planning_summary>

<unresolved_issues>

- Brak zdefiniowanego mechanizmu obsługi scenariusza, w którym ostatni użytkownik z rolą `HR` zostaje usunięty. Zgodnie z decyzją, MVP zakłada, że taka sytuacja nie będzie miała miejsca i jest to reguła biznesowa do obsłużenia proceduralnie.
- Brak zdefiniowanego mechanizmu obsługi kaskadowych zmian uprawnień po zmianie roli użytkownika. Zgodnie z decyzją, dla MVP nie jest to obsługiwane, a dostęp jest dynamicznie kontrolowany przez RLS na podstawie aktualnej roli.
  </unresolved_issues>
  </conversation_summary>
