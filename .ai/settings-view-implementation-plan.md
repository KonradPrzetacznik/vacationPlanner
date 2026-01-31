# Plan implementacji widoku Ustawienia

## 1. Przegląd
Widok "Ustawienia" przeznaczony jest dla administratorów i umożliwia konfigurację globalnych parametrów aplikacji. Celem jest zapewnienie centralnego miejsca do zarządzania kluczowymi aspektami działania systemu, takimi jak domyślna liczba dni urlopowych dla pracowników oraz próg obłożenia zespołu, który wpływa na proces akceptacji wniosków urlopowych.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką `/admin/settings`. Dostęp do tej ścieżki powinien być ograniczony wyłącznie do użytkowników z rolą "Administrator".

## 3. Struktura komponentów
Hierarchia komponentów dla widoku ustawień będzie prosta i skupiona na formularzu.

```
/src/pages/admin/settings.astro
└── /src/components/forms/SettingsForm.tsx (komponent kliencki)
    ├── /src/components/ui/Card.tsx
    ├── /src/components/ui/CardHeader.tsx
    ├── /src/components/ui/CardContent.tsx
    ├── /src/components/ui/CardFooter.tsx
    ├── /src/components/ui/Form.tsx
    ├── /src/components/ui/FormField.tsx
    ├── /src/components/ui/FormItem.tsx
    ├── /src/components/ui/FormLabel.tsx
    ├── /src/components/ui/FormControl.tsx
    ├── /src/components/ui/FormDescription.tsx
    ├── /src/components/ui/FormMessage.tsx
    ├── /src/components/ui/Input.tsx
    ├── /src/components/ui/Button.tsx
    └── /src/components/ui/Spinner.tsx (lub inny wskaźnik ładowania)
```

## 4. Szczegóły komponentów
### `SettingsForm.tsx`
- **Opis komponentu:** Reaktywny komponent kliencki, który renderuje formularz do edycji ustawień aplikacji. Odpowiada za pobranie aktualnych ustawień, zarządzanie stanem formularza, walidację wprowadzanych danych oraz wysłanie zmian na serwer.
- **Główne elementy:**
  - Komponent `Form` z biblioteki `shadcn/ui` opakowujący cały formularz.
  - Dwa pola `FormField` dla `default_vacation_days` i `team_occupancy_threshold`.
  - Każde pole będzie zawierać `FormLabel`, `FormControl` z `Input` oraz `FormDescription` i `FormMessage` do wyświetlania podpowiedzi i błędów walidacji.
  - Przycisk `Button` typu `submit` do zapisu zmian, który wyświetla wskaźnik ładowania w trakcie operacji zapisu.
- **Obsługiwane interakcje:**
  - Wprowadzanie wartości w polach liczbowych.
  - Kliknięcie przycisku "Zapisz", co uruchamia walidację i wysłanie danych do API.
- **Obsługiwana walidacja:**
  - `default_vacation_days`: Musi być liczbą całkowitą w zakresie od 1 do 365.
  - `team_occupancy_threshold`: Musi być liczbą całkowitą w zakresie od 0 do 100.
- **Typy:**
  - `SettingsViewModel`: ` { default_vacation_days: number; team_occupancy_threshold: number; }`
  - `SettingsDto`: ` { key: string; value: Json; }[]`
- **Propsy:**
  - `initialSettings: SettingsViewModel` - obiekt z początkowymi wartościami ustawień, pobranymi po stronie serwera w `settings.astro`.

## 5. Typy
Do implementacji widoku wymagane będą następujące typy:

- **`SettingsViewModel`** (nowy typ, specyficzny dla widoku):
  Jest to model widoku, który ułatwia zarządzanie stanem formularza na froncie. Transformuje tablicę obiektów `SettingsDto` w płaski obiekt.
  ```typescript
  interface SettingsViewModel {
    default_vacation_days: number;
    team_occupancy_threshold: number;
  }
  ```

