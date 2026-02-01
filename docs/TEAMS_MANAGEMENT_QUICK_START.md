# Quick Start: Widok Zarządzania Zespołami

## 🚀 Jak uruchomić

1. **Upewnij się, że serwer działa:**

   ```bash
   npm run dev
   ```

2. **Otwórz przeglądarkę:**

   ```
   http://localhost:3002/teams
   ```

3. **Nawiguj do widoku zespołów:**
   - Kliknij "Zespoły" w nawigacji górnej
   - Lub wejdź bezpośrednio na `/teams`

## 📋 Podstawowe operacje

### Utworzenie zespołu

1. Kliknij przycisk **"Utwórz zespół"** (prawy górny róg)
2. Wpisz nazwę zespołu (min. 3 znaki)
3. Kliknij **"Utwórz zespół"**
4. Zespół pojawi się na liście po lewej stronie

### Edycja zespołu

1. Kliknij na zespół w liście po lewej
2. W sekcji "Informacje o zespole" zmień nazwę
3. Kliknij **"Zapisz zmiany"**

### Usunięcie zespołu

1. Kliknij na zespół w liście
2. Kliknij **"Usuń zespół"** (czerwony przycisk)
3. Potwierdź w dialogu

### Dodanie członków do zespołu

1. Wybierz zespół z listy
2. W sekcji "Członkowie zespołu" kliknij **"Dodaj członka"**
3. Wyszukaj użytkowników po imieniu/emailu
4. Zaznacz checkboxy przy użytkownikach
5. Kliknij **"Dodaj (X)"** gdzie X to liczba wybranych

### Usunięcie członka z zespołu

1. Wybierz zespół z listy
2. Przy członku kliknij ikonę kosza
3. Potwierdź w dialogu

## 🎯 Szybkie scenariusze

### Scenariusz 1: Tworzenie zespołu od zera

```
Utwórz zespół → Dodaj członków → Gotowe!
```

### Scenariusz 2: Reorganizacja zespołu

```
Wybierz zespół → Usuń niektórych członków → Dodaj nowych → Zmień nazwę
```

### Scenariusz 3: Likwidacja zespołu

```
Wybierz zespół → Usuń zespół → Potwierdź
```

## 💡 Wskazówki

- **Wyszukiwanie jest szybkie**: Użyj search w modalu dodawania członków
- **Multi-select**: Możesz dodać wielu członków na raz
- **Licznik**: Widok pokazuje liczbę członków przy każdym zespole
- **Historia**: Data dołączenia jest zapisywana dla każdego członka
- **Walidacja**: Nazwa zespołu musi mieć min. 3 znaki
- **Użytkownicy usunięci**: Nie są pokazywani na liście przy dodawaniu do zespołu
- **Członkowie zespołu**: Użytkownicy już będący w zespole nie są pokazywani w liście dodawania

## ⚠️ Uwagi

- Usunięcie zespołu jest **nieodwracalne**
- Usunięcie zespołu **usuwa wszystkich członków** z tego zespołu
- Członkowie nie są usuwani z systemu, tylko z zespołu
- **Tylko HR i ADMINISTRATOR** mają dostęp do tego widoku

## 🐛 Troubleshooting

### Problem: "Nie udało się pobrać listy zespołów"

- Sprawdź czy serwer działa
- Sprawdź konsolę przeglądarki (F12)
- Sprawdź logi serwera

### Problem: "Nie mogę dodać członków"

- Upewnij się, że wybrałeś przynajmniej jednego użytkownika
- Sprawdź czy użytkownik nie jest już w zespole

### Problem: "Insufficient permissions"

- Upewnij się, że jesteś zalogowany jako HR lub ADMINISTRATOR
- Odśwież stronę (może być problem z sesją)

## 📞 Potrzebujesz pomocy?

Sprawdź pełną dokumentację:

- [Szczegółowa dokumentacja widoku](./TEAMS_MANAGEMENT_VIEW.md)
- [Podsumowanie implementacji](./TEAMS_MANAGEMENT_IMPLEMENTATION_SUMMARY.md)
