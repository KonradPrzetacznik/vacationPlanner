/**
 * DatePicker Component
 * Simple date picker using native HTML5 date input
 */
import { forwardRef } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  id?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * DatePicker component with validation and error display
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ id, label, value, onChange, onBlur, error, min, max, disabled, required, className }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label htmlFor={id} className={error ? "text-red-600" : ""}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <Input
          ref={ref}
          id={id}
          type="date"
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          min={min}
          max={max}
          disabled={disabled}
          required={required}
          className={cn(error && "border-red-500 focus-visible:ring-red-500")}
        />
        {error && (
          <p className="text-sm text-red-600 mt-1" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";
