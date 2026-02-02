# Implementacja Rejestracji Użytkowników

## Podsumowanie

Zaimplementowano pełną funkcjonalność rejestracji użytkowników, wzorowaną na istniejącym systemie logowania i resetowania hasła. Nowa funkcjonalność umożliwia użytkownikom samodzielne tworzenie kont w systemie VacationPlanner.

## Utworzone pliki

### 1. Schema walidacji
**Plik:** `src/lib/schemas/auth-form.schema.ts`

Dodano nowy schemat walidacji formularza rejestracji:

```typescript
export const registerFormSchema = z
  .object({
    firstName: z
      .string({
        required_error: "Imię jest wymagane",
      })
      .min(2, "Imię musi mieć co najmniej 2 znaki")
      .max(50, "Imię może mieć maksymalnie 50 znaków"),

    lastName: z
      .string({
        required_error: "Nazwisko jest wymagane",
      })
      .min(2, "Nazwisko musi mieć co najmniej 2 znaki")
      .max(50, "Nazwisko może mieć maksymalnie 50 znaków"),

    email: z
      .string({
        required_error: "Adres e-mail jest wymagany",
      })
      .email("Nieprawidłowy format adresu e-mail"),

    password: z
      .string({
        required_error: "Hasło jest wymagane",
      })
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Hasło musi zawierać co najmniej jedną małą literę, jedną wielką literę i jedną cyfrę"
      ),

    confirmPassword: z.string({
      required_error: "Potwierdzenie hasła jest wymagane",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
```

**Cechy:**
- Walidacja imienia i nazwiska (min. 2, max. 50 znaków)
- Walidacja formatu e-mail
- Silna walidacja hasła (min. 8 znaków, mała/wielka litera, cyfra)
- Weryfikacja zgodności haseł

### 2. Komponent React - Formularz rejestracji
**Plik:** `src/components/forms/RegisterForm.tsx`

Komponent React obsługujący formularz rejestracji:

**Funkcjonalność:**
- Pola formularza: firstName, lastName, email, password, confirmPassword
- Walidacja po stronie klienta (react-hook-form + Zod)
- Dwustanowy interfejs:
  - Stan formularza (wprowadzanie danych)
  - Stan sukcesu (komunikat o wysłaniu e-maila)
- Wywołanie API: `POST /api/auth/register`
- Toast notifications dla komunikacji z użytkownikiem
- Link powrotny do strony logowania

**Przepływ użytkownika:**
1. Użytkownik wprowadza imię, nazwisko, email i hasło (2x)
2. Po walidacji następuje wywołanie API
3. W przypadku sukcesu wyświetlany jest komunikat o wysłaniu e-maila potwierdzającego
4. Użytkownik może wrócić do strony logowania

### 3. Strona Astro - Rejestracja
**Plik:** `src/pages/register.astro`

Publiczna strona dostępna pod `/register`:

**Cechy:**
- Layout bez nawigacji (podobnie jak `/login`)
- Automatyczne przekierowanie zalogowanych użytkowników na stronę główną
- Wyśrodkowany formularz z logo aplikacji
- Wyłączone prerenderowanie (`export const prerender = false`)

### 4. Endpoint API - Rejestracja
**Plik:** `src/pages/api/auth/register.ts`

Endpoint API obsługujący rejestrację użytkowników:

**Funkcjonalność:**
- Walidacja danych wejściowych (Zod) - firstName, lastName, email, password
- Tworzenie konta w Supabase Auth (`supabase.auth.signUp`)
- **Automatyczne tworzenie profilu w tabeli `profiles`** z rolą `EMPLOYEE`
- Automatyczne wysyłanie e-maila potwierdzającego
- Obsługa błędów:
  - Użytkownik już istnieje (409)
  - Nieprawidłowe dane (400)
  - Błędy serwera (500)
  - Błąd tworzenia profilu (500)

**Request:**
```json
POST /api/auth/register
{
  "firstName": "Jan",
  "lastName": "Kowalski",
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (sukces):**
```json
{
  "message": "Konto zostało utworzone. Sprawdź swoją skrzynkę e-mail, aby potwierdzić adres.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Jan",
    "lastName": "Kowalski"
  }
}
```

**Response (błąd - użytkownik istnieje):**
```json
{
  "error": "Użytkownik z tym adresem e-mail już istnieje"
}
```

**Response (błąd - tworzenie profilu):**
```json
{
  "error": "Nie udało się utworzyć profilu użytkownika. Skontaktuj się z administratorem."
}
```

## Zmiany w istniejących plikach

### LoginForm.tsx
Dodano link do strony rejestracji:

```tsx
<CardFooter className="flex flex-col space-y-2">
  <a href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary underline">
    Zapomniałeś hasła?
  </a>
  <a href="/register" className="text-sm text-muted-foreground hover:text-primary underline">
    Nie masz konta? Zarejestruj się
  </a>
