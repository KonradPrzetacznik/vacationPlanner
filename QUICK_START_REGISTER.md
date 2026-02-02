# Quick Start - Rejestracja Użytkowników

## Dostęp do funkcjonalności

### Dla użytkowników

1. **Strona rejestracji:** `http://localhost:4321/register`
2. **Alternatywnie:** Ze strony logowania (`/login`) kliknij "Nie masz konta? Zarejestruj się"

## Proces rejestracji

### Krok 1: Wypełnij formularz
```
Imię: Jan
Nazwisko: Kowalski
Email: your-email@example.com
Hasło: YourPassword123
Potwierdź hasło: YourPassword123
```

**Wymagania dotyczące hasła:**
- Minimum 8 znaków
- Co najmniej jedna mała litera (a-z)
- Co najmniej jedna wielka litera (A-Z)
- Co najmniej jedna cyfra (0-9)

### Krok 2: Sprawdź e-mail
Po pomyślnej rejestracji otrzymasz e-mail z linkiem potwierdzającym.

### Krok 3: Kliknij link w e-mailu
Link przekieruje Cię na stronę `/set-password` gdzie możesz:
- Potwierdzić swoje konto
- (Opcjonalnie) Ustawić nowe hasło

### Krok 4: Zaloguj się
Po potwierdzeniu adresu e-mail możesz zalogować się do systemu.

## API Endpoint

### POST /api/auth/register

**Request:**
```json
{
  "firstName": "Jan",
  "lastName": "Kowalski",
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (201 Created):**
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

**Response (409 Conflict - użytkownik istnieje):**
```json
{
  "error": "Użytkownik z tym adresem e-mail już istnieje"
}
```

**Response (400 Bad Request - walidacja):**
```json
{
  "error": "Hasło musi mieć co najmniej 8 znaków"
}
```

## Struktura plików

```
src/
├── components/
│   └── forms/
│       └── RegisterForm.tsx          # Formularz rejestracji
├── lib/
│   └── schemas/
│       └── auth-form.schema.ts       # Schema z registerFormSchema
├── pages/
│   ├── register.astro                # Strona rejestracji
│   └── api/
│       └── auth/
│           └── register.ts           # API endpoint
```

## Testowanie lokalne

### 1. Uruchom aplikację
```bash
npm run dev
```

### 2. Przejdź do strony rejestracji
```
http://localhost:4321/register
```

### 3. Wypełnij formularz testowy
```
Imię: Jan
Nazwisko: Kowalski
Email: test@example.com
Password: TestPass123
Confirm: TestPass123
```

### 4. Sprawdź konsol Supabase
W konsoli Supabase możesz zobaczyć:
- Nowego użytkownika w tabeli `auth.users`
- Status potwierdzenia e-mail
- Wysłane e-maile (w zakładce Auth > Users)

## Rozwiązywanie problemów

### Problem: "Użytkownik już istnieje"
**Rozwiązanie:** E-mail jest już zarejestrowany. Spróbuj innego adresu lub użyj funkcji "Zapomniałeś hasła?"

### Problem: Nie otrzymuję e-maila potwierdzającego
**Możliwe przyczyny:**
1. E-mail trafił do spamu
2. Konfiguracja SMTP w Supabase
3. Email confirmation wyłączone w ustawieniach Supabase Auth

**Rozwiązanie:**
1. Sprawdź folder spam
2. Sprawdź konfigurację Supabase Auth (Dashboard > Authentication > Settings)
3. Sprawdź Email Templates w Supabase

### Problem: Błąd walidacji hasła
**Rozwiązanie:** Upewnij się, że hasło spełnia wszystkie wymagania:
- ✅ Min. 8 znaków
- ✅ Mała litera (a-z)
- ✅ Wielka litera (A-Z)
- ✅ Cyfra (0-9)

## Powiązane funkcje

- **Logowanie:** `/login`
- **Zapomniałem hasła:** `/forgot-password`
- **Ustawienie hasła:** `/set-password`

## Dla developerów

### Dodanie nowych pól do formularza

1. Zaktualizuj schema w `auth-form.schema.ts`:
```typescript
export const registerFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
  firstName: z.string().min(2),  // Nowe pole
  lastName: z.string().min(2),   // Nowe pole
})
```

2. Dodaj pola w `RegisterForm.tsx`:
```tsx
<FormField
  control={form.control}
  name="firstName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Imię</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
    </FormItem>
  )}
/>
```

3. Zaktualizuj API endpoint w `register.ts`:
```typescript
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});
```

### Customizacja e-maila potwierdzającego

E-maile są konfigurowane w Supabase Dashboard:
1. Przejdź do Authentication > Email Templates
2. Edytuj szablon "Confirm signup"
3. Dostosuj treść i styl do swoich potrzeb

## Bezpieczeństwo

### Najlepsze praktyki
- ✅ Hasła nie są wysyłane w plain text
- ✅ Walidacja po stronie klienta i serwera
- ✅ Użycie Supabase Auth (bezpieczne haszowanie haseł)
- ✅ E-mail confirmation przed aktywacją konta
- ✅ Ochrona przed duplikatami e-mail

### Zalecenia produkcyjne
- [ ] Dodaj rate limiting (np. max 5 rejestracji na IP na godzinę)
- [ ] Dodaj CAPTCHA dla ochrony przed botami
- [ ] Ogranicz domeny e-mail (tylko firmowe adresy)
- [ ] Monitoruj próby rejestracji w logach
- [ ] Ustaw silniejsze wymagania hasła dla środowiska produkcyjnego

## Dalsze rozszerzenia

1. **Social Login** - Google, Microsoft, GitHub
2. **Email verification** - Dodatkowa weryfikacja przed rejestracją
3. **Approval flow** - Admin musi zatwierdzić nowe konto
4. **Invite-only** - Rejestracja tylko z kodem zaproszenia
5. **Terms & Conditions** - Zgoda na regulamin
6. **GDPR compliance** - Checkbox zgody na przetwarzanie danych

## Pomoc

W razie problemów sprawdź:
- Dokumentację Supabase Auth: https://supabase.com/docs/guides/auth
- Logi w konsoli przeglądarki (DevTools)
- Logi w terminalu serwera deweloperskiego
- Dokumentację pełną: `/docs/REGISTER_IMPLEMENTATION.md`
