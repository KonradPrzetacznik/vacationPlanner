# Schemat bazy danych PostgreSQL - VacationPlanner

## 1. Typy ENUM

### user_role

```sql
CREATE TYPE user_role AS ENUM ('ADMINISTRATOR', 'HR', 'EMPLOYEE');
```

### request_status

```sql
CREATE TYPE request_status AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');
```

## 2. Tabele

### profiles

Przechowuje profile użytkowników aplikacji. Połączona relacją jeden-do-jednego z tabelą `auth.users` z Supabase.
Table users is managed by Supabase Auth

| Kolumna    | Typ         | Ograniczenia                                                | Opis                                                |
| ---------- | ----------- | ----------------------------------------------------------- | --------------------------------------------------- |
| id         | UUID        | PRIMARY KEY, FOREIGN KEY → auth.users(id) ON DELETE CASCADE | Identyfikator użytkownika (zgodny z auth.users)     |
| first_name | TEXT        | NOT NULL                                                    | Imię użytkownika                                    |
| last_name  | TEXT        | NOT NULL                                                    | Nazwisko użytkownika                                |
| role       | user_role   | NOT NULL, DEFAULT 'EMPLOYEE'                                | Rola użytkownika w systemie                         |
| deleted_at | TIMESTAMPTZ | NULL                                                        | Data i czas soft-delete (NULL = aktywny użytkownik) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                                     | Data i czas utworzenia profilu                      |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                                     | Data i czas ostatniej aktualizacji                  |

**Ograniczenia:**

- PRIMARY KEY: `id`
- FOREIGN KEY: `id` REFERENCES `auth.users(id)` ON DELETE CASCADE

### teams

Przechowuje definicje zespołów w organizacji.

| Kolumna    | Typ         | Ograniczenia                           | Opis                               |
| ---------- | ----------- | -------------------------------------- | ---------------------------------- |
| id         | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid() | Identyfikator zespołu              |
| name       | TEXT        | NOT NULL, UNIQUE                       | Nazwa zespołu                      |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                | Data i czas utworzenia zespołu     |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                | Data i czas ostatniej aktualizacji |

**Ograniczenia:**

- PRIMARY KEY: `id`
- UNIQUE: `name`

### team_members

Tabela łącząca realizująca relację wiele-do-wielu między użytkownikami a zespołami.

| Kolumna    | Typ         | Ograniczenia                                           | Opis                                           |
| ---------- | ----------- | ------------------------------------------------------ | ---------------------------------------------- |
| id         | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid()                 | Identyfikator rekordu                          |
| team_id    | UUID        | NOT NULL, FOREIGN KEY → teams(id) ON DELETE CASCADE    | Identyfikator zespołu                          |
| user_id    | UUID        | NOT NULL, FOREIGN KEY → profiles(id) ON DELETE CASCADE | Identyfikator użytkownika                      |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                                | Data i czas przypisania użytkownika do zespołu |

**Ograniczenia:**

- PRIMARY KEY: `id`
- FOREIGN KEY: `team_id` REFERENCES `teams(id)` ON DELETE CASCADE
- FOREIGN KEY: `user_id` REFERENCES `profiles(id)` ON DELETE CASCADE
- UNIQUE: `(team_id, user_id)` - użytkownik może być przypisany do zespołu tylko raz

### vacation_requests

Przechowuje wnioski urlopowe składane przez użytkowników.

| Kolumna              | Typ            | Ograniczenia                                           | Opis                                                 |
| -------------------- | -------------- | ------------------------------------------------------ | ---------------------------------------------------- |
| id                   | UUID           | PRIMARY KEY, DEFAULT gen_random_uuid()                 | Identyfikator wniosku                                |
| user_id              | UUID           | NOT NULL, FOREIGN KEY → profiles(id) ON DELETE CASCADE | Identyfikator użytkownika składającego wniosek       |
| start_date           | DATE           | NOT NULL                                               | Data rozpoczęcia urlopu                              |
| end_date             | DATE           | NOT NULL                                               | Data zakończenia urlopu                              |
| business_days_count  | INTEGER        | NOT NULL                                               | Liczba dni roboczych (bez weekendów)                 |
| status               | request_status | NOT NULL, DEFAULT 'SUBMITTED'                          | Status wniosku                                       |
| processed_by_user_id | UUID           | NULL, FOREIGN KEY → profiles(id) ON DELETE SET NULL    | Identyfikator użytkownika, który przetworzył wniosek |
| processed_at         | TIMESTAMPTZ    | NULL                                                   | Data i czas przetworzenia wniosku                    |
| created_at           | TIMESTAMPTZ    | NOT NULL, DEFAULT NOW()                                | Data i czas utworzenia wniosku                       |
| updated_at           | TIMESTAMPTZ    | NOT NULL, DEFAULT NOW()                                | Data i czas ostatniej aktualizacji                   |

