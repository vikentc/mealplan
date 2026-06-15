'use server';

import { cookies } from 'next/headers';

const VALID_USERS: Record<string, string> = {
  maja: 'Maja',
  kent: 'Kent',
};

export async function login(formData: FormData, redirectUrl?: string) {
  const username = formData.get('username')?.toString().trim().toLowerCase();
  const password = formData.get('password')?.toString();

  if (!username || !password) {
    return { error: 'Vänligen fyll i både användarnamn och lösenord.' };
  }

  const expectedPassword = VALID_USERS[username];
  if (expectedPassword && expectedPassword === password) {
    // Set cookie on the response
    const cookieStore = await cookies();
    cookieStore.set('user_session', username === 'maja' ? 'Maja' : 'Kent', {
      path: '/',
      httpOnly: false, // allows reading client-side for UI indicators
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return { success: true, redirectUrl: redirectUrl || '/' };
  }

  return { error: 'Felaktigt användarnamn eller lösenord.' };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('user_session');
  return { success: true };
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  return cookieStore.get('user_session')?.value || null;
}
