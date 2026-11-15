import {createClient} from '@supabase/supabase-js';
// Credenciais fornecidas pelo ambiente, nunca argumentos da linha de comando.
const {NEXT_PUBLIC_SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,ADMIN_EMAIL,ADMIN_PASSWORD,ADMIN_NAME}=process.env;
if(!NEXT_PUBLIC_SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY||!ADMIN_EMAIL||!ADMIN_PASSWORD||!ADMIN_NAME)throw new Error('Defina o Supabase e ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME no ambiente privado.');
if(ADMIN_PASSWORD.length<12)throw new Error('A senha administrativa precisa de pelo menos 12 caracteres.');
const db=createClient(NEXT_PUBLIC_SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const {error}=await db.auth.admin.createUser({email:ADMIN_EMAIL,password:ADMIN_PASSWORD,email_confirm:true,user_metadata:{full_name:ADMIN_NAME},app_metadata:{bootstrap_owner:true}});
if(error){console.error('Não foi possível inicializar. Confirme as migrações, configuração e se já existe um administrador.');process.exitCode=1;}else console.log('Administrador criado. Remova ADMIN_PASSWORD do ambiente e configure MFA antes de produção.');
