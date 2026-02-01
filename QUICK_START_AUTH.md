# Quick Start - Autentykacja Supabase

## 🚀 Szybkie Uruchomienie (5 minut)

### 1. Zainstaluj zależności (jeśli jeszcze nie zrobiono)
```bash
npm install
```

### 2. Zresetuj lokalną bazę danych
```bash
npx supabase db reset
```

### 3. Skonfiguruj zmienne środowiskowe
Upewnij się, że masz plik `.env` z:
```env
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=[twój-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[twój-service-role-key]
```

💡 Klucze znajdziesz po uruchomieniu `npx supabase start` w outputcie.

### 4. Uruchom serwer deweloperski
```bash
npm run dev
```

### 5. Otwórz aplikację
```
http://localhost:3000/login
```

## 📧 Testowe Konta (z seed.sql)

### Administrator
- **Email:** `admin.user@vacationplanner.pl`
- **Hasło:** `test123`
- **Rola:** ADMINISTRATOR

### HR
- **Email:** `ferdynand.kiepski@vacationplanner.pl`
- **Hasło:** `test123`
- **Rola:** HR

### Employee
- **Email:** `kazimierz.pawlak@vacationplanner.pl`
- **Hasło:** `test123`
- **Rola:** EMPLOYEE

## 🧪 Testowanie Flow

### Test 1: Logowanie
1. Otwórz `http://localhost:3000/login`
2. Zaloguj się jako admin (dane powyżej)
3. Sprawdź czy jesteś przekierowany na `/`
4. Sprawdź czy w nawigacji widzisz email i przycisk "Wyloguj się"

### Test 2: Tworzenie użytkownika
1. Zaloguj się jako administrator
2. Przejdź do `/admin/users`
3. Kliknij "Add User"
4. Wprowadź dane:
   - First Name: `Jan`
   - Last Name: `Testowy`
   - Email: `jan.testowy@example.com`
   - Role: `EMPLOYEE`
5. Kliknij "Create"
6. Otwórz Inbucket: `http://localhost:54324`
7. Znajdź email z zaproszeniem
8. Kliknij link w emailu
9. Ustaw hasło (min 8 znaków, duża litera, mała litera, cyfra)
10. Zaloguj się nowym kontem

### Test 3: Reset hasła
1. Na stronie `/login` kliknij "Zapomniałeś hasła?"
2. Wprowadź email: `admin.user@vacationplanner.pl`
3. Kliknij "Wyślij link resetujący"
4. Otwórz Inbucket: `http://localhost:54324`
5. Znajdź email z resetem hasła
6. Kliknij link
7. Ustaw nowe hasło
8. Zaloguj się nowym hasłem

### Test 4: Wylogowanie
1. Będąc zalogowanym, kliknij "Wyloguj się"
2. Sprawdź czy jesteś przekierowany na `/login`
3. Spróbuj wejść na `/calendar` - powinieneś być przekierowany na `/login`

## 🔍 Debugowanie

### Problem: Nie mogę się zalogować
```bash
# Sprawdź logi Supabase Auth
npx supabase logs auth
```

### Problem: Email nie został wysłany
```bash
# Sprawdź Inbucket
open http://localhost:54324
```

### Problem: Token expired
Tokeny mają ograniczony czas życia:
- **Invite token:** 24 godziny
- **Recovery token:** 1 godzina

Poproś o nowy link.

### Problem: Błąd 401 Unauthorized
1. Wyloguj się i zaloguj ponownie
2. Sprawdź czy cookie są poprawnie ustawione (DevTools → Application → Cookies)
3. Sprawdź logi middleware: `console.log` w `src/middleware/index.ts`

## 📚 Więcej Informacji

- **Pełna dokumentacja:** `AUTH_INTEGRATION_COMPLETE.md`
- **Konfiguracja Supabase:** `SUPABASE_AUTH_CONFIGURATION.md`
- **Architektura:** `.ai/auth-spec.md`

## ✅ Checklist - Czy wszystko działa?

- [ ] Mogę się zalogować jako admin
- [ ] Mogę się wylogować
- [ ] Widzę email w nawigacji gdy jestem zalogowany
- [ ] Mogę utworzyć nowego użytkownika
- [ ] Nowy użytkownik otrzymuje email (w Inbucket)
- [ ] Mogę ustawić hasło z linku w emailu
- [ ] Mogę zresetować hasło
- [ ] Chronione strony przekierowują na `/login` gdy nie jestem zalogowany
- [ ] Zalogowani użytkownicy nie mogą wejść na `/login`

## 🎉 Gotowe!

Jeśli wszystkie testy przeszły pomyślnie, integracja autentykacji działa poprawnie!

## 🆘 Potrzebujesz pomocy?

1. Sprawdź `AUTH_INTEGRATION_COMPLETE.md` - sekcja "Znane problemy"
2. Sprawdź logi: `npx supabase logs`
3. Sprawdź DevTools → Console w przeglądarce
4. Sprawdź Network tab dla błędów API
