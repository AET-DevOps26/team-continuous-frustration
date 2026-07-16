import type { StudyStatus } from "@/api/study";

// Mirrors services/study-service StudyService's scheduling algorithm so the UI can
// preview the resulting interval before the learner picks a rating. The ease-factor
// values are read from VITE_STUDY_EASE_* env vars, which must be set to the same
// values as the backend's STUDY_EASE_* env vars (see its README) to avoid drift.
// The interval multipliers are fixed algorithm constants on the backend (not ease
// factors), so they stay hardcoded here too.
function readNumberEnv(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const MIN_EASE_FACTOR = readNumberEnv(import.meta.env.VITE_STUDY_EASE_MIN, 1.3);
const AGAIN_EASE_PENALTY = readNumberEnv(import.meta.env.VITE_STUDY_EASE_AGAIN_PENALTY, 0.2);
const HARD_EASE_PENALTY = readNumberEnv(import.meta.env.VITE_STUDY_EASE_HARD_PENALTY, 0.15);
const EASY_EASE_BONUS = readNumberEnv(import.meta.env.VITE_STUDY_EASE_EASY_BONUS, 0.15);
const HARD_FIRST_STEP_MINUTES = readNumberEnv(import.meta.env.VITE_STUDY_HARD_FIRST_STEP_MINUTES, 10);
const HARD_INTERVAL_MULTIPLIER = 1.2;
const EASY_INTERVAL_MULTIPLIER = 1.3;

export interface SchedulingState {
  interval_days: number;
  ease_factor: number;
}

export function previewNextIntervalDays(state: SchedulingState, rating: StudyStatus): number {
  const { interval_days: intervalDays, ease_factor: ease } = state;

  switch (rating) {
    case "again":
      return 0;
    case "hard":
      return Math.max(1, Math.round(Math.max(intervalDays, 1) * HARD_INTERVAL_MULTIPLIER));
    case "good":
      return intervalDays <= 0 ? 1 : Math.round(intervalDays * ease);
    case "easy":
      return intervalDays <= 0 ? 2 : Math.round(intervalDays * ease * EASY_INTERVAL_MULTIPLIER);
    default:
      return intervalDays;
  }
}

export function previewNextEaseFactor(state: SchedulingState, rating: StudyStatus): number {
  const { ease_factor: ease } = state;

  switch (rating) {
    case "again":
      return Math.max(MIN_EASE_FACTOR, ease - AGAIN_EASE_PENALTY);
    case "hard":
      return Math.max(MIN_EASE_FACTOR, ease - HARD_EASE_PENALTY);
    case "easy":
      return ease + EASY_EASE_BONUS;
    case "good":
    default:
      return ease;
  }
}

export function formatIntervalDays(days: number): string {
  if (days <= 0) return "< 1 min";
  if (days === 1) return "1 day";
  return `${days} days`;
}

// A card that hasn't graduated past the reset state yet (interval_days <= 0) gets a
// short learning-step retry on "Hard" instead of jumping straight to a full day —
// mirrors StudyService.updateStatus's stillLearning handling for HARD.
export function previewNextDueLabel(state: SchedulingState, rating: StudyStatus): string {
  if (rating === "hard" && state.interval_days <= 0) {
    return `${HARD_FIRST_STEP_MINUTES} min`;
  }
  return formatIntervalDays(previewNextIntervalDays(state, rating));
}
