import type { Lang } from "../context/CartContext";

export type Season = "fathers-day" | "easter" | "mothers-day" | "christmas";

// Easter Sunday via the anonymous Gregorian algorithm (Meeus/Jones/Butcher) —
// the only one of these four dates that isn't fixed or a simple "Nth weekday
// of month" rule, since it follows the lunar-based Computus calendar.
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// Portugal's Dia da Mãe: first Sunday of May.
function firstSundayOfMay(year: number): Date {
  const d = new Date(year, 4, 1);
  const offset = d.getDay() === 0 ? 0 : 7 - d.getDay();
  d.setDate(1 + offset);
  return d;
}

function isWithinWindow(now: Date, target: Date, daysBefore: number, daysAfter: number): boolean {
  const start = new Date(target);
  start.setDate(start.getDate() - daysBefore);
  start.setHours(0, 0, 0, 0);
  const end = new Date(target);
  end.setDate(end.getDate() + daysAfter);
  end.setHours(23, 59, 59, 999);
  return now >= start && now <= end;
}

/**
 * Which seasonal occasion (if any) is currently active, so a page can show a
 * festive variant without anyone needing to remember to toggle it on and off
 * each year. Dates follow Portuguese convention, since that is the site's
 * home market — notably Dia do Pai (19 March) and Dia da Mãe (first Sunday
 * of May), both of which differ from the US/UK dates used elsewhere.
 * Each window opens 10 days before the occasion (gift-buying lead time) and
 * closes on the day itself, except Christmas (a fixed Dec 1-25 range) and
 * Easter (which stays open through Easter Monday).
 */
export function getActiveSeason(now: Date = new Date()): Season | null {
  const year = now.getFullYear();

  const fathersDay = new Date(year, 2, 19); // 19 March
  if (isWithinWindow(now, fathersDay, 10, 0)) return "fathers-day";

  const easter = easterSunday(year);
  if (isWithinWindow(now, easter, 10, 1)) return "easter";

  const mothersDay = firstSundayOfMay(year);
  if (isWithinWindow(now, mothersDay, 10, 0)) return "mothers-day";

  const christmasStart = new Date(year, 11, 1);
  const christmasEnd = new Date(year, 11, 25, 23, 59, 59, 999);
  if (now >= christmasStart && now <= christmasEnd) return "christmas";

  return null;
}

export const SEASONAL_GREETING: Record<Season, Record<Lang, string>> = {
  "fathers-day": {
    PT: "Feliz Dia do Pai! 🎉",
    EN: "Happy Father's Day! 🎉",
    DE: "Alles Gute zum Vatertag! 🎉",
    NL: "Fijne Vaderdag! 🎉",
  },
  easter: {
    PT: "Feliz Páscoa! 🐣",
    EN: "Happy Easter! 🐣",
    DE: "Frohe Ostern! 🐣",
    NL: "Fijne Pasen! 🐣",
  },
  "mothers-day": {
    PT: "Feliz Dia da Mãe! 💐",
    EN: "Happy Mother's Day! 💐",
    DE: "Alles Gute zum Muttertag! 💐",
    NL: "Fijne Moederdag! 💐",
  },
  christmas: {
    PT: "Boas Festas! 🎄",
    EN: "Happy Holidays! 🎄",
    DE: "Frohe Weihnachten! 🎄",
    NL: "Fijne Feestdagen! 🎄",
  },
};
