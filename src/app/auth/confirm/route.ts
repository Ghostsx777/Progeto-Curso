import {NextRequest, NextResponse} from 'next/server';
import {database} from '@/lib/supabase';

export async function GET(request: NextRequest) {
 const params = request.nextUrl.searchParams;
 const tokenHash = params.get('token_hash');
 const type = params.get('type');
 const code = params.get('code');
 let destination = '/login?message=expired';

 if (tokenHash && (type === 'recovery' || type === 'signup' || type === 'invite')) {
  const db = await database();
  const {error} = await db.auth.verifyOtp({token_hash: tokenHash, type});
  if (!error) destination = type === 'recovery' ? '/nova-senha' : '/painel';
 } else if (code) {
  const db = await database();
  const {error} = await db.auth.exchangeCodeForSession(code);
  if (!error) destination = type === 'recovery' ? '/nova-senha' : '/painel';
 }

 const response = NextResponse.redirect(new URL(destination, request.url));
 response.headers.set('Cache-Control', 'private, no-store');
 response.headers.set('Referrer-Policy', 'no-referrer');
 return response;
}
