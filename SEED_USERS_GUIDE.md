# Seed Users Script - Dokumentacja

Skrypty do tworzenia użytkowników testowych z hasłem `test123` na podstawie `supabase/seed.sql`.

## Dostępne skrypty

### 1. `setup-seed-users.sh` (REKOMENDOWANY)

Główny skrypt z automatycznym wyborem metody.

**Użycie:**

```bash
./setup-seed-users.sh                    # Auto-detect method
./setup-seed-users.sh api               # Force API method
./setup-seed-users.sh sql               # Force SQL method
./setup-seed-users.sh --help            # Pokaż pomoc
```

**Metody:**

- **API** - Tworzy użytkowników przez REST API (`POST /api/users`)
  - Wymaga: Serwer uruchomiony (`npm run dev`)
  - Zaleta: Działa wszędzie
  - Disadvantage: Wolniej (13 requestów sequentially)

- **SQL** - Bezpośrednie SQL do bazy
  - Wymaga: Supabase CLI lub dostęp do PostgreSQL
  - Zaleta: Szybko (1 request)
  - Disadvantage: Wymaga dodatkowych narzędzi

### 2. `seed-users-with-password.sh`

Alternatywny skrypt, który używa wyłącznie metody API.

**Użycie:**

```bash
./seed-users-with-password.sh
```

**Zmienne środowiskowe:**

```bash
API_BASE=http://localhost:3000 ./seed-users-with-password.sh
```

### 3. `seed-users-direct.sh`

Skrypt bezpośredniego dostępu do bazy danych (SQL).

**Użycie:**

```bash
# Z Supabase CLI
supabase start
./seed-users-direct.sh

# Z zmiennymi środowiskowymi
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
./seed-users-direct.sh
```

## Użytkownicy do stworzenia

13 użytkowników z seed.sql:

| Email                                           | Imię      | Nazwisko                | Rola          | Hasło   |
| ----------------------------------------------- | --------- | ----------------------- | ------------- | ------- |
| admin.user@vacationplanner.pl                   | Admin     | User-ADM                | ADMINISTRATOR | test123 |
| ferdynand.kiepski@vacationplanner.pl            | Ferdynand | Kiepski-HR              | HR            | test123 |
| halina.kiepska@vacationplanner.pl               | Halina    | Kiepska-HR              | HR            | test123 |
| kazimierz.pawlak@vacationplanner.pl             | Kazimierz | Pawlak-EMP              | EMPLOYEE      | test123 |
| jacek.kwiatkowski@vacationplanner.pl            | Jacek     | Kwiatkowski-EMP         | EMPLOYEE      | test123 |
| wladyslaw.kargul@vacationplanner.pl             | Władysław | Kargul-EMP              | EMPLOYEE      | test123 |
| marian.pazdzioch@vacationplanner.pl             | Marian    | Paździoch-EMP           | EMPLOYEE      | test123 |
| grzegorz.brzeczyszczykiewicz@vacationplanner.pl | Grzegorz  | Brzęczyszczykiewicz-EMP | EMPLOYEE      | test123 |
| adas.miauczynski@vacationplanner.pl             | Adaś      | Miauczyński-EMP         | EMPLOYEE      | test123 |
| waldus.kiepski@vacationplanner.pl               | Walduś    | Kiepski-EMP             | EMPLOYEE      | test123 |
| siara.siarzewski@vacationplanner.pl             | Siara     | Siarzewski-EMP          | EMPLOYEE      | test123 |
| arnold.boczek@vacationplanner.pl                | Arnold    | Boczek-EMP              | EMPLOYEE      | test123 |
| jurek.kiler@vacationplanner.pl                  | Jurek     | Kiler-EMP               | EMPLOYEE      | test123 |

## Szybki start

### Opcja 1: API (Rekomendowana)

