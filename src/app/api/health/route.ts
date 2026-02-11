export const runtime = 'edge';

export async function GET() {
  try {
    const hasProcess = typeof process !== 'undefined';
    const hasEnv = hasProcess && typeof process.env !== 'undefined';
    const envKeys = hasEnv ? Object.keys(process.env).filter(k => !k.startsWith('npm_')) : [];
    const dbUrl = hasEnv ? process.env.DATABASE_URL : undefined;
    const authSecret = hasEnv ? process.env.AUTH_SECRET : undefined;

    return new Response(JSON.stringify({
      ok: true,
      timestamp: new Date().toISOString(),
      hasProcess,
      hasEnv,
      envKeyCount: envKeys.length,
      envKeys: envKeys.slice(0, 30),
      DATABASE_URL: dbUrl ? 'SET:' + dbUrl.substring(0, 25) + '...' : 'MISSING',
      AUTH_SECRET: authSecret ? 'SET' : 'MISSING',
    }, null, 2), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({
      ok: false,
      error: err?.message ?? String(err),
      stack: err?.stack?.substring(0, 500),
    }, null, 2), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
