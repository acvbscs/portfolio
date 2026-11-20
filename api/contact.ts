/**
 * POST /api/contact — the only trusted boundary in the contact flow.
 *
 * Runs on Vercel's Node runtime. No secrets exist in the browser bundle.
 * Order matters: honeypot -> schema -> origin -> Turnstile -> rate gate ->
 * database -> email. The client never learns which check rejected it.
 */
import { createHmac } from 'node:crypto';
import {
  parseContactBody,
  validateContact,
  cleanContact,
  type ContactInput
} from '../src/lib/validation';

/* Minimal shapes so this file needs no Vercel dependency. */
interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): void;
  setHeader?(name: string, value: string): void;
}

const MAX_BODY_BYTES = 16_384;

function env(name: string): string {
  return (process.env[name] ?? '').trim();
}

function header(req: VercelRequest, name: string): string {
  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function hostOf(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return '';
  }
}

function send(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).json(body);
}

function originAllowed(req: VercelRequest): boolean {
  const origin = header(req, 'origin');
  if (!origin) return true; // non-browser clients; other checks still apply

  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }

  if (
    host === 'localhost' ||
    host.startsWith('localhost:') ||
    host === '127.0.0.1' ||
    host.startsWith('127.0.0.1:')
  ) {
    return true;
  }

  const allowed = [
    hostOf(env('PUBLIC_SITE_URL')),
    env('VERCEL_URL'),
    hostOf(`https://${env('VERCEL_URL')}`),
    hostOf('https://your-project.vercel.app')
  ].filter(Boolean);

  return allowed.includes(host);
}

function escapeHtml(value: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return value.replace(/[&<>"']/g, (char) => map[char] ?? char);
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = env('TURNSTILE_SECRET_KEY');
  if (!secret) return true; // explicitly disabled
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== 'unknown') body.set('remoteip', ip);

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body }
    );
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

async function rateGate(ipHash: string): Promise<boolean> {
  const base = env('SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(`${base}/rest/v1/rpc/contact_rate_gate`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_ip_hash: ipHash,
      p_max: Number(env('RATE_MAX') || '3'),
      p_window_seconds: Number(env('RATE_WINDOW_SECONDS') || '600')
    })
  });
  if (!response.ok) throw new Error(`rate gate returned ${response.status}`);
  return (await response.json()) === true;
}

async function storeMessage(
  input: ContactInput,
  ipHash: string,
  verified: boolean
): Promise<string> {
  const base = env('SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const clean = cleanContact(input);

  const response = await fetch(`${base}/rest/v1/contact_messages`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
      name: clean.name,
      email: clean.email,
      message: clean.message,
      source: 'site',
      ip_hash: ipHash,
      verified_at: verified ? new Date().toISOString() : null
    })
  });
  if (!response.ok) throw new Error(`insert returned ${response.status}`);

  const rows = (await response.json()) as Array<{ id?: string }>;
  return rows[0]?.id ?? '';
}

async function notify(input: ContactInput, ipHash: string): Promise<void> {
  const clean = cleanContact(input);
  const payload = {
    from: env('CONTACT_FROM_EMAIL'),
    to: [env('CONTACT_TO_EMAIL')],
    reply_to: clean.email,
    subject: `New message via portfolio — ${clean.name}`,
    text: [
      `Name: ${clean.name}`,
      `Email: ${clean.email}`,
      '',
      clean.message,
      '',
      `Received: ${new Date().toISOString()}`,
      `IP hash: ${ipHash}`
    ].join('\n'),
    html: [
      `<p><strong>Name:</strong> ${escapeHtml(clean.name)}</p>`,
      `<p><strong>Email:</strong> ${escapeHtml(clean.email)}</p>`,
      `<p>${escapeHtml(clean.message).replace(/\n/g, '<br>')}</p>`,
      `<p><small>Received ${escapeHtml(new Date().toISOString())} · IP hash ${escapeHtml(ipHash)}</small></p>`
    ].join('')
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (response.ok) return;
    if (response.status < 500 && response.status !== 429) break;
  }
  throw new Error('resend delivery failed');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    if (req.method !== 'POST') {
      res.setHeader?.('Allow', 'POST');
      return send(res, 405, { ok: false, error: 'method' });
    }

    if (!header(req, 'content-type').toLowerCase().includes('application/json')) {
      return send(res, 400, { ok: false, error: 'validation', fields: {} });
    }

    let raw = req.body;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch {
        return send(res, 400, { ok: false, error: 'validation', fields: {} });
      }
    }

    let size = 0;
    try {
      size = Buffer.byteLength(JSON.stringify(raw ?? ''), 'utf8');
    } catch {
      return send(res, 413, { ok: false, error: 'too_large' });
    }
    if (size > MAX_BODY_BYTES) {
      return send(res, 413, { ok: false, error: 'too_large' });
    }

    const input = parseContactBody(raw);
    if (!input) {
      return send(res, 400, { ok: false, error: 'validation', fields: {} });
    }

    // Honeypot: appear to succeed, but do no work at all.
    if (input.website.trim() !== '') {
      return send(res, 200, { ok: true });
    }

    const errors = validateContact(input);
    if (Object.keys(errors).length > 0) {
      return send(res, 400, { ok: false, error: 'validation', fields: errors });
    }

    if (!originAllowed(req)) {
      return send(res, 403, { ok: false, error: 'bot' });
    }

    const required = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'RESEND_API_KEY',
      'CONTACT_TO_EMAIL',
      'CONTACT_FROM_EMAIL',
      'IP_HASH_SECRET'
    ];
    if (required.some((name) => !env(name))) {
      console.error('contact: missing server configuration');
      return send(res, 500, { ok: false, error: 'server' });
    }

    const forwarded = header(req, 'x-forwarded-for');
    const ip = (forwarded.split(',')[0] || header(req, 'x-real-ip') || 'unknown').trim();
    const ipHash = createHmac('sha256', env('IP_HASH_SECRET'))
      .update(ip)
      .digest('hex');

    const verified = await verifyTurnstile(input.cf_turnstile_token, ip);
    if (!verified) {
      return send(res, 403, { ok: false, error: 'bot' });
    }

    if (!(await rateGate(ipHash))) {
      const window = Number(env('RATE_WINDOW_SECONDS') || '600');
      return send(res, 429, {
        ok: false,
        error: 'rate_limited',
        retry_after: window
      });
    }

    const id = await storeMessage(input, ipHash, !!env('TURNSTILE_SECRET_KEY'));
    await notify(input, ipHash);

    return send(res, 200, { ok: true, id });
  } catch (error) {
    console.error(
      'contact handler failed:',
      error instanceof Error ? error.message : String(error)
    );
    return send(res, 500, { ok: false, error: 'server' });
  }
}
