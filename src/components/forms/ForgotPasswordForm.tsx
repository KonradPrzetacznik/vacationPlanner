/**
 * Forgot Password Form Component
 * Client-side React component for password reset request
 * Handles form validation, submission, and user feedback
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";
import { forgotPasswordFormSchema, type ForgotPasswordFormValues } from "@/lib/schemas/auth-form.schema";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * ForgotPasswordForm component
 * Renders a form for requesting password reset
 */
export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {
      email: "",
    },
  });

  /**
   * Handle form submission
   * Sends POST request to forgot password API endpoint
   */
  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);

    try {
      // Send POST request to forgot password API
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      // Handle response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Wystąpił błąd podczas wysyłania linku do resetowania hasła");
      }

      // Success - show success message
      setIsSuccess(true);
      toast.success("Link do resetowania hasła został wysłany");
    } catch (error) {
      // Display error message
      const errorMessage = error instanceof Error ? error.message : "Wystąpił błąd";
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
          <CardDescription>Wysłaliśmy instrukcje resetowania hasła na podany adres e-mail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Jeśli nie otrzymasz wiadomości w ciągu kilku minut, sprawdź folder spam lub spróbuj ponownie.
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
        <CardTitle>Zapomniałeś hasła?</CardTitle>
        <CardDescription>Podaj swój adres e-mail, a wyślemy Ci link do resetowania hasła</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <FormDescription>Wprowadź adres e-mail powiązany z Twoim kontem</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <a href="/login" className="text-sm text-muted-foreground hover:text-primary underline">
          Powrót do logowania
        </a>
      </CardFooter>
    </Card>
  );
}
