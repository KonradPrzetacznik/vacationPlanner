# Unit Tests - Vacation Planner

## Przegląd

Testy jednostkowe (`/tests/unit`) testują logikę biznesową warstwy serwisu w izolacji od API endpoints. Te testy zostały przetworzone z testów API bash (`/tests/api`) na zaawansowane unit testy TypeScript z Vitest.

## Struktura

```
tests/unit/
├── settings.service.test.ts                    # Settings service (getAllSettings, getSettingByKey, updateSetting)
├── users.service.test.ts                       # Users service (getUsers, getUserById, createUser, updateUser, deleteUser)
├── teams.service.test.ts                       # Teams service (getTeams, getTeamById, createTeam, updateTeam, deleteTeam, addMembers, removeMember, getCalendar)
├── vacation-requests.service.test.ts           # Vacation requests service (getVacationRequests, getVacationRequestById, createVacationRequest, approveVacationRequest, rejectVacationRequest, cancelVacationRequest)
├── vacation-allowances.service.test.ts         # Vacation allowances service (getVacationAllowances, getVacationAllowanceByYear, createVacationAllowance, updateVacationAllowance)
├── example.test.ts                             # Example test template
├── setup.ts                                    # Vitest environment setup
├── UNIT_TESTS_DOCUMENTATION.md                 # Detailed testing guidelines
├── mocks/
│   ├── supabase.mock.ts                        # Mock factory dla Supabase clients
│   ├── users.mock.ts                           # Mock data dla użytkowników
│   ├── teams.mock.ts                           # Mock data dla zespołów
│   ├── vacation-requests.mock.ts               # Mock data dla żądań urlopowych
│   ├── vacation-allowances.mock.ts             # Mock data dla zasiłków
│   └── settings.mock.ts                        # Mock data dla ustawień
└── README.md                                   # Ten plik
```

## Mapowanie z testów API

| Test API                           | Unit Test                           | Funkcje                   |
| ---------------------------------- | ----------------------------------- | ------------------------- |
| users-list.test.sh                 | users.service.test.ts               | getUsers()                |
| user-by-id.test.sh                 | users.service.test.ts               | getUserById()             |
| users-create.test.sh               | users.service.test.ts               | createUser()              |
| users-update.test.sh               | users.service.test.ts               | updateUser()              |
| users-delete.test.sh               | users.service.test.ts               | deleteUser()              |
| teams-list.test.sh                 | teams.service.test.ts               | getTeams()                |
| teams-by-id.test.sh                | teams.service.test.ts               | getTeamById()             |
| teams-create.test.sh               | teams.service.test.ts               | createTeam()              |
| teams-update.test.sh               | teams.service.test.ts               | updateTeam()              |
| teams-delete.test.sh               | teams.service.test.ts               | deleteTeam()              |
| team-members-add.test.sh           | teams.service.test.ts               | addMembers()              |
| team-members-remove.test.sh        | teams.service.test.ts               | removeMember()            |
| team-calendar.test.sh              | teams.service.test.ts               | getCalendar()             |
| settings-list.test.sh              | settings.service.test.ts            | getAllSettings()          |
| settings-by-key.test.sh            | settings.service.test.ts            | getSettingByKey()         |
| settings-update.test.sh            | settings.service.test.ts            | updateSetting()           |
| vacation-request-create.test.sh    | vacation-requests.service.test.ts   | createVacationRequest()   |
| vacation-requests-list.test.sh     | vacation-requests.service.test.ts   | getVacationRequests()     |
| vacation-request-by-id.test.sh     | vacation-requests.service.test.ts   | getVacationRequestById()  |
| vacation-request-approve.test.sh   | vacation-requests.service.test.ts   | approveVacationRequest()  |
| vacation-request-reject.test.sh    | vacation-requests.service.test.ts   | rejectVacationRequest()   |
| vacation-request-cancel.test.sh    | vacation-requests.service.test.ts   | cancelVacationRequest()   |
| vacation-allowances.test.sh        | vacation-allowances.service.test.ts | getVacationAllowances()   |
| vacation-allowances-create.test.sh | vacation-allowances.service.test.ts | createVacationAllowance() |
| vacation-allowances-update.test.sh | vacation-allowances.service.test.ts | updateVacationAllowance() |

## Mocki

Unit testy używają zaawansowanego systemu mocków:

### Supabase Mock Factory (`mocks/supabase.mock.ts`)

- `createMockSupabaseClient()` - główna factory
- `setupRpcCall()` - konfiguracja RPC calls
- `setupSelectQuery()` - konfiguracja select queries
- `setupFailedQuery()` - konfiguracja błędnych responses

