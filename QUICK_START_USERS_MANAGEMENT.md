# 🚀 Quick Start - Users Management View

## Szybkie Uruchomienie (3 kroki)

### 1️⃣ Uruchom Aplikację
```bash
cd /home/konrad/dev/vacationPlanner
npm run dev
```

### 2️⃣ Otwórz Widok
```
http://localhost:4321/admin/users
```

### 3️⃣ Przetestuj Podstawowe Funkcje

#### ✅ Dodaj Użytkownika
1. Kliknij **"Dodaj użytkownika"**
2. Wypełnij formularz:
   - Imię: `Jan`
   - Nazwisko: `Testowy`
   - Email: `jan.testowy@firma.pl`
   - Rola: `EMPLOYEE`
   - Hasło tymczasowe: `Test1234`
3. Kliknij **"Utwórz użytkownika"**
4. ✅ Sprawdź toast notification

#### ✅ Wyszukaj Użytkownika
1. Wpisz w pole wyszukiwania: `Jan`
2. Poczekaj 300ms (debounce)
3. ✅ Tabela się filtruje

#### ✅ Edytuj Użytkownika
1. Kliknij ikonę **ołówka** 🖊️
2. Zmień imię na: `Janusz`
3. Kliknij **"Zapisz zmiany"**
4. ✅ Sprawdź toast notification

#### ✅ Usuń Użytkownika
1. Kliknij ikonę **kosza** 🗑️
2. Przeczytaj ostrzeżenie
3. Kliknij **"Usuń użytkownika"**
4. ✅ Sprawdź toast z liczbą anulowanych urlopów

---

## 🧪 Uruchom Testy API

```bash
cd tests/api
./users-management-view.test.sh
```

Testy sprawdzają:
- ✅ GET /api/users - Lista użytkowników
- ✅ GET /api/users?role=ADMINISTRATOR - Filtrowanie
- ✅ GET /api/users/:id - Pojedynczy użytkownik
- ✅ POST /api/users - Tworzenie
- ✅ PATCH /api/users/:id - Aktualizacja
- ✅ DELETE /api/users/:id - Usuwanie

---

## 📋 Szybka Checklist Testowa

### Podstawowe
- [ ] Lista użytkowników się wyświetla
- [ ] Paginacja działa (Poprzednia/Następna)
- [ ] Wyszukiwanie działa z debounce
- [ ] Filtr roli działa
- [ ] Checkbox "Pokaż usuniętych" działa
- [ ] Przycisk "Wyczyść filtry" działa

### Dialogi
- [ ] Dialog "Dodaj użytkownika" otwiera się
- [ ] Walidacja formularza działa
- [ ] Dialog "Edytuj użytkownika" otwiera się z danymi
- [ ] Dialog "Usuń użytkownika" pokazuje ostrzeżenie

### Operacje
- [ ] Dodawanie użytkownika działa
- [ ] Edycja użytkownika działa
- [ ] Usuwanie użytkownika działa
- [ ] Toast notifications pojawiają się

### Bezpieczeństwo
- [ ] Nie można zmienić własnej roli
- [ ] Nie można usunąć samego siebie
- [ ] Email musi być unikalny
- [ ] Hasło musi mieć min 8 znaków

---

## 🆘 Najczęstsze Problemy

### Problem: Nie mogę wejść na /admin/users
**Rozwiązanie**: Sprawdź czy DEFAULT_USER_ID w `src/db/supabase.client.ts` to ID administratora:
```typescript
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";
```

### Problem: Lista użytkowników jest pusta
**Rozwiązanie**: 
1. Sprawdź czy Supabase działa
2. Uruchom seed: `cd supabase && supabase db reset`
3. Sprawdź konsole przeglądarki (F12)

### Problem: Nie mogę utworzyć użytkownika
**Przyczyna**: Email już istnieje lub hasło za krótkie  
**Rozwiązanie**: Użyj unikalnego emaila i hasła min 8 znaków

---

## 📖 Pełna Dokumentacja

Więcej informacji znajdziesz w:
- **docs/USERS_MANAGEMENT_VIEW.md** - Pełna dokumentacja techniczna
- **docs/USERS_MANAGEMENT_IMPLEMENTATION_SUMMARY.md** - Szczegółowe podsumowanie
- **docs/USERS_MANAGEMENT_ARCHITECTURE.txt** - Diagramy architektury

---

## ✅ Status: GOTOWE

**Wszystko działa?** Świetnie! 🎉

**Znalazłeś bug?** Sprawdź dokumentację lub zgłoś problem.

**Chcesz dodać funkcje?** Zobacz sekcję "Future Enhancements" w dokumentacji.

---

*Miłego testowania! 🚀*
