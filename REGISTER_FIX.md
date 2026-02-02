# Poprawka - Brak wysyłania firstName i lastName w requeście

## Problem

Podczas rejestracji użytkownik otrzymywał błąd 400 (Bad Request) z komunikatem "Required", ponieważ formularz nie wysyłał pól `firstName` i `lastName` do API.

## Przyczyna

W pliku `src/components/forms/RegisterForm.tsx` w funkcji `onSubmit` wysyłaliśmy tylko `email` i `password`, pomimo że:
- Formularz zawierał pola `firstName` i `lastName`
- API endpoint wymagał wszystkich 4 pól
- Schema walidacji wymagała `firstName` i `lastName`

**Błędny kod:**
```typescript
body: JSON.stringify({
  email: data.email,
  password: data.password,
})
```

## Rozwiązanie

Zaktualizowano wywołanie API, aby wysyłało wszystkie wymagane pola:

```typescript
body: JSON.stringify({
  firstName: data.firstName,
  lastName: data.lastName,
  email: data.email,
  password: data.password,
})
```

## Zmodyfikowany plik

- `src/components/forms/RegisterForm.tsx` (linia 51)

## Testowanie

Teraz rejestracja wymaga pełnego requestu:

```json
{
  "firstName": "Jan",
  "lastName": "Kowalski",
  "email": "konrad.przetacznik@pragmago.tech",
  "password": "QWEasd123"
}
```

## Weryfikacja

1. Projekt kompiluje się bez błędów ✅
2. Formularz zbiera wszystkie 4 pola ✅
3. Request zawiera wszystkie wymagane dane ✅
4. API endpoint może utworzyć profil z imieniem i nazwiskiem ✅

## Status

✅ **NAPRAWIONE** - Rejestracja działa poprawnie.

Wypełnij formularz rejestracji z imieniem i nazwiskiem, a system utworzy konto z profilem w bazie danych.
