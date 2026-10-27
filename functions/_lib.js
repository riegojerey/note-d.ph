// Shared helpers for the admin API (Cloudflare Pages Functions + D1).

export const SESSION_COOKIE = 'noted_session';
const SESSION_DAYS = 7;
const PBKDF2_ITERATIONS = 100000; // Workers' maximum

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function error(message, status = 400) {
  return json({ error: message }, status);
}

export async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) {
    throw new HttpError('Send the request as JSON.', 415);
  }
  try {
    return await request.json();
  } catch {
    throw new HttpError('The request body is not valid JSON.');
  }
}

export class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// ---- validation ---------------------------------------------------------

export function str(v, field, { max = 200, required = false } = {}) {
  const s = typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
  if (required && !s) throw new HttpError(`${field} is required.`);
  if (s.length > max) throw new HttpError(`${field} must be ${max} characters or fewer.`);
  return s;
}

export function int(v, field, { min = -1e9, max = 1e9 } = {}) {
  const n = Number(v);
  if (!Number.isInteger(n)) throw new HttpError(`${field} must be a whole number.`);
  if (n < min || n > max) throw new HttpError(`${field} must be between ${min} and ${max}.`);
  return n;
}

export function date(v, field = 'Date') {
  const s = str(v, field, { required: true, max: 10 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) throw new HttpError(`${field} must look like 2026-10-27.`);
  return s;
}

// ---- settings -----------------------------------------------------------

export async function getSettings(db) {
  const { results } = await db.prepare('SELECT key, value FROM settings').all();
  const map = Object.fromEntries(results.map((r) => [r.key, r.value]));
  return {
    sizes: JSON.parse(map.sizes || '{}'),
    low_stock: Number(map.low_stock || 3),
    show_stock: map.show_stock === '1',
  };
}

// ---- passwords ----------------------------------------------------------

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64(salt)}$${b64(bits)}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, iter, salt, hash] = String(stored).split('$');
  if (scheme !== 'pbkdf2') return false;
  const bits = new Uint8Array(await pbkdf2(password, unb64(salt), Number(iter)));
  const expected = unb64(hash);
  if (bits.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ expected[i];
  return diff === 0;
}

// ---- sessions -----------------------------------------------------------

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createSession(db, userId) {
  const token = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const expires = Date.now() + SESSION_DAYS * 864e5;
  await db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(Date.now()).run();
  await db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(await sha256(token), userId, expires).run();
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_DAYS * 86400}`;
}

export function readSessionToken(request) {
  const cookie = request.headers.get('cookie') || '';
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([a-f0-9]{64})`));
  return m ? m[1] : null;
}

export async function getSessionUser(db, request) {
  const token = readSessionToken(request);
  if (!token) return null;
  return db
    .prepare('SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?')
    .bind(await sha256(token), Date.now())
    .first();
}

export async function destroySession(db, request) {
  const token = readSessionToken(request);
  if (token) await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}
