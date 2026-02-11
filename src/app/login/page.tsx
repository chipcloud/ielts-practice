import { LoginForm } from './login-form';

/**
 * Force this page to be dynamic and run in the Edge runtime.
 * This ensures that POST requests (Server Actions) are handled by the
 * Cloudflare Worker and not served as static assets (which return 405).
 */
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function LoginPage() {
  return <LoginForm />;
}
