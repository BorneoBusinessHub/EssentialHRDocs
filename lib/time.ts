const MYT_MS = 8 * 3600 * 1000; // Malaysia: UTC+8, no DST

export const todayMYT = (now: Date): string => new Date(now.getTime() + MYT_MS).toISOString().slice(0, 10);

export const startOfDayMYT = (now: Date): Date => new Date(Date.parse(todayMYT(now)) - MYT_MS);

export const addDays = (isoDate: string, n: number): string =>
  new Date(Date.parse(isoDate) + n * 86400000).toISOString().slice(0, 10);