**Ograniczenia:**

- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` REFERENCES `profiles(id)` ON DELETE CASCADE
- FOREIGN KEY: `processed_by_user_id` REFERENCES `profiles(id)` ON DELETE SET NULL
- CHECK: `start_date <= end_date`
- CHECK: `EXTRACT(DOW FROM start_date) NOT IN (0, 6)` - data rozpoczęcia nie może być w weekend
- CHECK: `EXTRACT(DOW FROM end_date) NOT IN (0, 6)` - data zakończenia nie może być w weekend
- CHECK: `business_days_count > 0`

### vacation_allowances

Przechowuje roczne pule dni urlopowych dla użytkowników.

| Kolumna        | Typ         | Ograniczenia                                           | Opis                                          |
| -------------- | ----------- | ------------------------------------------------------ | --------------------------------------------- |
| id             | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid()                 | Identyfikator rekordu                         |
| user_id        | UUID        | NOT NULL, FOREIGN KEY → profiles(id) ON DELETE CASCADE | Identyfikator użytkownika                     |
| year           | INTEGER     | NOT NULL                                               | Rok, którego dotyczy pula urlopowa            |
| total_days     | INTEGER     | NOT NULL                                               | Całkowita liczba dni urlopu w danym roku      |
| carryover_days | INTEGER     | NOT NULL, DEFAULT 0                                    | Liczba dni przeniesionych z poprzedniego roku |
| created_at     | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                                | Data i czas utworzenia rekordu                |
| updated_at     | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                                | Data i czas ostatniej aktualizacji            |

**Ograniczenia:**

- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` REFERENCES `profiles(id)` ON DELETE CASCADE
- UNIQUE: `(user_id, year)` - jeden rekord na użytkownika na rok
- CHECK: `total_days >= 0`
- CHECK: `carryover_days >= 0`
- CHECK: `year >= 2000 AND year <= 2100`

### settings

Przechowuje globalne ustawienia aplikacji w formacie klucz-wartość.

| Kolumna     | Typ         | Ograniczenia            | Opis                               |
| ----------- | ----------- | ----------------------- | ---------------------------------- |
| key         | TEXT        | PRIMARY KEY             | Klucz ustawienia                   |
| value       | JSONB       | NOT NULL                | Wartość ustawienia w formacie JSON |
| description | TEXT        | NULL                    | Opis ustawienia                    |
| created_at  | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data i czas utworzenia ustawienia  |
| updated_at  | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data i czas ostatniej aktualizacji |

**Ograniczenia:**

- PRIMARY KEY: `key`

**Dane początkowe:**

```sql
INSERT INTO settings (key, value, description) VALUES
  ('default_vacation_days', '26', 'Domyślna liczba dni urlopowych w roku'),
  ('team_occupancy_threshold', '50', 'Próg procentowy (0-100) określający maksymalny odsetek członków zespołu, którzy mogą być jednocześnie na urlopie');
```

### public_holidays (opcjonalna - przygotowanie na przyszłość)

Tabela przygotowana na przyszłą obsługę dni świątecznych.

| Kolumna    | Typ         | Ograniczenia                           | Opis                           |
| ---------- | ----------- | -------------------------------------- | ------------------------------ |
| id         | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid() | Identyfikator święta           |
| date       | DATE        | NOT NULL, UNIQUE                       | Data święta                    |
| name       | TEXT        | NOT NULL                               | Nazwa święta                   |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                | Data i czas utworzenia rekordu |

**Ograniczenia:**

- PRIMARY KEY: `id`
- UNIQUE: `date`

## 3. Relacje między tabelami

### Jeden-do-jednego

