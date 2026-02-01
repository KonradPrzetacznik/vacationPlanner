# 🔍 Diagnoza: Dlaczego NADAL były duplikaty? (v3)

## Problem: React reference identity - JESZCZE GŁĘBIEJ

React porównuje dependencies **po referencji**, nie po wartości.

### Prawdziwy problem (trzecia warstwa):

```typescript
// useTeamCalendar
const [dateRange, setDateRangeState] = useState({ start: "...", end: "..." });

// useMemo (PRZED FIX v3)
const state = useMemo(
  () => ({ isLoading, error, calendarData, selectedTeamId, dateRange }),
  [isLoading, error, calendarData, selectedTeamId, dateRange]  // ← dateRange OBIEKT!
);
```

**Co się działo:**

1. `setDateRangeState({ start: "2026-01-01", end: "2026-01-31" })` → **NOWY OBIEKT** dateRange
2. `useMemo` widzi nową referencję `dateRange` → **NOWY OBIEKT** state
3. `CalendarView` dostaje nowy `state` → `actions` się nie zmienia (✅), ale `state` TAK (❌)
4. Komponenty używające `state` re-renderują się
5. Ale co gorsz: `handleDateRangeChange` używa `actions` w deps → **actions zmienia się kiedy state się zmienia?** ❌

**NIE!** Problem jest bardziej subtelny:

**FullCalendar** wywołuje `datesSet` → `handleDatesSet` → timeout 150ms → `onDateRangeChange` → `setDateRange` → **NOWY dateRange** → **NOWY state** → CalendarView re-render → **NOWY handleDateRangeChange** (bo actions w deps) → Calendar dostaje nowy callback → **handleDatesSet REKONSTRUKCJA** → **timeout RESET**!

### Łańcuch problemów (kompletny):

```
1. FullCalendar wywołuje datesSet (#1) → timeout 150ms START
2. Przed upływem 150ms: setDateRange({ start, end })
3. dateRange = NOWY OBIEKT { start, end }  ← NOWA REFERENCJA
4. useMemo(state) widzi dateRange change → state = NOWY OBIEKT
5. CalendarView re-render (state changed)
6. handleDateRangeChange ma actions w deps
7. actions.setDateRange === ta sama funkcja (✅ useCallback)
8. ALE actions OBIEKT może się zmienić? NIE - actions jest zmemoizowany
9. WIĘC handleDateRangeChange NIE powinien się zmienić... ✅
10. CZEKAJ - może problem jest gdzie indziej?

RZECZYWISTY PROBLEM:
- dateRange jest NOWYM OBIEKTEM
- state jest NOWYM OBIEKTEM (bo dateRange w deps jako obiekt)
- Komponenty konsumujące state re-renderują się
- Calendar re-renderuje się (bo dostaje state.calendarData, state.isLoading)
- handleDatesSet SIĘ REKONSTRUUJE (bo onDateRangeChange w deps)
- onDateRangeChange ZMIENIA REFERENCJĘ?

NIE CZEKAJ - sprawdźmy CalendarView:
const handleDateRangeChange = useCallback(..., [actions]);

actions jest zmemoizowany ✅
handleDateRangeChange JEST zmemoizowany ✅

WIĘC gdzie jest problem?!

AHA! Problem jest w tym że:
1. dateRange OBIEKT w useMemo deps
2. Każda zmiana dateRange → NOWY state
3. Komponenty używające state re-renderują się niepotrzebnie
4. To powoduje RACE CONDITION w timeoutach!
```

## Prostsze wyjaśnienie:

**Problem:** `dateRange` to obiekt. Obiekt w JavaScript jest porównywany po referencji.

```typescript
const a = { start: "2026-01-01", end: "2026-01-31" };
const b = { start: "2026-01-01", end: "2026-01-31" };
console.log(a === b); // FALSE! ← Różne referencje!
```

**Co się działo w kodzie:**

```typescript
// useState tworzy NOWY obiekt przy każdym setDateRangeState
setDateRangeState({ start: "...", end: "..." }); // ← NOWY OBIEKT!

// useMemo ma dateRange (OBIEKT) w dependencies
const state = useMemo(() => ({ ... }), [dateRange]); // ← Widzi NOWY obiekt!

// useMemo tworzy NOWY state (bo dateRange się "zmienił")
// Komponenty re-renderują się niepotrzebnie
// Race conditions w timeoutach
```

**Rozwiązanie:**

```typescript
// ❌ ŹLE: Obiekt w dependencies
const state = useMemo(
  () => ({ isLoading, error, calendarData, selectedTeamId, dateRange }),
  [isLoading, error, calendarData, selectedTeamId, dateRange]  // ← dateRange OBIEKT
);

// ✅ DOBRZE: Prymitywy w dependencies
const state = useMemo(
  () => ({ isLoading, error, calendarData, selectedTeamId, dateRange }),
  [isLoading, error, calendarData, selectedTeamId, dateRange.start, dateRange.end]  // ← PRYMITYWY
);
```

Prymitywy (stringi) są porównywane **po wartości**:
```typescript
"2026-01-01" === "2026-01-01" // TRUE! ✅
```

Teraz `useMemo` reaguje tylko gdy **wartości się rzeczywiście zmieniają**, nie przy każdym re-renderze!

```typescript
// useTeamCalendar (PRZED FIX)
return {
  actions: {                    // ← Nowy obiekt przy każdym renderze!
    setSelectedTeamId,
    setDateRange,
  },
};

// CalendarView (PRZED FIX)
const handleDateRangeChange = (startDate, endDate) => {  // ← Nowa funkcja!
  actions.setDateRange({ start: startDate, end: endDate });
};

// Calendar
const handleDatesSet = useCallback(
  (arg) => { 
    onDateRangeChange(startDate, endDate); 
  },
  [onDateRangeChange]  // ← onDateRangeChange zmienia się → handleDatesSet jest rekonstruowany!
);
```

