import {NextRequest,NextResponse} from 'next/server';
import {database} from '@/lib/supabase';
export async function GET(request:NextRequest){
 const token_hash=request.nextUrl.searchParams.get('token_hash');const type=request.nextUrl.searchParams.get('type');
 if(token_hash&&(type==='recovery'||type==='signup'||type==='invite')){
   const db=await database();const {error}=await db.auth.verifyOtp({token_hash,type});
   if(!error)return NextResponse.redirect(new URL(type==='recovery'?'/nova-senha':'/painel',request.url));
 }
 return NextResponse.redirect(new URL('/login?message=expired',request.url));
}
