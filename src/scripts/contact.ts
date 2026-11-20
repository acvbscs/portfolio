/**
 * contact.ts — client half of the contact form.
 * Client validation is for UX only; the server re-checks everything.
 * The draft is never cleared on failure.
 */
import { site } from '../site.config';

interface TurnstileApi {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  getResponse: (element?: HTMLElement) => string | undefined;
  reset: (element?: HTMLElement) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
if (form) {
  const status = document.querySelector<HTMLElement>('[data-form-status]');
  const submit = document.querySelector<HTMLButtonElement>('[data-submit]');
  const container = document.querySelector<HTMLElement>('[data-turnstile]');
  const siteKey = container?.dataset.siteKey || '';
  const originalLabel = submit?.textContent?.trim() || site.contact.submit;
  const draftKey = 'ah-contact-draft';

  const nameInput = form.elements.namedItem('name') as HTMLInputElement;
  const emailInput = form.elements.namedItem('email') as HTMLInputElement;
  const messageInput = form.elements.namedItem('message') as HTMLTextAreaElement;
  const websiteInput = form.elements.namedItem('website') as HTMLInputElement | null;

  const inputs = [nameInput, emailInput, messageInput];

  /* ------------------------------------------------------------ draft state */

  try {
    const raw = localStorage.getItem(draftKey);
    if (raw) {
      const draft = JSON.parse(raw) as Record<string, string>;
      if (draft.name) nameInput.value = draft.name;
      if (draft.email) emailInput.value = draft.email;
      if (draft.message) messageInput.value = draft.message;
    }
  } catch {
    /* a corrupt draft must never break the form */
  }
  if (websiteInput) websiteInput.value = '';

  function saveDraft(): void {
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          name: nameInput.value,
          email: emailInput.value,
          message: messageInput.value
        })
      );
    } catch {
      /* storage can be disabled; the form still works */
    }
  }

  for (const input of inputs) input.addEventListener('input', saveDraft);

  /* ----------------------------------------------------------- field errors */

  function setError(field: string, message: string): void {
    const target = document.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
    if (target) {
      target.textContent = message;
      target.hidden = !message;
    }
    const input = form?.elements.namedItem(field) as HTMLInputElement | null;
    if (input) {
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
  }

  function clearErrors(): void {
    setError('name', '');
    setError('email', '');
    setError('message', '');
  }

  function setStatus(message: string, tone: 'ok' | 'error' | ''): void {
    if (!status) return;
    status.textContent = message;
    if (tone) status.dataset.tone = tone;
    else delete status.dataset.tone;
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    if (!name) errors.name = 'Please enter your name.';
    else if (name.length > 120) errors.name = 'Keep this under 120 characters.';

    if (!email) errors.email = 'Please enter your email.';
    else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'That email does not look right.';
    }

    if (!message) errors.message = 'Please write a short message.';
    else if (message.length > 4000) errors.message = 'Keep this under 4000 characters.';

    return errors;
  }

  /* --------------------------------------------------------------- turnstile */

  let turnstileRequested = false;

  function loadTurnstile(): void {
    if (!siteKey || turnstileRequested) return;
    turnstileRequested = true;

    const script = document.createElement('script');
    script.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.turnstile || !container) return;
      container.hidden = false;
      window.turnstile.render(container, {
        sitekey: siteKey,
        size: 'compact',
        theme: 'dark'
      });
    };
    document.head.append(script);
  }

  if (siteKey) form.addEventListener('focusin', loadTurnstile, { once: true });

  /* ------------------------------------------------------------------ submit */

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();

    const errors = validate();
    const fields = Object.keys(errors);
    if (fields.length > 0) {
      for (const field of fields) setError(field, errors[field]);
      setStatus(site.contact.validation, 'error');
      (form.elements.namedItem(fields[0]) as HTMLInputElement | null)?.focus();
      return;
    }

    if (submit) {
      submit.disabled = true;
      submit.textContent = site.contact.submitting;
    }
    setStatus('', '');

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      message: messageInput.value.trim(),
      website: websiteInput?.value ?? '',
      cf_turnstile_token: siteKey
        ? window.turnstile?.getResponse(container ?? undefined) ?? ''
        : ''
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let data: {
        ok?: boolean;
        error?: string;
        fields?: Record<string, string>;
      } = {};
      try {
        data = (await response.json()) as typeof data;
      } catch {
        /* non-JSON response is treated as a server failure */
      }

      if (response.ok && data.ok) {
        form.reset();
        try {
          localStorage.removeItem(draftKey);
        } catch {
          /* nothing to clean up */
        }
        if (container && window.turnstile) window.turnstile.reset(container);
        setStatus(site.contact.success, 'ok');
        return;
      }

      if (data.error === 'validation' && data.fields) {
        for (const [field, message] of Object.entries(data.fields)) {
          setError(field, message);
        }
        setStatus(site.contact.validation, 'error');
      } else if (data.error === 'bot') {
        setStatus(site.contact.bot, 'error');
      } else if (data.error === 'rate_limited') {
        setStatus(site.contact.rateLimited, 'error');
      } else {
        setStatus(site.contact.failure, 'error');
      }
    } catch {
      setStatus(site.contact.failure, 'error');
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = originalLabel;
      }
    }
  });
}
