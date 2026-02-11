export const runtime = 'edge';

export async function GET() {
  const envKeys = Object.keys(process.env).filter(k => !k.startsWith('npm_'));
  const hasDbUrl = !!process.env.DATABASE_URL;
  const hasAuthSecret = !!process.env.AUTH_SECRET;

  return Response.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: hasDbUrl ? '✅ set (' + process.env.DATABASE_URL!.substring(0, 20) + '...)' : '❌ missing',
      AUTH_SECRET: hasAuthSecret ? '✅ set' : '❌ missing',
      AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? '❌ missing',
      NODE_VERSION: process.env.NODE_VERSION ?? 'not set',
    },
    envKeyCount: envKeys.length,
    envKeys: envKeys.slice(0, 30),
  });
}
