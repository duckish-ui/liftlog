// Pure helpers for workout math (shared by server pages and API).

export type SetLike = { reps: number; weight: number };

/** Epley estimated one-rep max. */
export function e1rm(s: SetLike) {
  if (s.reps <= 0) return 0;
  if (s.reps === 1) return s.weight;
  return Math.round(s.weight * (1 + s.reps / 30) * 10) / 10;
}

export function volume(sets: SetLike[]) {
  return sets.reduce((sum, s) => sum + s.reps * s.weight, 0);
}

/** Monday 00:00 UTC of the week containing d (dates are stored as UTC days). */
export function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getUTCDay() + 6) % 7; // Mon=0
  x.setUTCHours(0, 0, 0, 0);
  x.setUTCDate(x.getUTCDate() - day);
  return x;
}

const dayKey = (d: Date) => {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x.getTime();
};

/**
 * Consecutive days with at least one workout, ending today or yesterday
 * (so a streak isn't "broken" before you've had a chance to train today).
 */
export function currentStreak(dates: Date[]) {
  const days = new Set(dates.map(dayKey));
  const oneDay = 86400000;
  let cursor = dayKey(new Date());
  if (!days.has(cursor)) cursor -= oneDay;
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor -= oneDay;
  }
  return streak;
}

export function formatNumber(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

/** Workout dates are stored as UTC midnight of the calendar day, so always format in UTC. */
export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  return new Date(d).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
}
