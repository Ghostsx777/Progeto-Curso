// Local maintenance only. Never expose this script through an application route.
import {randomBytes} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
process.loadEnvFile('.env.local');
const email=process.env.ADMIN_EMAIL;
const name=process.env.ADMIN_NAME;
const origin=process.env.OWNER_APP_URL;
if(!email||!name||!origin||new URL(origin).protocol!=='https:')throw new Error('Configure ADMIN_EMAIL, ADMIN_NAME e OWNER_APP_URL no ambiente privado.');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
try{
 const owners=await db.from('profiles').select('id,email').eq('role','admin');
 if(owners.error)throw new Error();
 if(owners.data.length){
  if(owners.data.length!==1||owners.data[0].email.toLowerCase()!==email.toLowerCase())throw new Error();
 }else{
  const password=randomBytes(48).toString('base64url');
  const created=await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:name},app_metadata:{bootstrap_owner:true}});
  if(created.error)throw new Error();
  const userDb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const login=await userDb.auth.signInWithPassword({email,password});
  if(login.error)throw new Error();
  const profile=await userDb.from('profiles').select('role').eq('id',login.data.user.id).single();
  await userDb.auth.signOut();
  if(profile.error||profile.data.role!=='admin')throw new Error();
  console.log('Proprietário criado; login real e função administrativa confirmados. Senha aleatória não armazenada.');
 }
 const link=await db.auth.admin.generateLink({type:'recovery',email});
 if(link.error||!link.data.properties.hashed_token)throw new Error();
 const url=new URL('/auth/confirm',origin);url.searchParams.set('token_hash',link.data.properties.hashed_token);url.searchParams.set('type','recovery');
 const safe=url.href.replaceAll('&','&amp;').replaceAll('"','&quot;');
 writeFileSync('.env.owner-access.html',`<!doctype html><meta charset="utf-8"><title>Definir senha — DevPath Academy</title><style>body{background:#07111f;color:#eee;font:18px system-ui;max-width:620px;margin:80px auto;padding:24px}a{display:inline-block;background:#24cde0;color:#07111f;padding:16px;border-radius:8px}p{line-height:1.6}</style><h1>Defina sua senha</h1><p>Este arquivo contém um acesso privado e temporário à sua conta. Não compartilhe. O link só pode ser usado uma vez.</p><a href="${safe}" rel="noreferrer">Definir minha senha na DevPath Academy</a><p>Após salvar a senha, entre na plataforma com seu email. Se o link expirar, gere um novo pelo procedimento local.</p>`,{mode:0o600});
 console.log('Link privado salvo em .env.owner-access.html (ignorado pelo Git). Nenhum email enviado.');
}catch{console.error('Inicialização incompleta. Verifique configuração, proprietário existente e estado Auth antes de repetir. Nenhum segredo exibido.');process.exitCode=1;}
