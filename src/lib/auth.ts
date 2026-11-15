import 'server-only';
import {redirect} from 'next/navigation';
import {configured,database} from './supabase';
export async function requireUser(admin=false){
 if(!configured()) redirect('/login?message=configure');
 const db=await database();const {data:{user},error}=await db.auth.getUser();
 if(error||!user) redirect('/login');
 const {data:profile}=await db.from('profiles').select('*').eq('id',user.id).single();
 if(!profile||profile.blocked) redirect('/login?message=blocked');
 if(admin&&profile.role!=='admin') redirect('/painel');
 return {db,user,profile};
}
