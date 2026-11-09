/**
 * Accepts a `redirect-uri` query value only if it is a path on this site, so a crafted
 * `?redirect-uri=https://evil.example` cannot turn the login flow into an open redirect.
 * Protocol-relative values (`//host`, `/\host`) are rejected as well.
 */
export const localRedirectPath = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  if (!value.startsWith('/')) return undefined;
  if (value.startsWith('//') || value.startsWith('/\\')) return undefined;

  return value;
};
