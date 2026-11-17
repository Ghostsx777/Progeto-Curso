import {readFileSync} from 'node:fs';
import {randomUUID,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
import {Client} from 'pg';

// Integration check against real PostgreSQL. Every fixture is rolled back.
process.loadEnvFile('.env.local');
const url=new URL(process.env.SUPABASE_DB_URL);
const project=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
assert.equal(url.hostname,`db.${project}.supabase.co`);
const db=new Client({host:url.hostname,port:Number(url.port||5432),database:'postgres',user:decodeURIComponent(url.username),password:decodeURIComponent(url.password),ssl:{rejectUnauthorized:true,ca:readFileSync(process.env.SUPABASE_DB_CA_FILE,'utf8')},connectionTimeoutMillis:15000,query_timeout:30000});
let begun=false;
async function asUser(id,sql,params=[]){
 await db.query('set local role authenticated');
 await db.query("select set_config('request.jwt.claim.sub',$1,true)",[id]);
 return db.query(sql,params);
}
async function denied(operation){
 await db.query('savepoint denied_operation');
 let rejected=false;
 try{await operation();}catch{rejected=true;}
 await db.query('rollback to savepoint denied_operation');
 assert.equal(rejected,true,'Unauthorized operation must fail');
}
try{
 await db.connect();await db.query('begin');begun=true;
 await db.query("set local lock_timeout='5s'");
 const owner=await db.query("select id from public.profiles where role='admin'");
 if(owner.rowCount)throw new Error('Run this bootstrap verification before creating the real owner.');
 const admin=randomUUID(),a=randomUUID(),b=randomUUID();
 await db.query("insert into auth.users(id,email,raw_app_meta_data) values($1,'test-owner@example.invalid','{\"bootstrap_owner\":true}')",[admin]);
 const hashes=[];
 for(const id of [a,b]){
  const hash=randomBytes(32).toString('hex');hashes.push(hash);
  await db.query("insert into public.invites(token_hash,created_by,expires_at) values($1,$2,now()+interval '1 day')",[hash,admin]);
  await db.query('insert into auth.users(id,email,raw_app_meta_data) values($1,$2,$3)',[id,`${id}@example.invalid`,JSON.stringify({invite_hash:hash})]);
 }
 await denied(()=>db.query('insert into auth.users(id,email,raw_app_meta_data) values($1,$2,$3)',[randomUUID(),'reuse@example.invalid',JSON.stringify({invite_hash:hashes[0]})]));
 await denied(()=>db.query("insert into auth.users(id,email) values($1,'no-invite@example.invalid')",[randomUUID()]));
 assert.equal((await asUser(a,'select id from public.profiles')).rows[0].id,a);
 assert.equal((await asUser(a,'select id from public.profiles')).rowCount,1);
 await denied(()=>asUser(a,"update public.profiles set role='admin' where id=$1",[a]));
 await denied(()=>asUser(a,'update public.submissions set grade=100'));
 await db.query('reset role');
 const course=randomUUID(),module=randomUUID(),lesson=randomUUID();
 await db.query("insert into public.courses(id,slug,title,published) values($1,$2,'Teste transacional',true)",[course,`test-${course}`]);
 await db.query("insert into public.modules(id,course_id,slug,title,sort_order,published) values($1,$2,$3,'Teste',1,true)",[module,course,`test-${module}`]);
 await db.query("insert into public.lessons(id,module_id,title,sort_order,published) values($1,$2,'Teste',1,true)",[lesson,module]);
 for(const id of [a,b])await asUser(id,'select public.enroll_course($1)',[course]);
 await asUser(a,'select public.lesson_event($1,true,30)',[lesson]);
 await asUser(a,"select public.save_note($1,'Nota privada de teste')",[lesson]);
 assert.equal((await asUser(b,'select * from public.lesson_progress where lesson_id=$1',[lesson])).rowCount,0);
 assert.equal((await asUser(b,'select * from public.notes where lesson_id=$1',[lesson])).rowCount,0);
 assert.equal((await asUser(a,'select * from public.lesson_progress where lesson_id=$1',[lesson])).rowCount,1);
 await db.query('rollback');begun=false;
 assert.equal((await db.query('select id from auth.users where id=any($1::uuid[])',[[admin,a,b]])).rowCount,0);
 console.log('PASS: Supabase PostgreSQL real — convite único, cadastro privado, isolamento de perfis/anotações/progresso, bloqueio de autoatribuição de função e nota. ROLLBACK confirmado; nenhuma conta de teste persistida.');
}catch(error){
 console.error(JSON.stringify({ok:false,code:/^[0-9A-Z]{5}$/.test(String(error?.code))?error.code:'REMOTE_VERIFICATION_FAILED'}));process.exitCode=1;
}finally{if(begun)await db.query('rollback').catch(()=>{});await db.end();}