- **`SettingsDto`** (istniejący typ):
  Typ używany do komunikacji z API. Reprezentuje pojedyncze ustawienie.
  ```typescript
  interface SettingsDto {
    key: string; // np. 'default_vacation_days'
    value: Json;   // Wartość ustawienia, np. 26
  }
  ```
  Do aktualizacji używana jest tablica `SettingsDto[]`.

## 6. Zarządzanie stanem
Zarządzanie stanem formularza zostanie zrealizowane przy użyciu biblioteki `react-hook-form` oraz `zod` do walidacji.

- **`useForm`**: Główny hook z `react-hook-form` do zarządzania polami, walidacją i stanem przesyłania formularza.
- **`zodResolver`**: Adapter do integracji schematu walidacji Zod z `react-hook-form`.
- **Schemat Zod**: Zdefiniowany zostanie schemat walidacji dla `SettingsViewModel`, który będzie odzwierciedlał wymagania API (`1-365` dla dni urlopowych, `0-100` dla progu obłożenia).
- **Stan ładowania/błędu**: Lokalny stan w komponencie `SettingsForm` (np. przy użyciu `useState`) będzie zarządzał flagami `isSubmitting` i `error`, aby kontrolować UI podczas komunikacji z API (np. blokować przycisk, pokazywać spinner, wyświetlać globalny błąd formularza).

Nie ma potrzeby tworzenia dedykowanego hooka (`useSettings`), ponieważ cała logika jest zamknięta w jednym komponencie formularza.

## 7. Integracja API
Integracja z API będzie dwuetapowa: pobranie danych w Astro i aktualizacja w React.

1.  **Pobranie danych (GET):**
    - W pliku strony `/src/pages/admin/settings.astro`.
    - Wykonane zostanie serwerowe wywołanie `fetch` do endpointu `/api/settings`.
    - Odpowiedź (typu `SettingsDto[]`) zostanie przetransformowana do `SettingsViewModel`.
    - `SettingsViewModel` zostanie przekazany jako `prop` do komponentu `SettingsForm`.

2.  **Aktualizacja danych (POST):**
    - W komponencie `SettingsForm.tsx`, w funkcji `onSubmit`.
    - Dane z formularza (typu `SettingsViewModel`) zostaną zwalidowane.
    - Po pomyślnej walidacji, dane zostaną zmapowane na format `SettingsDto[]`:
      ```javascript
      [
        { key: 'default_vacation_days', value: data.default_vacation_days },
        { key: 'team_occupancy_threshold', value: data.team_occupancy_threshold }
      ]
      ```
    - Wykonane zostanie wywołanie `fetch` metodą `POST` do endpointu `/api/settings` z powyższym ciałem żądania.
    - **Typ żądania:** `SettingsDto[]`
    - **Typ odpowiedzi (sukces):** `SettingsDto[]`
    - **Typ odpowiedzi (błąd):** `{ message: string }`

## 8. Interakcje użytkownika
- **Ładowanie widoku:** Użytkownik widzi formularz wypełniony aktualnie zapisanymi wartościami.
- **Edycja wartości:** Użytkownik może modyfikować wartości w polach input. Walidacja po stronie klienta jest uruchamiana na bieżąco (np. przy utracie fokusa) lub przy próbie zapisu.
- **Zapis zmian:**
  - Użytkownik klika przycisk "Zapisz".
  - Przycisk staje się nieaktywny, pojawia się na nim ikona ładowania.
  - Jeśli walidacja formularza nie powiedzie się, pod odpowiednimi polami wyświetlane są komunikaty o błędach.
  - Jeśli walidacja powiedzie się, dane są wysyłane do API.
  - Po otrzymaniu odpowiedzi z serwera, przycisk wraca do stanu aktywnego. Wyświetlany jest komunikat o sukcesie (np. toast) lub o błędzie.