### Mock Data

Każdy serwis ma plik mocków z realistycznymi danymi:

- **users.mock.ts**: admin, hr, employee1, employee2, deletedEmployee
- **teams.mock.ts**: engineering, product, sales, deletedTeam
- **vacation-requests.mock.ts**: submitted, approved, rejected, cancelled
- **vacation-allowances.mock.ts**: employee1, employee2, newEmployee
- **settings.mock.ts**: defaultVacationDays, teamOccupancyThreshold, minRequestAdvanceNotice

## Uruchamianie Testów

```bash
# Uruchom wszystkie unit testy
npm run test:unit

# Uruchom testy dla konkretnego serwisu
npm run test:unit -- users.service.test.ts

# Uruchom testy w watch mode
npm run test:unit -- --watch

# Wygeneruj raport pokrycia
npm run test:unit -- --coverage
```

## RBAC (Role-Based Access Control) w testach

Testy weryfikują autoryzację dla trzech ról:

- **ADMINISTRATOR**: Pełny dostęp do wszystkich operacji
- **HR**: Dostęp do zarządzania danymi pracowników i zatwierdzania urlopów
- **EMPLOYEE**: Dostęp tylko do własnych danych

Każdy test zawiera scenariusze testujące:

1. ✅ Operacja dozwolona dla roli z uprawnieniami
2. ❌ Błąd dostępu dla roli bez uprawnień
3. ✅ Weryfikacja danych zwracanych (nie ujawniaj prywatnych danych)

## Pokrycie kodu

Testy są napisane aby osiągnąć wysokie pokrycie:

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

Sprawdzenie aktualnego pokrycia:

```bash
npm run test:unit -- --coverage
```

## Best Practices w testach

### 1. Arrange-Act-Assert Pattern

```typescript
it("should test feature", async () => {
  // Arrange - przygotuj dane i mocki
  const mockData = { ... };

  // Act - wykonaj testowaną funkcję
  const result = await serviceFunction(mockData);

  // Assert - weryfikuj wynik
  expect(result).toEqual(expectedValue);
});
```

### 2. Edge Cases

Każdy test zawiera scenariusze dla:

- 🎯 Ścieżka szczęśliwa (happy path)
- ⚠️ Walidacja błędnych danych
- 🔒 Sprawdzenie uprawnień
- 📄 Pusty wynik / brak danych
- ⚡ Błędy bazy danych

### 3. Mock Data

- Używaj dedykowanych mock factories
- Tworz realistyczne dane (email, UUID, daty)
- Stosuj stałe dla ID aby łatwo je identyfikować

### 4. Error Messages

Weryfikuj nie tylko typ erroru, ale też treść:

```typescript
await expect(service()).rejects.toThrow("User not found");
```

## Integracja z CI/CD

Testy jednostkowe są automatycznie uruchamiane:

1. ✅ Na każdy `git push` via GitHub Actions
2. ✅ Przed mergiem PR
3. ✅ W lokalnym pre-commit hook

Warunki zaliczenia:

- Wszystkie testy przechodzą ✓
- Pokrycie kodu >= 75% ✓
- Brak error console.log ✓

## Przyszłe ulepsz

- [ ] Parametrized tests dla różnych kombinacji RBAC
- [ ] Performance tests dla dużych zbiorów danych
- [ ] Integration tests z testową bazą danych
- [ ] E2E tests dla pełnych flow'ów
- [ ] Mutation testing dla rozszerzonej walidacji

## Troubleshooting

### Test zawiesza się

- Sprawdź czy wszystkie mocki resolveValue vs. rejectValue
- Upewnij się że vi.mocked() jest poprawnie konfigurowany

### Mock returns undefined

```typescript
// ❌ Źle
mockSelect.mockReturnThis(); // Returns this ale to nie jest promise

// ✅ Dobrze
mockSelect.mockReturnValue({ eq: mockEq }); // Returns object
mockEq.mockResolvedValue({ data: [...] }); // Returns promise
```

### RBAC test fail

- Sprawdź że testowi użytkownik ma prawidłową rolę
- Weryfikuj że mock data zawiera wymagane pola
- Sprawdź że error message dokładnie pasuje

## Dodawanie nowych testów

1. Skopiuj pattern z istniejącego testu
2. Stwórz mock data w dedykowanym pliku
3. Napisz testy dla happy path i error cases
4. Dodaj RBAC testy jeśli serwis ma autoryzację
5. Uruchom `npm run test:unit` aby zweryfikować

---

**Ostatnia aktualizacja**: 2026-02-02  
**Status**: ConvertED z bash API testów na TypeScript unit testy
