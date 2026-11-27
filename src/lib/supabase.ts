import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {createClient} from '@supabase/supabase-js';
import {cookies} from 'next/headers';
export function configured(){return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);}
export async function database(afterAccepted?:Array<()=>void>){
 if(!configured()) throw new Error('Configure o Supabase no arquivo .env.local.');
 const jar=await cookies();
 return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll:()=>jar.getAll(),setAll:values=>{const apply=()=>values.forEach(({name,value,options})=>jar.set(name,value,options));if(afterAccepted){afterAccepted.push(apply);return}try{apply();}catch{/* Server Components: proxy atualiza cookies. */}}}});
}
export function serviceDatabase(){
 if(!configured()||!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Configuração do servidor incompleta.');
 return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}
