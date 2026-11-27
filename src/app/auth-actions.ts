'use server';
import {cookies} from 'next/headers';
import {recoveryResult} from '@/lib/recovery-result';
import {z} from 'zod';
import {createHash} from 'node:crypto';
import {redirect} from 'next/navigation';
import {database,serviceDatabase,configured} from '@/lib/supabase';
import type {FormState} from '@/components/action-form';
import {invalidInviteMessage} from '@/lib/invites';
const email=z.string().trim().toLowerCase().pipe(z.email().max(254));const password=z.string().min(12).max(128);
export async function login(_:FormState,form:FormData):Promise<FormState>{
 if(!configured())return {error:'O proprietário ainda precisa configurar o Supabase.'};
 const parsed=z.object({email,password:z.string().min(1).max(128)}).safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:'Verifique o email e a senha.'};
 const db=await database();const {error}=await db.auth.signInWithPassword(parsed.data);
 if(error?.status===429)return {error:'Muitas tentativas. Aguarde alguns minutos antes de entrar.'};
 if(error?.code==='invalid_credentials')return {error:'Email ou senha incorretos. Confira o email da sua conta ou solicite a recuperação de senha.'};
 if(error)return {error:'O serviço de login está indisponível agora. Tente novamente em alguns minutos.'};
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
 const {data:invite,error:lookupError}=await db.from('invites').select('id,email,used_at,revoked_at,expires_at').eq('token_hash',hash).maybeSingle();
 if(lookupError)return {error:'Não foi possível validar o convite agora. Tente novamente.'};
 const invalid=invalidInviteMessage(invite);if(invalid)return {error:invalid};
 if(!invite||(invite.email&&invite.email.toLowerCase()!==input.email.toLowerCase()))return {error:'Este convite está associado a outro email.'};
 const {error}=await db.auth.admin.createUser({email:input.email,password:input.password,email_confirm:false,user_metadata:{full_name:input.full_name},app_metadata:{invite_hash:hash}});
 if(error){
   // Outro cadastro pode ter consumido/revogado o convite entre a prévia e o trigger.
   const {data:latest}=await db.from('invites').select('used_at,revoked_at,expires_at').eq('token_hash',hash).maybeSingle();
   return {error:invalidInviteMessage(latest)||'Não foi possível concluir o cadastro. Verifique os dados ou contacte o administrador.'};
 }
 // A confirmação de email é enviada pelo serviço Auth; nunca confirmar emails arbitrariamente.
 const userDb=await database();
 const {error:mailError}=await userDb.auth.resend({type:'signup',email:input.email,options:{emailRedirectTo:process.env.NEXT_PUBLIC_APP_URL+'/auth/confirm'}});
 return {success:mailError?'Conta criada. Contacte o administrador para reenviar a confirmação de email.':'Conta criada. Confirme o email recebido antes de entrar.'};
}
export async function recover(_:FormState,form:FormData):Promise<FormState>{
 if(!configured())return {error:'O proprietário ainda precisa configurar o Supabase.'};
 const parsed=email.safeParse(form.get('email'));if(!parsed.success)return {error:'Informe um email válido.'};
 const jar=await cookies();
 if(jar.has('recovery-wait'))return {error:'Você fez um pedido recente neste navegador. Confira o email ou aguarde um minuto para tentar novamente.'};
 // A rejected resend must preserve the verifier for the last email actually sent.
 const pendingCookies:Array<()=>void>=[];
 const db=await database(pendingCookies);
 const {error}=await db.auth.resetPasswordForEmail(parsed.data,{redirectTo:process.env.NEXT_PUBLIC_APP_URL+'/nova-senha'});
 if(!error)pendingCookies.forEach(apply=>apply());
 if(!error || error.status===429)jar.set('recovery-wait','1',{maxAge:60,httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/recuperar-senha'});
 return recoveryResult(error);
}
export async function openRecovery(_:FormState,form:FormData):Promise<FormState>{
 const hash=form.get('token_hash'),code=form.get('code');
 const db=await database();
 const proof=z.string().min(1).max(512).safeParse(hash||code);
 if(!proof.success)return {error:'Link inválido. Solicite uma nova recuperação.'};
 const exchange=hash?await db.auth.verifyOtp({type:'recovery',token_hash:proof.data}):await db.auth.exchangeCodeForSession(proof.data);
 if(exchange.error)return {error:'Link expirado, utilizado ou aberto em outro navegador. Solicite outro e abra o email mais recente no navegador em que fez o pedido.'};
 redirect('/nova-senha');
}
export async function changePassword(_:FormState,form:FormData):Promise<FormState>{
 const parsed=password.safeParse(form.get('password'));if(!parsed.success)return {error:'Utilize entre 12 e 128 caracteres.'};
 const db=await database();
 const {data:{user}}=await db.auth.getUser();if(!user)return {error:'O link expirou. Solicite uma nova recuperação.'};
 const {error}=await db.auth.updateUser({password:parsed.data});if(error?.code==='same_password')return {error:'Escolha uma senha diferente da anterior.'};if(error)return {error:'Não foi possível alterar a senha. Confira as regras de senha e tente novamente.'};
 await db.auth.signOut();redirect('/login?message=password');
}
