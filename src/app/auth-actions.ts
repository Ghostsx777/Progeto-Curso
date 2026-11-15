'use server';
import {z} from 'zod';
import {createHash} from 'node:crypto';
import {redirect} from 'next/navigation';
import {database,serviceDatabase,configured} from '@/lib/supabase';
import type {FormState} from '@/components/action-form';
const email=z.email().max(254);const password=z.string().min(12).max(128);
export async function login(_:FormState,form:FormData):Promise<FormState>{
 if(!configured())return {error:'O proprietário ainda precisa configurar o Supabase.'};
 const parsed=z.object({email,password:z.string().min(1).max(128)}).safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:'Verifique o email e a senha.'};
 const db=await database();const {error}=await db.auth.signInWithPassword(parsed.data);
 if(error)return {error:'Não foi possível entrar. Verifique os dados ou aguarde antes de tentar novamente.'};
 redirect('/painel');
}
export async function logout(){const db=await database();await db.auth.signOut();redirect('/login');}
export async function register(_:FormState,form:FormData):Promise<FormState>{
 if(!configured())return {error:'O proprietário ainda precisa configurar o Supabase.'};
 const parsed=z.object({email,password,full_name:z.string().trim().min(3).max(120),token:z.string().regex(/^[a-f0-9]{64}$/)}).safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:'Preencha o nome, email e uma senha de pelo menos 12 caracteres. O convite deve ser válido.'};
 const input=parsed.data;const hash=createHash('sha256').update(input.token).digest('hex');
 const db=serviceDatabase();
 // A verificação prévia evita chamadas Auth inúteis. O trigger repete a validação sob lock.
 const {data:invite}=await db.from('invites').select('id,email').eq('token_hash',hash).is('used_at',null).is('revoked_at',null).gt('expires_at',new Date().toISOString()).maybeSingle();
 if(!invite||(invite.email&&invite.email.toLowerCase()!==input.email.toLowerCase()))return {error:'Convite inválido, expirado, utilizado ou associado a outro email.'};
 const {error}=await db.auth.admin.createUser({email:input.email,password:input.password,email_confirm:false,user_metadata:{full_name:input.full_name},app_metadata:{invite_hash:hash}});
 if(error)return {error:'Não foi possível concluir o cadastro. Verifique o convite e contacte o administrador.'};
 // A confirmação de email é enviada pelo serviço Auth; nunca confirmar emails arbitrariamente.
 const userDb=await database();
 const {error:mailError}=await userDb.auth.resend({type:'signup',email:input.email,options:{emailRedirectTo:process.env.NEXT_PUBLIC_APP_URL+'/auth/confirm'}});
 return {success:mailError?'Conta criada. Contacte o administrador para reenviar a confirmação de email.':'Conta criada. Confirme o email recebido antes de entrar.'};
}
export async function recover(_:FormState,form:FormData):Promise<FormState>{
 if(!configured())return {error:'O proprietário ainda precisa configurar o Supabase.'};
 const parsed=email.safeParse(form.get('email'));if(!parsed.success)return {error:'Informe um email válido.'};
 const db=await database();await db.auth.resetPasswordForEmail(parsed.data,{redirectTo:process.env.NEXT_PUBLIC_APP_URL+'/nova-senha'});
 return {success:'Se a conta existir, receberá as instruções de recuperação por email.'};
}
export async function changePassword(_:FormState,form:FormData):Promise<FormState>{
 const parsed=password.safeParse(form.get('password'));if(!parsed.success)return {error:'Utilize entre 12 e 128 caracteres.'};
 const db=await database();const {data:{user}}=await db.auth.getUser();if(!user)return {error:'O link expirou. Solicite uma nova recuperação.'};
 const {error}=await db.auth.updateUser({password:parsed.data});if(error)return {error:'Não foi possível alterar a senha.'};
 await db.auth.signOut();redirect('/login?message=password');
}
