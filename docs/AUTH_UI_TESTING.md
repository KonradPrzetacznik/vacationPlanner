# Testowanie UI Uwierzytelniania

## Uruchomienie aplikacji

```bash
npm run dev
```

Aplikacja będzie dostępna na `http://localhost:3000` (lub innym porcie, jeśli 3000 jest zajęty).

## Dostępne strony

### 1. Strona logowania
**URL:** `http://localhost:3000/login`

**Pola formularza:**
- Email (wymagane, walidacja formatu)
- Hasło (wymagane)

**Funkcjonalność:**
- Walidacja po stronie klienta (Zod)
- Komunikaty błędów pod polami
- Link do strony "Zapomniałeś hasła?"
- Przycisk submit z disabled state podczas ładowania
- Toast notification po błędzie/sukcesie

**Testowanie:**
- Wprowadź nieprawidłowy email → powinien pokazać błąd walidacji
- Pozostaw puste pole → powinien pokazać błąd "wymagane"
- Wypełnij formularz → kliknij "Zaloguj się" → wywołuje API (obecnie zwróci błąd, bo backend nie jest zaimplementowany)

### 2. Strona odzyskiwania hasła
**URL:** `http://localhost:3000/forgot-password`

**Pola formularza:**
- Email (wymagane, walidacja formatu)

**Funkcjonalność:**
- Po wysłaniu formularza pokazuje ekran sukcesu
- Link powrotu do strony logowania
- Toast notification

**Testowanie:**
- Wprowadź nieprawidłowy email → błąd walidacji
- Wypełnij poprawnie → formularz zmienia się w komunikat sukcesu

### 3. Strona ustawiania hasła
**URL:** `http://localhost:3000/set-password?token=test123`

**Pola formularza:**
- Nowe hasło (minimum 8 znaków, mała litera, wielka litera, cyfra)
- Potwierdź hasło (musi być identyczne)

**Funkcjonalność:**
- Walidacja siły hasła
- Porównanie dwóch pól hasła
- Obsługa braku tokenu w URL
- Toast notification po sukcesie + przekierowanie

**Testowanie:**
1. Bez tokenu: `http://localhost:3000/set-password`
   - Powinien pokazać komunikat o błędzie i przyciski nawigacji

2. Z tokenem: `http://localhost:3000/set-password?token=abc123`
   - Wprowadź słabe hasło (np. "test") → błąd walidacji
   - Wprowadź hasło bez wielkiej litery → błąd walidacji
   - Wprowadź różne hasła w obu polach → błąd "Hasła nie są identyczne"
   - Wprowadź poprawne hasła → kliknij "Ustaw hasło" → wywołuje API

## Wizualna weryfikacja

### Layout
- ✅ Wszystkie strony mają wyśrodkowany formularz
- ✅ Logo "VacationPlanner" i subtitle na górze
- ✅ Formularz w karcie (Card z shadcn/ui)
- ✅ Tło z `bg-muted/50`
- ✅ Responsywność (`max-w-md`, `p-4`)

### Komponenty UI
- ✅ Inputy z labelem i opisem błędu
- ✅ Przyciski z odpowiednimi stanami (disabled, loading text)
- ✅ Linki z hover effect
- ✅ Toast notifications (Sonner)

### Accessibility
- ✅ Autocomplete dla pól (email, password)
- ✅ Type="email" dla pól email
- ✅ Type="password" dla pól hasła
- ✅ Labels połączone z inputami
- ✅ Komunikaty błędów z aria-live

## Sprawdzanie w przeglądarce

### DevTools Console
Sprawdź konsolę - nie powinno być błędów JavaScript/React.

### Network Tab
1. Wypełnij formularz i wyślij
2. Sprawdź Network tab - powinien być request do `/api/auth/...`
3. Obecnie zwróci błąd 404 (API nie zaimplementowane)

### React DevTools
Jeśli masz React DevTools:
- Sprawdź komponenty: LoginForm, ForgotPasswordForm, SetPasswordForm
- Zweryfikuj props i state
- Sprawdź, czy formularz używa react-hook-form

## Następne kroki (Backend)

Po weryfikacji UI, należy zaimplementować:

1. **API Endpoints:**
   - `POST /api/auth/login`
   - `POST /api/auth/forgot-password`
   - `POST /api/auth/set-password`
   - `POST /api/auth/logout`

2. **Middleware:**
   - Sprawdzanie sesji użytkownika
   - Przekierowania dla niezalogowanych użytkowników
   - Ustawienie `context.locals.user`

3. **Supabase Auth:**
   - Konfiguracja klienta
   - Integracja z auth endpoints
   - Email templates

## Zgłaszanie problemów

Jeśli znajdziesz problemy:
- Sprawdź console w przeglądarce
- Sprawdź output terminala (npm run dev)
- Zweryfikuj, czy wszystkie zależności są zainstalowane
- Sprawdź, czy port nie jest zajęty

## Zrzuty ekranu (TODO)

Zalecane jest dodanie zrzutów ekranu wszystkich trzech stron do dokumentacji.
