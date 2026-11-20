/**
 * Shared contact validation. The browser has its own copy of these rules for
 * UX, but this module is the authority — the client is never trusted.
 */

export interface ContactInput {
  name: string;
  email: string;
  message: string;
  website: string;
  cf_turnstile_token: string;
}

export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CONTROL_RE = /[\u0000-\u001f\u007f]/;

/** Coerce an unknown JSON body into the exact shape we accept. */
export function parseContactBody(raw: unknown): ContactInput | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;

  if (
    typeof value.name !== 'string' ||
    typeof value.email !== 'string' ||
    typeof value.message !== 'string'
  ) {
    return null;
  }

  return {
    name: value.name,
    email: value.email,
    message: value.message,
    website: typeof value.website === 'string' ? value.website : '',
    cf_turnstile_token:
      typeof value.cf_turnstile_token === 'string' ? value.cf_turnstile_token : ''
  };
}

/** Return a field-keyed error map. Empty means valid. */
export function validateContact(input: ContactInput): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const message = input.message.trim();

  if (!name) errors.name = 'Please enter your name.';
  else if (name.length > 120) errors.name = 'Keep this under 120 characters.';
  else if (CONTROL_RE.test(name)) errors.name = 'Remove control characters.';

  if (!email) errors.email = 'Please enter your email.';
  else if (email.length > 254 || !EMAIL_RE.test(email)) {
    errors.email = 'That email does not look right.';
  }

  if (!message) errors.message = 'Please write a short message.';
  else if (message.length > 4000) errors.message = 'Keep this under 4000 characters.';
  else if (CONTROL_RE.test(message)) errors.message = 'Remove control characters.';

  return errors;
}

/** Values that are safe to persist and to render into the notification. */
export function cleanContact(input: ContactInput): {
  name: string;
  email: string;
  message: string;
} {
  return {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    message: input.message.trim()
  };
}
