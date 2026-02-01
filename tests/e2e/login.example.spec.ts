import { test, expect } from "@playwright/test";

/**
 * Example E2E Test for Login Page
 *
 * This is an example test to demonstrate how E2E tests work.
 *
 * To run this test:
 * 1. Follow setup instructions in playwright.config.example.ts
 * 2. Run: npx playwright test
 */

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto("/login");
  });

  test("should display login form", async ({ page }) => {
    // Check if page title is correct
    await expect(page).toHaveTitle(/Vacation Planner/);

    // Check if login form elements are visible
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();
  });

  test("should show validation errors for empty form", async ({ page }) => {
    // Click submit button without filling the form
    await page.getByRole("button", { name: /log in/i }).click();

    // Check for validation error messages
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    // Fill in form with invalid credentials
    await page.getByLabel(/email/i).fill("invalid@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /log in/i }).click();

    // Check for error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test("should successfully login with valid credentials", async ({ page }) => {
    // Fill in form with valid test credentials
    await page.getByLabel(/email/i).fill("admin.user@vacationplanner.pl");
    await page.getByLabel(/password/i).fill("test123");
    await page.getByRole("button", { name: /log in/i }).click();

    // Wait for redirect to dashboard/home page
    await page.waitForURL("/");

    // Check if we're on the authenticated page
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test("should navigate to forgot password page", async ({ page }) => {
    // Click on forgot password link
    await page.getByRole("link", { name: /forgot password/i }).click();

    // Check if we're on forgot password page
    await page.waitForURL("/forgot-password");
    await expect(page.getByRole("heading", { name: /forgot password/i })).toBeVisible();
  });
});
