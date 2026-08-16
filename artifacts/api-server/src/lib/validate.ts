/** Basic structural email check — not RFC-exhaustive, just enough to reject junk. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
