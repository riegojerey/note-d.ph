// Project files (source, migrations, scripts, config) are not part of the website.
export function onRequest(context) {
  if (!new URL(context.request.url).pathname.startsWith('/api/')) {
    return new Response('Not found', { status: 404 });
  }
  return context.next();
}
