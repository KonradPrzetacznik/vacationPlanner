/**
 * Set Password Form Component
 * Client-side React component for setting/resetting password
 * Handles form validation, submission, and user feedback
 * Used for both first login and password reset flows
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { setPasswordFormSchema, type SetPasswordFormValues } from "@/lib/schemas/auth-form.schema";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * SetPasswordForm component
 * Renders a form for setting a new password
 * Extracts token from URL hash fragment (#access_token=...)
 */
export function SetPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenType, setTokenType] = useState<"recovery" | "invite">("recovery");

  // Extract token from URL hash fragment on mount
  useEffect(() => {
    // Parse hash fragment for access_token
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type") as "recovery" | "invite" | null;

    if (accessToken) {
      setToken(accessToken);
      setTokenType(type || "recovery");
    } else {
      // Fallback: try query parameter for backward compatibility
      const searchParams = new URLSearchParams(window.location.search);
      const queryToken = searchParams.get("token");
      if (queryToken) {
        setToken(queryToken);
        setTokenType("recovery");
      }
    }
  }, []);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  /**
   * Handle form submission
   * Sends POST request to set password API endpoint with token
   */
  const onSubmit = async (data: SetPasswordFormValues) => {
    // Check if token is present
    if (!token) {
      toast.error("Brak tokenu weryfikacyjnego. Spróbuj ponownie skorzystać z linku z e-maila.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Send POST request to set password API
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: data.password,
          token,
          type: tokenType,
        }),
      });

      // Handle response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Nie udało się ustawić hasła");
      }

      // Success - redirect to login page
      toast.success("Hasło zostało pomyślnie ustawione. Możesz się teraz zalogować.");

      // Wait a bit for the toast to be visible, then redirect
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (error) {
      // Display error message
      const errorMessage = error instanceof Error ? error.message : "Wystąpił błąd podczas ustawiania hasła";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If no token, show error message
  if (token === null) {
    // Still loading or no token
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Ładowanie...</CardTitle>
          <CardDescription>Sprawdzanie linku do ustawienia hasła</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (token === "") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nieprawidłowy link</CardTitle>
          <CardDescription>Link do ustawienia hasła jest nieprawidłowy lub wygasł</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Spróbuj ponownie skorzystać z linku otrzymanego w wiadomości e-mail lub skontaktuj się z administratorem.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <a href="/login">Przejdź do logowania</a>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <a href="/forgot-password">Resetuj hasło</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Ustaw nowe hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło dla swojego konta</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Password field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nowe hasło</FormLabel>
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
                    Hasło musi mieć co najmniej 8 znaków i zawierać małą literę, wielką literę oraz cyfrę
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm password field */}
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
              {isSubmitting ? "Ustawianie hasła..." : "Ustaw hasło"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
