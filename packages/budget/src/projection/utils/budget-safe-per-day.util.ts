export const computeSafePerDay = (free: number, daysLeft: number): number => Math.floor(Math.max(free, 0) / Math.max(daysLeft, 1));
