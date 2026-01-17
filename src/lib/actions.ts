'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
  prevState: { message: string; inputs?: { email: string } } | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      const email = formData.get('email') as string;
      switch (error.type) {
        case 'CredentialsSignin':
          return { message: 'Invalid credentials.', inputs: { email } };
        default:
          return { message: 'Something went wrong.', inputs: { email } };
      }
    }
    throw error;
  }
}