</CardFooter>
```

## Przepływ użytkownika

### Rejestracja nowego użytkownika

```
/register → wprowadź email/hasło → POST /api/auth/register → sukces
                                                               ↓
                                        wyświetl komunikat o wysłanym mailu
                                                               ↓
                                        email z linkiem → /set-password?token=...
                                                               ↓
                                        ustaw hasło → POST /api/auth/set-password
                                                               ↓
                                        redirect → /login
```

### Ścieżki użytkownika

1. **Nowy użytkownik:**
   - Wchodzi na `/login`
   - Klika "Nie masz konta? Zarejestruj się"
   - Wypełnia formularz rejestracji
   - Otrzymuje e-mail potwierdzający
   - Klika link w e-mailu (przekierowanie do `/set-password`)
   - Ustawia hasło (opcjonalnie, jeśli już podał podczas rejestracji)
   - Loguje się na `/login`

2. **Ze strony głównej:**
   - Bezpośrednie wejście na `/register`
   - Wypełnia formularz
   - Dalszy przepływ jak wyżej

## Integracja z Supabase

### Automatyczne tworzenie profilu

Po utworzeniu użytkownika w `auth.users`, endpoint automatycznie tworzy odpowiadający mu rekord w tabeli `profiles`:

```typescript
// Create profile in profiles table
const { error: profileError } = await supabase.from("profiles").insert({
  id: data.user.id,              // UUID z auth.users
  first_name: firstName.trim(),
  last_name: lastName.trim(),
  email: email.toLowerCase(),
  role: "EMPLOYEE",               // Domyślna rola dla samorejestrajcych się użytkowników
});
```

**Struktura rekordu w `profiles`:**
- `id` - UUID użytkownika (identyczny z `auth.users.id`)
- `first_name` - Imię użytkownika
- `last_name` - Nazwisko użytkownika
- `email` - Adres e-mail (lowercase)
- `role` - Domyślnie `EMPLOYEE`
- `created_at` - Timestamp utworzenia (automatyczny)
- `updated_at` - Timestamp aktualizacji (automatyczny)
- `deleted_at` - NULL (soft-delete)

**Obsługa błędów:**
- Jeśli tworzenie profilu się nie powiedzie, użytkownik zostanie utworzony w `auth.users`, ale nie będzie mógł korzystać z systemu
- Błąd jest logowany do konsoli dla celów monitoringu
- Zwracany jest komunikat błędu informujący o konieczności kontaktu z administratorem

### Konfiguracja Supabase Auth

Funkcjonalność rejestracji wykorzystuje Supabase Auth z następującymi ustawieniami:

- **Email confirmation:** Włączone
- **Email templates:** Używa domyślnych szablonów Supabase
- **Redirect URL:** `{baseUrl}/set-password`

### Flow rejestracji w Supabase

1. `supabase.auth.signUp()` tworzy użytkownika w `auth.users`
2. **Endpoint tworzy odpowiadający profil w tabeli `profiles`** z danymi: firstName, lastName, email, role='EMPLOYEE'
3. Supabase automatycznie wysyła e-mail potwierdzający
4. E-mail zawiera link z tokenem do `/set-password`
5. Użytkownik klika link i potwierdza adres e-mail
6. Token weryfikacyjny potwierdza adres e-mail i aktywuje konto
7. Użytkownik może się zalogować

## Bezpieczeństwo

### Walidacja hasła
- Minimum 8 znaków
- Co najmniej jedna mała litera
- Co najmniej jedna wielka litera
- Co najmniej jedna cyfra

### Walidacja e-mail
- Format e-mail zgodny ze standardem RFC
- Weryfikacja unikalności w bazie danych

### Ochrona przed atakami
- Walidacja danych po stronie klienta i serwera
- Obsługa błędów bez ujawniania szczegółów implementacji
- Użycie Supabase Auth dla bezpiecznego zarządzania użytkownikami

## Testowanie

### Ręczne testy funkcjonalności

1. **Poprawna rejestracja:**
   ```
   Imię: Jan
   Nazwisko: Kowalski
   Email: testuser@example.com
   Password: TestPass123
   Confirm: TestPass123
   
   Oczekiwany rezultat: Komunikat o wysłaniu e-maila + utworzenie profilu w tabeli profiles
   ```

2. **Brak imienia lub nazwiska:**
   ```
   Imię: (puste)
   Nazwisko: Kowalski
   Email: testuser@example.com
   Password: TestPass123
   
   Oczekiwany rezultat: Błąd walidacji "Imię jest wymagane"
   ```

3. **Niezgodne hasła:**
   ```
   Imię: Jan
   Nazwisko: Kowalski
   Email: testuser@example.com
   Password: TestPass123
   Confirm: TestPass456
   
   Oczekiwany rezultat: Błąd walidacji "Hasła nie są identyczne"
   ```

4. **Słabe hasło:**
   ```
   Imię: Jan
   Nazwisko: Kowalski
   Email: testuser@example.com
   Password: test123
   
   Oczekiwany rezultat: Błąd walidacji dotyczący wymagań hasła
   ```

5. **Istniejący użytkownik:**
   ```
   Imię: Jan
   Nazwisko: Kowalski
   Email: existing@example.com
   Password: TestPass123
   
   Oczekiwany rezultat: Błąd "Użytkownik z tym adresem e-mail już istnieje"
   ```

6. **Nieprawidłowy format e-mail:**
   ```
   Imię: Jan
   Nazwisko: Kowalski
   Email: invalid-email
   Password: TestPass123
   
   Oczekiwany rezultat: Błąd walidacji formatu e-mail
   ```

## Powiązane pliki

### Istniejące pliki używane przez rejestrację:
- `src/db/supabase.client.ts` - Klient Supabase
- `src/components/ui/*` - Komponenty Shadcn/ui
- `src/layouts/Layout.astro` - Layout strony

### Powiązane endpointy:
- `POST /api/auth/login` - Logowanie
- `POST /api/auth/forgot-password` - Przypominanie hasła
- `POST /api/auth/set-password` - Ustawianie/resetowanie hasła
- `POST /api/auth/logout` - Wylogowanie

## Zgodność z architekturą projektu

Implementacja rejestracji jest w pełni zgodna z istniejącą architekturą:

✅ Użycie Astro dla stron statycznych
✅ Użycie React dla interaktywnych komponentów
✅ Walidacja z Zod
✅ Supabase dla backend
✅ Shadcn/ui dla komponentów UI
✅ Tailwind dla stylizacji
✅ TypeScript dla type safety
✅ Toast notifications (Sonner)
✅ Zgodność z wzorcem używanym w login/forgot-password

## Następne kroki (opcjonalne)

1. **Dodanie captcha** - Ochrona przed botami
2. **Rate limiting** - Ochrona przed spam
3. **Walidacja domenowa e-mail** - Tylko firmowe adresy e-mail
4. **Social login** - Google, Microsoft, etc.
5. **Two-factor authentication** - Dodatkowe zabezpieczenie
6. **Testowanie E2E** - Playwright tests dla przepływu rejestracji
7. **Testowanie jednostkowe** - Testy dla RegisterForm i API endpoint

## Podsumowanie

Funkcjonalność rejestracji została w pełni zaimplementowana zgodnie z wzorcem używanym w systemie logowania i resetowania hasła. System jest gotowy do użycia i obejmuje wszystkie kluczowe elementy:

- ✅ Walidacja danych (klient + serwer) - firstName, lastName, email, password
- ✅ Obsługa błędów
- ✅ Toast notifications
- ✅ Dwustanowy UI
- ✅ Integracja z Supabase Auth
- ✅ **Automatyczne tworzenie profilu w tabeli `profiles` z rolą EMPLOYEE**
- ✅ E-mail potwierdzający
- ✅ Zgodność z architekturą projektu
- ✅ Kompilacja bez błędów

### Kluczowe zmiany:

1. **Dodano pola firstName i lastName** do formularza rejestracji
2. **Automatyczne tworzenie profilu** w tabeli `profiles` po utworzeniu użytkownika w `auth.users`
3. **Domyślna rola EMPLOYEE** dla użytkowników rejestrujących się samodzielnie
4. **Pełna integracja** z istniejącym systemem uwierzytelniania

