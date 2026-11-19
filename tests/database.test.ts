import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const db=new PGlite();
const admin='10000000-0000-0000-0000-000000000001',a='10000000-0000-0000-0000-000000000002',b='10000000-0000-0000-0000-000000000003';
const m1='20000000-0000-0000-0000-000000000001',m2='20000000-0000-0000-0000-000000000002',lesson='30000000-0000-0000-0000-000000000001';
const ids=['40000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000004'];
async function asUser<T extends Record<string,unknown> = Record<string,unknown>>(id:string,sql:string,params:unknown[]=[]){
 await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
 try{return await db.query<T>(sql,params);}finally{await db.exec('reset role');}
}
before(async()=>{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
 create table auth.users(id uuid primary key,email text,raw_app_meta_data jsonb default '{}',raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to public;`);
 for(const file of readdirSync(new URL('../supabase/migrations/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort()){
   // PGlite possui gen_random_uuid nativo; pgcrypto não é usado pelo código SQL.
   await db.exec(readFileSync(new URL('../supabase/migrations/'+file,import.meta.url),'utf8').replace('create extension if not exists pgcrypto;',''));
 }
 await db.query("insert into auth.users(id,email,raw_app_meta_data) values($1,'owner@example.invalid','{\"bootstrap_owner\":true}')",[admin]);
 for(const [index,id] of [a,b].entries()){
   await db.query("insert into public.invites(token_hash,created_by,expires_at) values($1,$2,now()+interval '1 day')",[String(index+1).repeat(64),admin]);
   await db.query('insert into auth.users(id,email,raw_app_meta_data) values($1,$2,$3)',[id,`student${index}@example.invalid`,JSON.stringify({invite_hash:String(index+1).repeat(64)})]);
 }
 await db.exec('update public.courses set published=true');
 const cid=(await db.query<{id:string}>('select id from public.courses')).rows[0].id;
 for(const uid of [a,b,admin])await asUser(uid,'select public.enroll_course($1)',[cid]);
 await db.query("insert into public.modules(id,course_id,slug,title,sort_order,published) select $1,id,'fundamentos','Fundamentos',1,true from public.courses",[m1]);
 await db.query("insert into public.modules(id,course_id,slug,title,sort_order,published) select $1,id,'javascript','JavaScript',2,true from public.courses",[m2]);
 await db.query("insert into public.lessons(id,module_id,title,sort_order,published) values($1,$2,'Primeira aula',1,true)",[lesson,m1]);
 await db.query("insert into public.lessons(module_id,title,sort_order,published) values($1,'Aula bloqueada',1,true)",[m2]);
 for(const [i,type] of ['exercise','quiz','project','exam'].entries()) await db.query('insert into public.activities(id,module_id,title,activity_type,sort_order,published) values($1,$2,$3,$3,$4,true)',[ids[i],m1,type,i]);
});
after(async()=>{await db.close();});
test('RLS isola perfis, progresso, notas e entregas; conteúdo futuro fica bloqueado',async()=>{
 const profiles=await asUser(a,'select id from public.profiles');assert.deepEqual(profiles.rows,[{id:a}]);
 const lessons=await asUser(a,'select id from public.lessons');assert.deepEqual(lessons.rows,[{id:lesson}]);
 await asUser(a,'select public.lesson_event($1,true,30)',[lesson]);
 await asUser(a,"select public.save_note($1,'Anotação privada')",[lesson]);
 assert.equal((await asUser(b,'select * from public.lesson_progress')).rows.length,0);
 assert.equal((await asUser(b,'select * from public.notes')).rows.length,0);
 await asUser(a,"select public.submit_activity($1,'Minha resposta completa',null)",[ids[0]]);
 assert.equal((await asUser(b,'select * from public.submissions')).rows.length,0);
});
test('aluno não promove conta, atribui nota nem desbloqueia módulos',async()=>{
 for(const sql of ["update public.profiles set role='admin'","update public.submissions set grade=100","delete from public.student_module_progress",`select public.recalculate_module('${a}','${m1}')`,`select public.admin_exception('${a}','unlock','${m2}','Tentativa indevida')`,`select public.create_invite('${'a'.repeat(64)}',7,null)`]) await assert.rejects(asUser(a,sql));
});
test('convites são consumidos atomicamente e não aceitam reutilização, expiração ou revogação',async()=>{
 await assert.rejects(db.query("insert into auth.users(id,email,raw_app_meta_data) values(gen_random_uuid(),'reuse@example.invalid',$1)",[JSON.stringify({invite_hash:'1'.repeat(64)})]));
 for(const [hash,expired,revoked] of [['3'.repeat(64),true,false],['4'.repeat(64),false,true]] as const){
   await db.query('insert into public.invites(token_hash,created_by,expires_at,revoked_at) values($1,$2,now()+make_interval(days=>$3),case when $4 then now() end)',[hash,admin,expired?-1:1,revoked]);
   await assert.rejects(db.query("insert into auth.users(id,email,raw_app_meta_data) values(gen_random_uuid(),'expired@example.invalid',$1)",[JSON.stringify({invite_hash:hash})]));
 }
 await assert.rejects(db.query("insert into auth.users(id,email) values(gen_random_uuid(),'public@example.invalid')"));
 await assert.rejects(db.query("insert into auth.users(id,email,raw_app_meta_data) values(gen_random_uuid(),'owner2@example.invalid','{\"bootstrap_owner\":true}')"));
});
test('entrega pendente não aprova; correção com todos os requisitos libera próximo módulo',async()=>{
 assert.equal((await asUser(a,'select public.can_access_module($1) as access',[m2])).rows[0]?.access,false);
 await assert.rejects(asUser(a,"select public.submit_activity($1,'Resposta duplicada',null)",[ids[0]]));
 for(let i=0;i<4;i++){
   if(i>0) await asUser(a,"select public.submit_activity($1,'Resposta para avaliação',null)",[ids[i]]);
   const sub=await db.query<{id:string}>('select id from public.submissions where student_id=$1 and activity_id=$2',[a,ids[i]]);
   await assert.rejects(asUser(a,"select public.grade_submission($1,100,'Autoaprovação indevida','approved')",[sub.rows[0].id]));
   await asUser(admin,"select public.grade_submission($1,80,'Requisitos cumpridos com qualidade.','approved')",[sub.rows[0].id]);
 }
 assert.equal((await asUser(a,'select public.can_access_module($1) as access',[m2])).rows[0]?.access,true);
 assert.equal(Number((await db.query<{final_grade:string}>('select final_grade from public.student_module_progress where student_id=$1 and module_id=$2',[a,m1])).rows[0].final_grade),80);
 assert.equal((await asUser(b,'select public.can_access_module($1) as access',[m2])).rows[0]?.access,false);
});
test('reprovação preserva tentativas; limite e concessão adicional são validados no banco',async()=>{
 await db.query('update public.activities set max_attempts=1 where id=$1',[ids[0]]);
 const sub=await asUser(b,"select public.submit_activity($1,'Resposta incompleta',null) as id",[ids[0]]);
 await asUser(admin,"select public.grade_submission($1,40,'Rever os fundamentos antes de tentar novamente.','failed')",[sub.rows[0].id]);
 await assert.rejects(asUser(b,"select public.submit_activity($1,'Nova tentativa completa',null)",[ids[0]]));
 await asUser(admin,"select public.admin_exception($1,'attempt',$2,'Concedida após revisão orientada.')",[b,ids[0]]);
 await asUser(b,"select public.submit_activity($1,'Nova tentativa completa',null)",[ids[0]]);
 assert.equal((await asUser(b,'select * from public.submissions')).rows.length,2);
});
test('bloqueio de conta impede leitura e mutações mesmo com sessão existente',async()=>{
 await asUser(admin,"select public.admin_exception($1,'block',null,'Bloqueio solicitado pelo proprietário.')",[b]);
 assert.equal((await asUser(b,'select * from public.lessons')).rows.length,0);
 assert.equal((await asUser(b,'select * from public.submissions')).rows.length,0);
 await assert.rejects(asUser(b,'select public.lesson_event($1,true,10)',[lesson]));
});
test('certificado não é emitido com formação incompleta',async()=>{
 const course=await db.query<{id:string}>('select id from public.courses');
 await assert.rejects(asUser(admin,'select public.issue_certificate($1,$2)',[a,course.rows[0].id]));
});

test('editor rejeita alterações de aluno e publicação sem conteúdo',async()=>{
 const course=(await db.query<{id:string}>('select id from public.courses')).rows[0].id;
 const module={id:'',course_id:course,title:'Módulo indevido',slug:'modulo-indevido',sort_order:9,pass_mark:70,published:false};
 await assert.rejects(asUser(a,'select public.save_content($1,$2)',['module',module]));
 await assert.rejects(asUser(admin,'select public.save_content($1,$2)',['lesson',{id:'',module_id:m2,title:'Aula sem conteúdo',sort_order:2,estimated_minutes:45,published:true,body_md:''}]));
 assert.equal((await db.query("select id from public.lessons where title='Aula sem conteúdo'")).rows.length,0);
});
test('editor cria/edita rascunhos, publica conteúdo e mantém auditoria',async()=>{
 const course=(await db.query<{id:string}>("insert into public.courses(slug,title,published) values('editor-test','Curso do editor',true) returning id")).rows[0].id;
 await asUser(a,'select public.enroll_course($1)',[course]);
 const payload={id:'',course_id:course,title:'Módulo de teste',slug:'editor-test',sort_order:1,pass_mark:70,published:false,description:'Descrição do curso',preview:'Objetivos'};
 const created=await asUser<{id:string}>(admin,'select public.save_content($1,$2) as id',['module',payload]);
 const mid=created.rows[0].id;
 const lessonPayload={id:'',module_id:mid,title:'Aula de teste',sort_order:1,estimated_minutes:45,required:true,published:false,body_md:'## Conteúdo\n\n'+('Explicação pedagógica detalhada. '.repeat(10))};
 const lessonCreated=await asUser<{id:string}>(admin,'select public.save_content($1,$2) as id',['lesson',lessonPayload]);
 await asUser(admin,'select public.save_content($1,$2)',['activity',{id:'',module_id:mid,title:'Exercício de teste',sort_order:1,activity_type:'exercise',max_attempts:3,required:true,published:true,instructions_md:'Implemente a solução e explique os testes que você executou.'}]);
 assert.equal((await asUser(a,'select id from public.lessons where module_id=$1',[mid])).rows.length,0);
 await asUser(admin,'select public.save_content($1,$2)',['lesson',{...lessonPayload,id:lessonCreated.rows[0].id,published:true}]);
 await asUser(admin,'select public.save_content($1,$2)',['module',{...payload,id:mid,published:true}]);
 assert.equal((await asUser(a,'select id from public.lessons where module_id=$1',[mid])).rows.length,1);
 const log=await asUser(admin,"select details from public.audit_log where target_id=$1 and action='content.updated'",[mid]);
 assert.equal(log.rows.length,1);
 assert.equal((await asUser(a,'select * from public.audit_log')).rows.length,0);
 const activity=(await db.query<{id:string}>('select id from public.activities where module_id=$1',[mid])).rows[0].id;
 await asUser(a,"select public.submit_activity($1,'Entrega antes de marcar aulas',null)",[activity]);
 await assert.rejects(asUser(admin,'select public.save_content($1,$2)',['module',{...payload,id:mid,published:true,pass_mark:90}]));
});
test('edição preserva critérios e dados de cursos já utilizados',async()=>{
 const module=(await db.query<Record<string,unknown>>('select * from public.modules where id=$1',[m1])).rows[0];
 await assert.rejects(asUser(admin,'select public.save_content($1,$2)',['module',{...module,pass_mark:90}]));
 await assert.rejects(asUser(admin,'select public.save_content($1,$2)',['module',{...module,sort_order:10}]));
 const l=(await db.query<Record<string,unknown>>('select * from public.lessons where id=$1',[lesson])).rows[0];
 await assert.rejects(asUser(admin,'select public.save_content($1,$2)',['lesson',{...l,required:false,body_md:'Conteúdo didático '.repeat(20)}]));
 await asUser(admin,'select public.save_content($1,$2)',['lesson',{...l,body_md:'Explicação corrigida e revisada. '.repeat(20)}]);
 assert.equal((await asUser(a,'select * from public.lesson_progress where lesson_id=$1',[lesson])).rows.length,1);
 assert.equal(Number((await db.query<{final_grade:string}>('select final_grade from public.student_module_progress where student_id=$1 and module_id=$2',[a,m1])).rows[0].final_grade),80);
});

test('convite armazena data/hora exata e só administrador pode criá-lo',async()=>{
 const deadline='2099-11-20T15:37:00.000Z';
 await assert.rejects(asUser(a,'select public.create_invite_at($1,$2,null)',['5'.repeat(64),deadline]));
 const created=await asUser<{id:string}>(admin,'select public.create_invite_at($1,$2,$3) as id',['5'.repeat(64),deadline,'Student@Test.Invalid']);
 const row=(await db.query<{expires_at:Date|string;email:string}>('select expires_at,email from public.invites where id=$1',[created.rows[0].id])).rows[0];
 assert.equal(new Date(row.expires_at).toISOString(),deadline);
 assert.equal(row.email,'student@test.invalid');
 await assert.rejects(asUser(admin,'select public.create_invite_at($1,$2,null)',['6'.repeat(64),'2000-01-01T00:00:00Z']));
 await assert.rejects(asUser(admin,"select public.create_invite_at($1,'infinity',null)",['6'.repeat(64)]));
});
test('falha após criação de perfil e consumo reverte conta, convite e auditoria',async()=>{
 const hash='7'.repeat(64),uid='10000000-0000-0000-0000-000000000077';
 const created=await asUser<{id:string}>(admin,'select public.create_invite_at($1,$2,null) as id',[hash,'2099-11-20T15:37:00Z']);
 await assert.rejects(db.transaction(async tx=>{
   await tx.query("insert into auth.users(id,email,raw_app_meta_data) values($1,'rollback@example.invalid',$2)",[uid,JSON.stringify({invite_hash:hash})]);
   await tx.exec('set constraints auth.private_signup immediate');
   // Força o trigger antes de simular uma falha posterior, ainda sem COMMIT.
   const inside=await tx.query<{used_by:string}>('select used_by from public.invites where id=$1',[created.rows[0].id]);
   assert.equal(inside.rows[0].used_by,uid);
   throw new Error('Simulação de falha do cadastro antes do COMMIT');
 }));
 assert.equal((await db.query('select id from auth.users where id=$1',[uid])).rows.length,0);
 assert.equal((await db.query('select id from public.profiles where id=$1',[uid])).rows.length,0);
 const reverted=(await db.query('select used_at,used_by from public.invites where id=$1',[created.rows[0].id])).rows[0];
 assert.deepEqual(reverted,{used_at:null,used_by:null});
 assert.equal((await db.query("select id from public.audit_log where action='invite.accepted' and target_id=$1",[created.rows[0].id])).rows.length,0);
 await db.query("insert into auth.users(id,email,raw_app_meta_data) values($1,'retry@example.invalid',$2)",[uid,JSON.stringify({invite_hash:hash})]);
 await assert.rejects(db.query("insert into auth.users(id,email,raw_app_meta_data) values(gen_random_uuid(),'second@example.invalid',$1)",[JSON.stringify({invite_hash:hash})]));
 const consumed=(await db.query<{used_by:string}>('select used_by from public.invites where id=$1',[created.rows[0].id])).rows[0];
 assert.equal(consumed.used_by,uid);
 await assert.rejects(db.query('update public.invites set used_at=null,used_by=null where id=$1',[created.rows[0].id]));
});
test('revogação é imediata e permanente, sem alterar registro ao repetir',async()=>{
 const hash='8'.repeat(64);
 const created=await asUser<{id:string}>(admin,'select public.create_invite_at($1,$2,null) as id',[hash,'2099-11-20T15:37:00Z']);
 await asUser(admin,'select public.revoke_invite($1)',[created.rows[0].id]);
 await asUser(admin,'select public.revoke_invite($1)',[created.rows[0].id]);
 await assert.rejects(db.query("insert into auth.users(id,email,raw_app_meta_data) values(gen_random_uuid(),'revoked@example.invalid',$1)",[JSON.stringify({invite_hash:hash})]));
 await assert.rejects(db.query('update public.invites set revoked_at=null where id=$1',[created.rows[0].id]));
 assert.equal((await db.query("select id from public.audit_log where action='invite.revoked' and target_id=$1",[created.rows[0].id])).rows.length,1);
});
test('prazo é reavaliado no instante de consumo mesmo numa transação já iniciada',async()=>{
 await assert.rejects(db.transaction(async tx=>{
   await tx.query("insert into public.invites(token_hash,created_by,expires_at) values($1,$2,clock_timestamp())",['9'.repeat(64),admin]);
   await tx.query("insert into auth.users(id,email,raw_app_meta_data) values(gen_random_uuid(),'deadline@example.invalid',$1)",[JSON.stringify({invite_hash:'9'.repeat(64)})]);
 }));
});

test('administrador estuda com matrícula e progressão, sem corrigir a própria entrega',async()=>{
 assert.equal((await asUser(admin,'select public.can_study_module($1) as access',[m1])).rows[0].access,true);
 assert.equal((await asUser(admin,'select public.can_study_module($1) as access',[m2])).rows[0].access,false);
 const lockedLesson=(await db.query<{id:string}>('select id from public.lessons where module_id=$1',[m2])).rows[0].id;
 await assert.rejects(asUser(admin,'select public.lesson_event($1,true,30)',[lockedLesson]));
 const sub=await asUser<{id:string}>(admin,"select public.submit_activity($1,'Minha entrega como estudante',null) as id",[ids[1]]);
 await assert.rejects(asUser(admin,"select public.grade_submission($1,100,'Tentativa de autoaprovação','approved')",[sub.rows[0].id]));
 assert.equal((await db.query<{grade:null}>('select grade from public.submissions where id=$1',[sub.rows[0].id])).rows[0].grade,null);
});
test('matrículas são isoladas e não concedem acesso a cursos sem inscrição',async()=>{
 const course=(await db.query<{id:string}>("insert into public.courses(slug,title,published) values('separate','Outra formação',true) returning id")).rows[0].id;
 const mid=(await db.query<{id:string}>("insert into public.modules(course_id,slug,title,sort_order,published) values($1,'separate-module','Outro módulo',1,true) returning id",[course])).rows[0].id;
 assert.equal((await asUser(a,'select public.can_study_module($1) as access',[mid])).rows[0].access,false);
 await asUser(a,'select public.enroll_course($1)',[course]);
 await asUser(a,'select public.enroll_course($1)',[course]);
 assert.equal((await asUser(a,'select public.can_study_module($1) as access',[mid])).rows[0].access,true);
 assert.equal((await asUser(a,'select * from public.enrollments where student_id=$1',[admin])).rows.length,0);
 await db.query("update public.enrollments set status='suspended' where student_id=$1 and course_id=$2",[a,course]);
 assert.equal((await asUser(a,'select public.can_study_module($1) as access',[mid])).rows[0].access,false);
 await assert.rejects(asUser(a,'select public.enroll_course($1)',[course]));
});

test('tutor mantém conversas privadas e somente serviço grava respostas',async()=>{
 const reserved=await asUser<{id:string}>(a,"select public.reserve_tutor($1,'Explique a entrada e saída de um algoritmo.') as id",[lesson]);
 assert.equal((await asUser(b,'select * from public.tutor_messages')).rows.length,0);
 assert.equal((await asUser(admin,'select * from public.tutor_messages')).rows.length,0);
 await assert.rejects(asUser(a,"select public.finish_tutor($1,'Resposta forjada',1,1)",[reserved.rows[0].id]));
 await db.exec('set role service_role');
 try{await db.query("select public.finish_tutor($1,'Entrada são os dados; saída é o resultado produzido.',20,15)",[reserved.rows[0].id]);}finally{await db.exec('reset role');}
 assert.equal((await asUser(a,'select * from public.tutor_messages')).rows.length,2);
 assert.equal((await asUser(b,'select * from public.tutor_messages')).rows.length,0);
 await assert.rejects(asUser(a,"select public.reserve_tutor($1,'Outra pergunta imediatamente')",[lesson]),/Aguarde/);
});
test('tutor recusa aulas bloqueadas e impõe cota diária persistente',async()=>{
 const locked=(await db.query<{id:string}>('select id from public.lessons where module_id=$1',[m2])).rows[0].id;
 await assert.rejects(asUser(admin,"select public.reserve_tutor($1,'Não deveria acessar o conteúdo futuro')",[locked]),/indisponível/);
 // A cota é mantida no banco, não na memória de uma instância de hospedagem.
 await db.query("update public.tutor_requests set created_at=now()-interval '1 hour' where student_id=$1",[a]);
 const existing=Number((await db.query<{n:string}>('select count(*) n from public.tutor_requests where student_id=$1',[a])).rows[0].n);
 await db.query("insert into public.tutor_requests(student_id,lesson_id,created_at,status) select $1,$2,now()-interval '1 hour','failed' from generate_series(1,$3)",[a,lesson,20-existing]);
 // Normaliza para o dia atual sem atingir o intervalo de 10 segundos.
 await db.query("update public.tutor_requests set created_at=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC' where student_id=$1",[a]);
 await assert.rejects(asUser(a,"select public.reserve_tutor($1,'Pergunta acima do limite diário')",[lesson]),/Limite diário/);
});
test('capacidade permite dez contas incluindo proprietário e rejeita a décima primeira sem consumir convite',async()=>{
 const count=Number((await db.query<{n:string}>('select count(*) n from public.profiles')).rows[0].n);
 let lastHash='';
 await assert.rejects(db.transaction(async tx=>{
   await tx.exec('set constraints auth.private_signup immediate');
   for(let i=count;i<=10;i++){
     const hash=(100+i).toString(16).padStart(64,'0');lastHash=hash;
     await tx.query("insert into public.invites(token_hash,created_by,expires_at) values($1,$2,now()+interval '1 day')",[hash,admin]);
     await tx.query('insert into auth.users(id,email,raw_app_meta_data) values(gen_random_uuid(),$1,$2)',[`capacity${i}@example.invalid`,JSON.stringify({invite_hash:hash})]);
     assert.equal(Number((await tx.query<{n:string}>('select count(*) n from public.profiles')).rows[0].n),i+1);
   }
 }),/limite de 10 contas/);
 assert.equal(Number((await db.query<{n:string}>('select count(*) n from public.profiles')).rows[0].n),count);
 assert.equal((await db.query('select id from public.invites where token_hash=$1',[lastHash])).rows.length,0);
});

test('catálogo abre matrículas explicitamente e rejeita publicação por aluno',async()=>{
 const cid=(await db.query<{id:string}>("select id from public.courses where slug='full-stack-90'")).rows[0].id;
 await assert.rejects(asUser(a,'select public.set_course_publication($1,false)',[cid]));
 await asUser(admin,'select public.set_course_publication($1,false)',[cid]);
 await assert.rejects(asUser(a,'select public.enroll_course($1)',[cid]));
 assert.equal((await asUser(a,'select public.can_study_module($1) as access',[m1])).rows[0].access,true);
 await asUser(admin,'select public.set_course_publication($1,true)',[cid]);
 await asUser(a,'select public.enroll_course($1)',[cid]);
});
