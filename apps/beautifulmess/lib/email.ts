// Deliberately simple -- just enough to reject obviously-wrong input
// before it reaches the database, not a full RFC 5322 validator. The
// browser's own type="email" already does client-side validation; this
// backs it up server-side, since server actions can be called directly.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}