- `profiles.id` ↔ `auth.users.id` - każdy profil jest powiązany z kontem użytkownika w systemie autentykacji

### Jeden-do-wielu

- `profiles.id` → `vacation_requests.user_id` - użytkownik może mieć wiele wniosków urlopowych
- `profiles.id` → `vacation_requests.processed_by_user_id` - użytkownik (HR) może przetworzyć wiele wniosków
- `profiles.id` → `vacation_allowances.user_id` - użytkownik ma wiele rekordów puli urlopowej (po jednym na rok)
- `teams.id` → `team_members.team_id` - zespół może mieć wielu członków

### Wiele-do-wielu

- `profiles` ↔ `teams` przez `team_members` - użytkownicy mogą należeć do wielu zespołów, zespoły mogą mieć wielu użytkowników

## 4. Indeksy

### profiles

```sql
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;
```

### team_members

```sql
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
```

### vacation_requests

```sql
CREATE INDEX idx_vacation_requests_user_id ON vacation_requests(user_id);
CREATE INDEX idx_vacation_requests_status ON vacation_requests(status);
CREATE INDEX idx_vacation_requests_dates ON vacation_requests(start_date, end_date);
CREATE INDEX idx_vacation_requests_processed_by ON vacation_requests(processed_by_user_id);
```

### vacation_allowances

```sql
CREATE INDEX idx_vacation_allowances_user_id ON vacation_allowances(user_id);
CREATE INDEX idx_vacation_allowances_year ON vacation_allowances(year);
```

## 5. Funkcje PostgreSQL

### calculate_business_days

Funkcja obliczająca liczbę dni roboczych między dwiema datami (pomija weekendy).

```sql
CREATE OR REPLACE FUNCTION calculate_business_days(
  p_start_date DATE,
  p_end_date DATE
) RETURNS INTEGER AS $$
DECLARE
  v_business_days INTEGER := 0;
  v_current_date DATE;
BEGIN
  -- Walidacja dat
  IF p_start_date > p_end_date THEN
    RETURN 0;
  END IF;

  v_current_date := p_start_date;

  WHILE v_current_date <= p_end_date LOOP
    -- Sprawdź czy dzień nie jest weekendem (0 = niedziela, 6 = sobota)
    IF EXTRACT(DOW FROM v_current_date) NOT IN (0, 6) THEN
      -- Opcjonalne: sprawdź czy dzień nie jest świętem (przygotowanie na przyszłość)
      -- IF NOT EXISTS (SELECT 1 FROM public_holidays WHERE date = v_current_date) THEN
        v_business_days := v_business_days + 1;
      -- END IF;
    END IF;

    v_current_date := v_current_date + 1;
  END LOOP;

  RETURN v_business_days;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### get_team_occupancy

Funkcja obliczająca obłożenie zespołu (procent członków na urlopie) w danym okresie.

```sql
CREATE OR REPLACE FUNCTION get_team_occupancy(
  p_team_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS NUMERIC AS $$
DECLARE
  v_total_members INTEGER;
  v_members_on_vacation INTEGER;
  v_occupancy_percent NUMERIC;
BEGIN
  -- Zlicz aktywnych członków zespołu (nie usuniętych)
  SELECT COUNT(*)
  INTO v_total_members
  FROM team_members tm
  INNER JOIN profiles p ON tm.user_id = p.id
  WHERE tm.team_id = p_team_id
    AND p.deleted_at IS NULL;

  -- Jeśli zespół jest pusty, zwróć 0
  IF v_total_members = 0 THEN
    RETURN 0;
  END IF;

  -- Zlicz unikalnych członków zespołu, którzy mają zaakceptowany urlop
  -- pokrywający się z podanym okresem
  SELECT COUNT(DISTINCT vr.user_id)
  INTO v_members_on_vacation
  FROM vacation_requests vr
  INNER JOIN team_members tm ON vr.user_id = tm.user_id
  INNER JOIN profiles p ON vr.user_id = p.id
  WHERE tm.team_id = p_team_id
    AND vr.status = 'APPROVED'
    AND p.deleted_at IS NULL
    AND vr.start_date <= p_end_date
    AND vr.end_date >= p_start_date;

  -- Oblicz procent obłożenia
  v_occupancy_percent := (v_members_on_vacation::NUMERIC / v_total_members::NUMERIC) * 100;

  RETURN ROUND(v_occupancy_percent, 2);
END;
$$ LANGUAGE plpgsql STABLE;
```

### cancel_future_vacations_on_user_delete

Funkcja wywoływana przez trigger, która anuluje przyszłe urlopy po soft-delete użytkownika.

```sql
CREATE OR REPLACE FUNCTION cancel_future_vacations_on_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Jeśli deleted_at zmienia się z NULL na wartość (soft-delete)
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    -- Anuluj wszystkie przyszłe urlopy użytkownika
    UPDATE vacation_requests
    SET
      status = 'CANCELLED',
      updated_at = NOW()
    WHERE user_id = NEW.id
      AND status IN ('SUBMITTED', 'APPROVED')
      AND start_date > CURRENT_DATE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### update_updated_at_column

Funkcja pomocnicza do automatycznej aktualizacji kolumny `updated_at`.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 6. Triggery

### Trigger do anulowania urlopów po soft-delete użytkownika

```sql
CREATE TRIGGER trigger_cancel_vacations_on_user_delete
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
  EXECUTE FUNCTION cancel_future_vacations_on_user_delete();
```

### Triggery do automatycznej aktualizacji updated_at

```sql
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_vacation_requests_updated_at
  BEFORE UPDATE ON vacation_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_vacation_allowances_updated_at
  BEFORE UPDATE ON vacation_allowances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 7. Zadania pg_cron

### Zerowanie dni zaległych 1 kwietnia

```sql
-- Wymaga rozszerzenia pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Zaplanuj zadanie na 1 kwietnia każdego roku o 00:00
SELECT cron.schedule(
  'reset-carryover-days',
  '0 0 1 4 *',
  $$
    UPDATE vacation_allowances
    SET carryover_days = 0,
        updated_at = NOW()
    WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
  $$
);
```

### Tworzenie nowych uprawnień urlopowych 1 stycznia

```sql
-- Zaplanuj zadanie na 1 stycznia każdego roku o 00:00
SELECT cron.schedule(
  'create-yearly-allowances',
  '0 0 1 1 *',
  $$
    INSERT INTO vacation_allowances (user_id, year, total_days, carryover_days)
    SELECT
      p.id,
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      (SELECT (value::TEXT)::INTEGER FROM settings WHERE key = 'default_vacation_days'),
      0
    FROM profiles p
    WHERE p.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM vacation_allowances va
        WHERE va.user_id = p.id
          AND va.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
      );
  $$
);
```

## 8. Zasady Row Level Security (RLS)

### Włączenie RLS na wszystkich tabelach

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
```