### Co się działo:

1. **useTeamCalendar render** → nowy obiekt `actions`
2. **CalendarView render** → `handleDateRangeChange` dostaje nowy `actions` → nowa funkcja
3. **Calendar render** → nowy `onDateRangeChange` w props
4. **handleDatesSet rekonstrukcja** → bo `onDateRangeChange` się zmienił
5. **datesSetTimeoutRef reset** → timeout jest wyczyszczony przy rekonstrukcji callback
6. **FullCalendar wywołuje datesSet 2 razy** → oba timeouty się wykonują
7. **2 REQUESTY** ❌

## Rozwiązanie: Stabilne referencje

```typescript
// useTeamCalendar (PO FIX)
const actions = useMemo(
  () => ({
    setSelectedTeamId,
    setDateRange,
  }),
  [setSelectedTeamId, setDateRange]  // ← Te się nie zmieniają (useCallback z [])
);
// ✅ actions ma tę samą referencję między renderami

// CalendarView (PO FIX)
const handleDateRangeChange = useCallback(
  (startDate, endDate) => {
    actions.setDateRange({ start: startDate, end: endDate });
  },
  [actions]  // ← actions się nie zmienia → handleDateRangeChange też nie
);
// ✅ handleDateRangeChange ma tę samą referencję

// Calendar
const handleDatesSet = useCallback(
  (arg) => { 
    // timeout logic
    onDateRangeChange(startDate, endDate); 
  },
  [onDateRangeChange]  // ← onDateRangeChange się NIE ZMIENIA
);
// ✅ handleDatesSet NIE JEST rekonstruowany
// ✅ Timeout działa poprawnie
// ✅ Tylko 1 REQUEST
```

## Diagram przepływu

### PRZED FIX (duplikaty):
```
useTeamCalendar render
  ↓
new actions object { ... }  ← NOWA REFERENCJA
  ↓
CalendarView render
  ↓
new handleDateRangeChange()  ← NOWA FUNKCJA
  ↓
Calendar render (props changed)
  ↓
handleDatesSet reconstructed  ← REKONSTRUKCJA
  ↓
timeout reference lost  ← TIMEOUT ZGUBIONY
  ↓
FullCalendar: datesSet call #1 → timeout 150ms
FullCalendar: datesSet call #2 → timeout 150ms (osobny!)
  ↓
2 TIMEOUTY wykonują się
  ↓
2 REQUESTY ❌
```

### PO FIX (1 request):
```
useTeamCalendar render
  ↓
useMemo returns SAME actions  ← TA SAMA REFERENCJA
  ↓
CalendarView render
  ↓
useCallback returns SAME handleDateRangeChange  ← TA SAMA FUNKCJA
  ↓
Calendar (props NOT changed)
  ↓
handleDatesSet NOT reconstructed  ← BRAK REKONSTRUKCJI
  ↓
timeout reference preserved  ← TIMEOUT ZACHOWANY
  ↓
FullCalendar: datesSet call #1 → timeout 150ms (set)
FullCalendar: datesSet call #2 → timeout cleared, new 150ms (set)
  ↓
Tylko OSTATNI TIMEOUT się wykonuje
  ↓
1 REQUEST ✅
```

## Kluczowe zasady React optimization

### 1. Objects and Arrays are always new
```typescript
// ❌ BAD: Nowy obiekt przy każdym renderze
const obj = { a: 1, b: 2 };

// ✅ GOOD: Ten sam obiekt między renderami
const obj = useMemo(() => ({ a: 1, b: 2 }), []);
```

### 2. Functions are recreated
```typescript
// ❌ BAD: Nowa funkcja przy każdym renderze
const handler = () => { /* ... */ };

// ✅ GOOD: Ta sama funkcja między renderami
const handler = useCallback(() => { /* ... */ }, []);
```

### 3. Dependencies matter
```typescript
// ❌ BAD: Rekonstrukcja przy każdej zmianie obj
const memoized = useMemo(() => doSomething(obj), [obj]);

// ✅ GOOD: Rekonstrukcja tylko gdy potrzeba
const obj = useMemo(() => ({ a, b }), [a, b]);
const memoized = useMemo(() => doSomething(obj), [obj]);
```

## Dlaczego debouncing sam nie wystarczył?

Debouncing działa, ale tylko **w obrębie jednego timeoutu**:

```typescript
// Timeout 1 (pierwszy render handleDatesSet)
datesSetTimeoutRef.current = setTimeout(() => { ... }, 150);

// Component re-render → handleDatesSet rekonstruowany
// → datesSetTimeoutRef to NOWY ref!

// Timeout 2 (drugi render handleDatesSet)  
datesSetTimeoutRef.current = setTimeout(() => { ... }, 150);

// Oba timeouty się wykonują bo to osobne callbacki!
```

**Rozwiązanie:** Zapobiec rekonstrukcji `handleDatesSet` przez stabilne propsy.

## Podsumowanie

**Problem nie był w FullCalendar** - był w React reference identity.

**Potrzebne były 3 warstwy ochrony:**
1. Debouncing (łagodzi symptomy)
2. Deduplikacja (łagodzi symptomy)  
3. **Stabilne referencje (naprawia przyczynę)** ← KLUCZOWE

Bez warstwy 3, warstwy 1 i 2 nie działają poprawnie.
