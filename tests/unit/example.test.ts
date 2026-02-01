import { describe, it, expect } from "vitest";

/**
 * Example Unit Test
 *
 * This is an example test to demonstrate how unit tests work.
 *
 * To run this test:
 * 1. Follow setup instructions in tests/unit/README.md
 * 2. Run: npm run test:unit
 */

// Example: Testing a utility function
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pl-PL").format(date);
}

describe("formatDate", () => {
  it("should format date in Polish locale", () => {
    const date = new Date("2026-02-01");
    const result = formatDate(date);
    expect(result).toBe("1.02.2026");
  });
});

// Example: Testing validation
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

describe("validateEmail", () => {
  it("should return true for valid email", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("test.user@domain.co.uk")).toBe(true);
  });

  it("should return false for invalid email", () => {
    expect(validateEmail("invalid")).toBe(false);
    expect(validateEmail("no@domain")).toBe(false);
    expect(validateEmail("@example.com")).toBe(false);
    expect(validateEmail("")).toBe(false);
  });
});

// Example: Testing a class
class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error("Division by zero");
    }
    return a / b;
  }
}

describe("Calculator", () => {
  const calculator = new Calculator();

  describe("add", () => {
    it("should add two positive numbers", () => {
      expect(calculator.add(2, 3)).toBe(5);
    });

    it("should add negative numbers", () => {
      expect(calculator.add(-2, -3)).toBe(-5);
    });
  });

  describe("divide", () => {
    it("should divide two numbers", () => {
      expect(calculator.divide(10, 2)).toBe(5);
    });

    it("should throw error when dividing by zero", () => {
      expect(() => calculator.divide(10, 0)).toThrow("Division by zero");
    });
  });
});
