import {NextRequest, NextResponse} from 'next/server';
import {database} from '@/lib/supabase';

export async function GET(request: NextRequest) {
 const params = request.nextUrl.searchParams;
 const tokenHash = params.get('token_hash');
 const type = params.get('type');
 const code = params.get('code');
 let destination = '/login?message=expired';

 if (type === 'recovery' && (tokenHash || code)) {
  const next = new URLSearchParams(tokenHash ? {token_hash:tokenHash} : {code:code!});
  destination = '/nova-senha?' + next;
 } else if (tokenHash && (type === 'signup' || type === 'invite')) {
  const db = await database();
  const {error} = await db.auth.verifyOtp({token_hash: tokenHash, type});
  if (!error) destination = '/painel';
 } else if (code) {
  const db = await database();
  const {error} = await db.auth.exchangeCodeForSession(code);
  if (!error) destination = '/painel';
 }

 const response = NextResponse.redirect(new URL(destination, request.url));
 response.headers.set('Cache-Control', 'private, no-store');
 response.headers.set('Referrer-Policy', 'no-referrer');
 return response;
}
