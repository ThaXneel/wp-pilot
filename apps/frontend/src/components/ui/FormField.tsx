"use client";

import { Input, InputProps } from "./Input";

interface FormFieldProps extends InputProps {
  label: string;
  error?: string;
}

function FormField({ label, error, ...props }: FormFieldProps) {
  return <Input label={label} error={error} {...props} />;
}

export { FormField };