### Polityki dla tabeli profiles

#### Administrator - pełny dostęp do wszystkich profili (włącznie z usuniętymi)

```sql
CREATE POLICY "Administrators can view all profiles including deleted"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMINISTRATOR'
    )
  );

CREATE POLICY "Administrators can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMINISTRATOR'
    )
  );

CREATE POLICY "Administrators can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMINISTRATOR'
    )
  );
```

#### HR - dostęp do aktywnych profili

```sql
CREATE POLICY "HR can view active profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'HR'
      )
      AND deleted_at IS NULL
    )
    OR id = auth.uid()  -- zawsze może zobaczyć swój własny profil
  );
```

#### Employee - dostęp do własnego profilu i profili członków zespołu

```sql
CREATE POLICY "Employees can view their own profile and team members"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR (
      deleted_at IS NULL
      AND EXISTS (
        SELECT 1 FROM team_members tm1
        INNER JOIN team_members tm2 ON tm1.team_id = tm2.team_id
        WHERE tm1.user_id = auth.uid()
          AND tm2.user_id = profiles.id
      )
    )
  );

CREATE POLICY "Employees can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());
```

### Polityki dla tabeli teams

#### HR - pełne zarządzanie zespołami

```sql
CREATE POLICY "HR can manage teams"
  ON teams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'HR'
    )
  );
```

#### Employee - odczyt zespołów, do których należą

```sql
CREATE POLICY "Employees can view their teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = teams.id AND user_id = auth.uid()
    )
  );
```

### Polityki dla tabeli team_members

#### HR - pełne zarządzanie członkostwem w zespołach

