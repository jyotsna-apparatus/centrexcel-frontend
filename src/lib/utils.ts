import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Border, ring, and outline for invalid fields — matches error copy `!text-red-500`. */
export const FIELD_ERROR_INPUT_CLASS =
  "border-red-500 !outline outline-2 outline-red-500 outline-offset-0 ring-2 ring-red-500/25";