```bash
# 1. Uruchom serwer w jednym terminalu
npm run dev

# 2. W innym terminalu, uruchom seeding
./setup-seed-users.sh api
```

**Oczekiwany rezultat:**

```
======================================================
Seed Users with Password: test123
======================================================

Using API method
API Base: http://localhost:3000

[1/13] ✓ Admin User-ADM
[2/13] ✓ Ferdynand Kiepski-HR
...
[13/13] ✓ Jurek Kiler-EMP

======================================================
Created/Existing: 13/13

Login credentials for all users:
  Password: test123
```

### Opcja 2: SQL (szybsza, wymaga Supabase)

```bash
# 1. Upewnij się, że Supabase jest uruchomiony
supabase start

# 2. Uruchom seeding
./setup-seed-users.sh sql
```

## Uwagi dotyczące haseł

⚠️ **WAŻNE**: W produkcji nigdy nie przechowuj haseł w plain text!

- W Twojej aplikacji hasła są **haszowane** funkcją `crypt()` w PostgreSQL
- Hasła w seed.sql są tylko dla **development/testing**
- W produkcji użytkownicy powinni ustawiać hasła sami poprzez email confirmation link

## Troubleshooting

### Błąd: "Server not running at http://localhost:3000"

```bash
# Rozwiązanie: Uruchom serwer
npm run dev
```

### Błąd: "Forbidden: Administrator role required"

```bash
# Przyczyna: Użytkownik domyślny (DEFAULT_USER_ID) nie jest zalogowany
# Rozwiązanie: Upewnij się, że serwer jest uruchomiony z odpowiednim DEFAULT_USER_ID

# Sprawdź .env czy .env.local
grep DEFAULT_USER_ID .env* src/db/supabase.client.ts
```

### Błąd: "User with this email already exists"

```bash
# To nie jest błąd - użytkownik został już utworzony
# Skrypt pominął go i stworzył następnych

# Aby wyczyścić bazę:
npm run reset-db  # jeśli dostępne
# lub
./reset-db.sh     # jeśli dostępne
```

### Błąd: "Failed to create user profile"

Przyczyny:

1. Baza danych nie jest uruchomiona
2. RLS policies blokują insert
3. Brakujące zmienne środowiskowe Supabase

**Rozwiązanie:**

```bash
# Sprawdź logi serwera
npm run dev

# Sprawdź zmienne środowiskowe
echo $SUPABASE_URL
echo $SUPABASE_KEY
echo $SUPABASE_SERVICE_ROLE_KEY

# Upewnij się, że .env.local istnieje
ls -la .env*
```

## Logowanie testowych użytkowników

Po stworzeniu użytkowników możesz się zalogować jako dowolny z nich:

```
Email: admin.user@vacationplanner.pl
Hasło: test123
```

lub

```
Email: ferdynand.kiepski@vacationplanner.pl
Hasło: test123
```

itd.

## Wyczyść użytkowników

Aby wyczyścić istniejących użytkowników i zacząć od nowa:

### Via SQL

```sql
-- Zaloguj się w Supabase SQL Editor

-- 1. Usuń wszystkie profiles
DELETE FROM profiles;

-- 2. Usuń wszystkie auth.users
DELETE FROM auth.users;
```

### Via bash

```bash
./reset-db.sh  # jeśli dostępne
# lub
npm run reset-db
```

## API Reference

### POST /api/users

**Request:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "role": "EMPLOYEE"
}
```

**Response (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "role": "EMPLOYEE",
  "requiresPasswordReset": true,
  "createdAt": "2026-02-02T10:00:00Z"
}
```

**Error (400):**

```json
{
  "error": "User with this email already exists"
}
```

## Dodatkowe zasoby

- [seed.sql](./supabase/seed.sql) - Dane seed dla całej bazy
- [API Users Endpoint](./src/pages/api/users/index.ts) - Implementacja POST /api/users
- [Users Service](./src/lib/services/users.service.ts) - Business logic
