"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const typeStyles: Record<ToastType, string> = {
  success: "border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200",
  error: "border-destructive bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200",
  info: "border-primary bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200",
};

const typeIcons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

function Toast({ message, type = "info", duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const Icon = typeIcons[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border p-4 shadow-lg transition-all",
        typeStyles[type]
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 cursor-pointer">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export { Toast };
export type { ToastType };
