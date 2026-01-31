# Widok Ustawień (Settings View)

## Opis
Widok "Ustawienia" umożliwia administratorom i HR zarządzanie globalnymi parametrami aplikacji.

## Dostęp
- **URL:** `/admin/settings`
- **Uprawnienia:** ADMINISTRATOR, HR
- **Metoda dostępu:** Przez przeglądarkę internetową

## Funkcjonalności

### Edytowalne ustawienia

#### 1. Domyślna liczba dni urlopowych (default_vacation_days)
- **Opis:** Domyślna liczba dni urlopowych przyznawana nowym pracownikom
- **Zakres wartości:** 1-365
- **Typ:** Liczba całkowita
- **Domyślna wartość:** 26

#### 2. Próg obłożenia zespołu (team_occupancy_threshold)
- **Opis:** Maksymalny procent członków zespołu, którzy mogą być nieobecni jednocześnie
- **Zakres wartości:** 0-100
- **Typ:** Liczba całkowita (procent)
- **Domyślna wartość:** 75

## Walidacja

### Walidacja po stronie klienta
Formularz wykorzystuje `react-hook-form` z `zod` do walidacji:
- Wartości muszą być liczbami całkowitymi
- Wartości muszą mieścić się w określonym zakresie
- Błędy walidacji są wyświetlane pod odpowiednimi polami

### Walidacja po stronie serwera
Serwis `settings.service.ts` wykonuje dodatkową walidację:
- `default_vacation_days`: 1-365
- `team_occupancy_threshold`: 0-100
- Tylko użytkownicy z rolą HR lub ADMINISTRATOR mogą aktualizować ustawienia

## Integracja API

### Pobieranie ustawień (GET)
```bash
GET /api/settings
```

**Odpowiedź:**
```json
{
  "data": [
    {
      "key": "default_vacation_days",
      "value": 26,
      "description": "Default number of vacation days per year",
      "updatedAt": "2026-01-30T21:00:00Z"
    },
    {
      "key": "team_occupancy_threshold",
      "value": 75,
      "description": "Percentage threshold for team occupancy",
      "updatedAt": "2026-01-30T21:00:00Z"
    }
  ]
}
```

### Aktualizacja ustawień (POST)
```bash
POST /api/settings
Content-Type: application/json

[
  {"key": "default_vacation_days", "value": 28},
  {"key": "team_occupancy_threshold", "value": 80}
]
```

**Odpowiedź (sukces - 200):**
```json
{
  "data": [
    {
      "key": "default_vacation_days",
      "value": 28,
      "description": "Default number of vacation days per year",
      "updatedAt": "2026-01-30T22:00:00Z"
    },
    {
      "key": "team_occupancy_threshold",
      "value": 80,
      "description": "Percentage threshold for team occupancy",
      "updatedAt": "2026-01-30T22:00:00Z"
    }
  ]
}
```

**Odpowiedź (błąd walidacji - 400):**
```json
{
  "error": "Invalid value for team_occupancy_threshold: must be between 0 and 100"
}
```

**Odpowiedź (brak uprawnień - 403):**
```json
{
  "error": "Unauthorized"
}
```

## Struktura plików

```
src/
├── pages/
│   └── admin/
│       └── settings.astro              # Strona ustawień
├── components/
│   └── forms/
│       └── SettingsForm.tsx            # Komponent formularza React
├── lib/
│   ├── schemas/
│   │   └── settings-form.schema.ts     # Schemat walidacji Zod
│   └── services/
│       └── settings.service.ts         # Logika biznesowa
└── pages/
    └── api/
        └── settings/
            └── index.ts                 # GET i POST endpointy
```

## Komponenty UI
Widok wykorzystuje następujące komponenty z `shadcn/ui`:
- `Card` - kontener formularza
- `Form` - wrapper formularza z react-hook-form
- `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage` - elementy pól formularza
- `Input` - pole tekstowe
- `Button` - przycisk zapisu
- `Toaster` - powiadomienia toast (sonner)

## Interakcje użytkownika

### 1. Ładowanie widoku
- System pobiera aktualne wartości ustawień z API
- Formularz jest wypełniany pobranymi wartościami
- W przypadku błędu wyświetlany jest komunikat błędu

### 2. Edycja wartości
- Użytkownik może modyfikować wartości w polach numerycznych
- Walidacja jest uruchamiana na bieżąco (przy utracie fokusa pola)
- Błędy walidacji są wyświetlane pod odpowiednimi polami

### 3. Zapisywanie zmian
1. Użytkownik klika przycisk "Zapisz ustawienia"
2. Przycisk zostaje zablokowany, tekst zmienia się na "Zapisywanie..."
3. Walidacja formularza:
   - ✅ Sukces → dane są wysyłane do API
   - ❌ Błąd → komunikaty błędów pod polami, przycisk odblokowywany
4. Odpowiedź z API:
   - ✅ Sukces (200) → toast z sukcesem, formularz zaktualizowany
   - ❌ Błąd (400/403/404/500) → toast z komunikatem błędu
5. Przycisk zostaje odblokowany

## Obsługa błędów

### Błędy walidacji klienta
- Wyświetlane pod odpowiednimi polami formularza
- Czerwona ramka wokół pola z błędem
- Formularz nie może być wysłany

### Błędy sieciowe
- Toast z komunikatem "Wystąpił błąd podczas zapisywania ustawień"
- Błąd jest logowany w konsoli przeglądarki

### Błędy serwera
- Toast z komunikatem błędu z API (jeśli dostępny)
- Różne kody statusu:
  - **400:** Błąd walidacji
  - **403:** Brak uprawnień
  - **404:** Ustawienie nie znalezione
  - **500:** Błąd serwera

## Testowanie

### Testy manualne
Otwórz widok w przeglądarce: `http://localhost:3000/admin/settings`

### Testy API
```bash
# Uruchom test bulk update
cd tests/api
./settings-bulk-update.test.sh
```

### Scenariusze testowe
1. ✅ Edycja obu wartości z poprawnymi danymi
2. ✅ Wartość > maksymalna (powinna zostać odrzucona)
3. ✅ Wartość < minimalna (powinna zostać odrzucona)
4. ✅ Wartość nienumeryczna (powinna zostać odrzucona)
5. ✅ Brakujące pole (powinno zostać odrzucone)
6. ✅ Nieistniejący klucz ustawienia (powinien zostać odrzucony)

## Bezpieczeństwo

### Autoryzacja
- Tylko użytkownicy z rolą **ADMINISTRATOR** lub **HR** mogą aktualizować ustawienia
- Weryfikacja roli odbywa się w serwisie `settings.service.ts`
- Nieautoryzowane żądania zwracają status 403

### Walidacja danych
- Dwupoziomowa walidacja: klient + serwer
- Zabezpieczenie przed SQL injection (używamy Supabase ORM)
- Zabezpieczenie przed nieprawidłowymi wartościami

## Przyszłe usprawnienia
- [ ] Dodanie middleware do zabezpieczenia trasy `/admin/settings`
- [ ] Dodanie historii zmian ustawień (audit log)
- [ ] Dodanie możliwości przywracania poprzednich wartości
- [ ] Dodanie więcej ustawień globalnych
- [ ] Dodanie grup ustawień (sekcje w UI)