## 9. Warunki i walidacja
- **`default_vacation_days`**:
  - **Warunek:** Wartość musi być liczbą całkowitą z przedziału `[1, 365]`.
  - **Komponent:** `SettingsForm.tsx` (pole `default_vacation_days`).
  - **Walidacja:** Zapewniona przez schemat Zod w `react-hook-form`.
  - **Stan interfejsu:** Jeśli warunek nie jest spełniony, pod polem pojawia się komunikat błędu (np. "Wartość musi być między 1 a 365"), a ramka pola może zmienić kolor na czerwony. Przesłanie formularza jest blokowane.

- **`team_occupancy_threshold`**:
  - **Warunek:** Wartość musi być liczbą całkowitą z przedziału `[0, 100]`.
  - **Komponent:** `SettingsForm.tsx` (pole `team_occupancy_threshold`).
  - **Walidacja:** Zapewniona przez schemat Zod w `react-hook-form`.
  - **Stan interfejsu:** Jeśli warunek nie jest spełniony, pod polem pojawia się komunikat błędu (np. "Wartość musi być między 0 a 100"). Przesłanie formularza jest blokowane.

## 10. Obsługa błędów
- **Błędy walidacji po stronie klienta:** Obsługiwane i wyświetlane przez `react-hook-form` pod odpowiednimi polami formularza.
- **Błędy sieciowe (np. brak połączenia):** Obsługiwane w bloku `catch` wywołania `fetch`. Użytkownik powinien zobaczyć ogólny komunikat o błędzie, np. w formie komponentu Toast lub pod formularzem, informujący o problemie z połączeniem.
- **Błędy serwera (np. status 500):** Podobnie jak błędy sieciowe, powinny skutkować wyświetleniem ogólnego komunikatu o błędzie.
- **Błędy walidacji po stronie serwera (np. status 400):** Chociaż walidacja klienta powinna im zapobiegać, na wypadek ich wystąpienia, komunikat błędu z API powinien zostać wyświetlony użytkownikowi.

## 11. Kroki implementacji
1.  **Utworzenie strony Astro:** Stworzyć plik `/src/pages/admin/settings.astro`.
2.  **Implementacja pobierania danych w Astro:** W części frontmatter strony `settings.astro` dodać logikę `fetch` do endpointu `/api/settings`, aby pobrać początkowe dane. Dodać transformację danych z `SettingsDto[]` na `SettingsViewModel`.
3.  **Struktura strony Astro:** W części template `settings.astro` dodać podstawowy layout (`Layout.astro`), nagłówek strony i wyrenderować komponent `SettingsForm`, przekazując mu pobrane dane jako `prop`.
4.  **Utworzenie schematu walidacji:** W nowym pliku (np. `/src/lib/schemas/settings.schema.ts`) zdefiniować schemat Zod dla `SettingsViewModel`.
5.  **Utworzenie komponentu formularza:** Stworzyć plik `/src/components/forms/SettingsForm.tsx`.
6.  **Implementacja logiki formularza:** W `SettingsForm.tsx` użyć `react-hook-form` z `zodResolver` i stworzonym schematem. Zaimplementować logikę `onSubmit`, która transformuje dane z powrotem do formatu `SettingsDto[]` i wysyła je do API metodą `POST`.
7.  **Budowa UI formularza:** Zbudować interfejs formularza przy użyciu komponentów `shadcn/ui` (`Form`, `FormField`, `Input`, `Button` itd.).
8.  **Obsługa stanu UI:** Dodać obsługę stanu ładowania (np. spinner na przycisku) oraz wyświetlanie komunikatów o błędach i sukcesie (np. za pomocą biblioteki `sonner`).
9.  **Zabezpieczenie trasy:** Upewnić się, że middleware w `/src/middleware/index.ts` poprawnie zabezpiecza trasę `/admin/settings`, dopuszczając tylko administratorów.
10. **Testowanie:** Przetestować ręcznie wszystkie interakcje, walidację oraz obsługę błędów.
