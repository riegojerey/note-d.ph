import { error, getSessionUser, HttpError } from '../_lib.js';

const PUBLIC = ['/api/auth/login', '/api/public/'];

// Every /api route needs a logged-in user, except login and the public catalog.
export async function onRequest(context) {
  const { request, env, data } = context;
  const path = new URL(request.url).pathname;
  try {
    if (!env.DB) return error('Database is not connected. Add the D1 binding named DB in Cloudflare Pages settings.', 500);
    if (!PUBLIC.some((p) => path === p || (p.endsWith('/') && path.startsWith(p)))) {
      const user = await getSessionUser(env.DB, request);
      if (!user) return error('Please log in.', 401);
      data.user = user;
    }
    return await context.next();
  } catch (e) {
    if (e instanceof HttpError) return error(e.message, e.status);
    console.error(e);
    return error('Something went wrong on the server. Try again.', 500);
  }
}
