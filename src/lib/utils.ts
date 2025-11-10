/**
 * UTILITY FUNCTIONS
 * 
 * Business Purpose:
 * - Provides common helper functions used across the application
 * 
 * Technical Details:
 * - cn(): Combines and merges Tailwind CSS class names intelligently
 * - Handles conditional classes and prevents conflicts
 * - Uses clsx for conditional class handling and tailwind-merge for deduplication
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names and merges Tailwind classes intelligently
 * 
 * @param inputs - Class names, objects, or arrays of classes
 * @returns Merged, deduplicated class string
 * 
 * Example:
 * cn("px-2 py-1", condition && "bg-blue-500", "px-4") 
 * // Returns: "py-1 bg-blue-500 px-4" (px-2 is overridden by px-4)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
