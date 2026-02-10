'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export interface AuthState {
  error?: string;
  success?: boolean;
}

export async function authenticate(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirectTo: '/exams',
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: '邮箱或密码错误' };
        default:
          return { error: '登录失败，请重试' };
      }
    }
    // NEXT_REDIRECT is not an error — rethrow to let Next.js handle the redirect
    throw error;
  }
}
