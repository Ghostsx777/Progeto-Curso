import {existsSync} from 'node:fs';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
const required=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','NEXT_PUBLIC_APP_URL'];
const valid=name=>Boolean(process.env[name]&&!/YOUR_|placeholder/i.test(process.env[name]));
const missing=required.filter(name=>!valid(name));
console.log(JSON.stringify({localEnvFile:existsSync('.env.local'),variables:Object.fromEntries(required.map(name=>[name,valid(name)?'configured':'missing'])),tutorEnabled:process.env.AI_TUTOR_ENABLED==='true'},null,2));
if(missing.length){console.log('Configuração incompleta. Não foi possível verificar Supabase real. Nenhum segredo foi exibido.');process.exitCode=1;}
else{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 if(!url.startsWith('https://'))throw new Error('Use HTTPS para o projeto Supabase.');
 const results=[];
 try{
   const auth=await fetch(`${url}/auth/v1/settings`,{headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY},signal:AbortSignal.timeout(15000)});
   const settings=auth.ok?await auth.json():{};
   results.push({check:'Auth reachable',ok:auth.ok},{check:'Public signup disabled',ok:settings.disable_signup===true});
   for(const table of ['profiles','invites','enrollments','tutor_requests']){
     const res=await fetch(`${url}/rest/v1/${table}?select=*&limit=0`,{headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`},signal:AbortSignal.timeout(15000)});
     results.push({check:`Schema: ${table}`,ok:res.ok,status:res.status});
   }
 }catch{results.push({check:'Network connection',ok:false});}
 console.log(JSON.stringify(results,null,2));
 console.log('Sondagem somente leitura. Não testa login, SMTP, concorrência ou isolamento entre sessões.');
 if(results.some(r=>!r.ok))process.exitCode=1;
}
