/**
 * Register Form Component
 * Client-side React component for user registration
 * Handles form validation, submission, and user feedback
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";
import { registerFormSchema, type RegisterFormValues } from "@/lib/schemas/auth-form.schema";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * RegisterForm component
 * Renders a registration form with email, password, and confirm password fields
 */
export function RegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  /**
   * Handle form submission
   * Sends POST request to register API endpoint
   */
  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);

    try {
      // Send POST request to register API
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
        }),
      });

      // Handle response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Wystąpił błąd podczas rejestracji");
      }

      // Success - show success message
      setIsSuccess(true);
      toast.success("Konto zostało utworzone. Sprawdź swoją skrzynkę e-mail, aby potwierdzić adres.");
    } catch (error) {
      // Display error message
      const errorMessage = error instanceof Error ? error.message : "Wystąpił błąd podczas rejestracji";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If success, show success message instead of form
  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sprawdź swoją skrzynkę e-mail</CardTitle>
          <CardDescription>Wysłaliśmy wiadomość z linkiem potwierdzającym na podany adres e-mail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Kliknij link w wiadomości e-mail, aby aktywować swoje konto i ustawić hasło. Jeśli nie otrzymasz wiadomości
            w ciągu kilku minut, sprawdź folder spam.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <a href="/login" className="text-sm text-muted-foreground hover:text-primary underline">
            Powrót do logowania
          </a>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Rejestracja</CardTitle>
        <CardDescription>Utwórz nowe konto w VacationPlanner</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* First Name field */}
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imię</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Jan" autoComplete="given-name" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Last Name field */}
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwisko</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Kowalski"
                      autoComplete="family-name"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adres e-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="twoj@email.com"
                      autoComplete="email"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Wprowadź swój służbowy adres e-mail</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasło</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Hasło musi mieć min. 8 znaków i zawierać małą i wielką literę oraz cyfrę
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password field */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potwierdź hasło</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Tworzenie konta..." : "Zarejestruj się"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <a href="/login" className="text-sm text-muted-foreground hover:text-primary underline">
          Masz już konto? Zaloguj się
        </a>
      </CardFooter>
    </Card>
  );
}
