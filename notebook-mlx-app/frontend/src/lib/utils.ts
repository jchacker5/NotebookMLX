import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function for conditionally joining CSS class names
 * Combines clsx and tailwind-merge for optimal className handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
