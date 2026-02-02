/**
 * Settings Form Component
 * Client-side React component for editing global application settings
 * Handles form validation, submission, and user feedback
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";
import { settingsFormSchema, type SettingsFormValues } from "@/lib/schemas/settings-form.schema";
import type { SettingDTO } from "@/types";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Props for SettingsForm component
 */
interface SettingsFormProps {
  initialSettings: SettingsFormValues;
}

/**
 * SettingsForm component
 * Renders a form for editing application settings with validation
 */
export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: initialSettings,
  });

  /**
   * Handle form submission
   * Transforms form data to API format and sends POST request
   */
  const onSubmit = async (data: SettingsFormValues) => {
    setIsSubmitting(true);

    try {
      // Transform form data to API format (array of SettingDTO)
      const settingsToUpdate: { key: string; value: number }[] = [
        { key: "default_vacation_days", value: data.default_vacation_days },
        { key: "team_occupancy_threshold", value: data.team_occupancy_threshold },
      ];

      // Send POST request to API
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsToUpdate),
      });

      // Handle response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Nie udało się zapisać ustawień");
      }

      const result = await response.json();

      // Show success message
      toast.success("Ustawienia zostały pomyślnie zapisane");

      // Optionally update form with returned data
      if (result.data && Array.isArray(result.data)) {
        const updatedSettings: SettingsFormValues = {
          default_vacation_days:
            result.data.find((s: SettingDTO) => s.key === "default_vacation_days")?.value || data.default_vacation_days,
          team_occupancy_threshold:
            result.data.find((s: SettingDTO) => s.key === "team_occupancy_threshold")?.value ||
            data.team_occupancy_threshold,
        };
        form.reset(updatedSettings);
      }
    } catch (error) {
      // Handle errors
      toast.error(error instanceof Error ? error.message : "Wystąpił błąd podczas zapisywania ustawień");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Ustawienia globalne</CardTitle>
        <CardDescription>Skonfiguruj globalne parametry aplikacji</CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Default Vacation Days Field */}
            <FormField
              control={form.control}
              name="default_vacation_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domyślna liczba dni urlopowych</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="26"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>Domyślna liczba dni urlopowych dla nowych pracowników (1-365)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Team Occupancy Threshold Field */}
            <FormField
              control={form.control}
              name="team_occupancy_threshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Próg obłożenia zespołu (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="75"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Maksymalny procent członków zespołu, którzy mogą być nieobecni jednocześnie (0-100)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : "Zapisz ustawienia"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
