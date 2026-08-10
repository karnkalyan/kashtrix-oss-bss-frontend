import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatLocalDate } from "@/lib/display-format"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  return formatLocalDate(date)
}