```sql
CREATE POLICY "HR can manage team members"
  ON team_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'HR'
    )
  );
```

#### Employee - odczyt członków własnych zespołów

```sql
CREATE POLICY "Employees can view their team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
    )
  );
```

### Polityki dla tabeli vacation_requests

#### HR - pełny dostęp do wszystkich wniosków

```sql
CREATE POLICY "HR can manage all vacation requests"
  ON vacation_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'HR'
    )
  );
```

#### Employee - zarządzanie własnymi wnioskami i odczyt wniosków członków zespołu

```sql
CREATE POLICY "Employees can manage their own requests"
  ON vacation_requests FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Employees can view team members requests"
  ON vacation_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm1
      INNER JOIN team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid()
        AND tm2.user_id = vacation_requests.user_id
    )
  );
```

### Polityki dla tabeli vacation_allowances

#### HR - pełny dostęp do wszystkich uprawnień

```sql
CREATE POLICY "HR can manage all vacation allowances"
  ON vacation_allowances FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'HR'
    )
  );
```

#### Employee - odczyt własnych uprawnień

```sql
CREATE POLICY "Employees can view their own allowances"
  ON vacation_allowances FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

### Polityki dla tabeli settings

#### HR - pełne zarządzanie ustawieniami

```sql
CREATE POLICY "HR can manage settings"
  ON settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'HR'
    )
  );
```

#### Employee - odczyt ustawień

```sql
CREATE POLICY "Employees can view settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);
```

## 9. Dodatkowe uwagi i decyzje projektowe

### Soft-delete

- Implementacja soft-delete poprzez kolumnę `deleted_at` w tabeli `profiles` pozwala na zachowanie integralności danych historycznych
- Usunięci użytkownicy są filtrowane przez polityki RLS dla ról innych niż Administrator
- Trigger automatycznie anuluje przyszłe urlopy po soft-delete użytkownika

### Bezpieczeństwo

- Wszystkie tabele mają włączone RLS
- Dostęp do danych jest kontrolowany na poziomie wiersza w zależności od roli użytkownika
- Administratorzy mają dostęp tylko do zarządzania profilami, nie mają dostępu do urlopów i zespołów
- HR ma pełny dostęp do zarządzania zespołami, urlopami i ustawieniami
- Pracownicy widzą tylko swoje dane i dane członków swoich zespołów

### Wydajność

- Indeksy zostały dodane na najczęściej używanych kolumnach w klauzulach WHERE i JOIN
- Funkcja `calculate_business_days` jest oznaczona jako IMMUTABLE dla lepszego cache'owania
- Funkcja `get_team_occupancy` jest oznaczona jako STABLE
- Pre-kalkulacja liczby dni roboczych w `vacation_requests.business_days_count` unika powtarzających się obliczeń

### Automatyzacja

- Zadania pg_cron automatyzują roczne procesy (zerowanie dni zaległych, tworzenie nowych uprawnień)
- Triggery automatyzują aktualizację kolumn `updated_at` we wszystkich tabelach
- Trigger automatycznie anuluje urlopy po usunięciu użytkownika

### Skalowalność

- Użycie UUID jako kluczy głównych pozwala na przyszłe rozproszenie systemu
- Tabela `public_holidays` jest przygotowana na przyszłą obsługę świąt (obecnie nieużywana)
- Funkcja `calculate_business_days` jest przygotowana na obsługę świąt poprzez odkomentowanie odpowiedniego fragmentu

### Integralność danych

- Ograniczenia CHECK zapewniają poprawność dat i wartości liczbowych
- Ograniczenia UNIQUE zapobiegają duplikacjom (np. nazw zespołów, członkostwa w zespołach)
- Kaskadowe usuwanie (ON DELETE CASCADE) zapewnia spójność relacji
- ON DELETE SET NULL dla `processed_by_user_id` zachowuje historię przetworzonych wniosków

### Nierozwiązane kwestie (poza zakresem MVP)

- Brak mechanizmu obsługi usunięcia ostatniego użytkownika z rolą HR (obsługa proceduralna)
- Brak automatycznej aktualizacji uprawnień po zmianie roli użytkownika (dostęp kontrolowany dynamicznie przez RLS)
- Brak obsługi dni świątecznych (tabela przygotowana, funkcje gotowe na rozszerzenie)
