import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { Flashcard } from "@/api/flashcard";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isAiGenerated = (card: Flashcard) => card.source_ref.trim().length > 0;

