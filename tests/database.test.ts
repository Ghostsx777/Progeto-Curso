import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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
 for(const file of ['001_initial_schema.sql','002_security_hardening.sql','003_functional_core.sql','004_content_management.sql']){
   // PGlite possui gen_random_uuid nativo; pgcrypto não é usado pelo código SQL.
   await db.exec(readFileSync(new URL('../supabase/migrations/'+file,import.meta.url),'utf8').replace('create extension if not exists pgcrypto;',''));
 }
 await db.query("insert into auth.users(id,email,raw_app_meta_data) values($1,'owner@example.invalid','{\"bootstrap_owner\":true}')",[admin]);
 for(const [index,id] of [a,b].entries()){
   await db.query("insert into public.invites(token_hash,created_by,expires_at) values($1,$2,now()+interval '1 day')",[String(index+1).repeat(64),admin]);
   await db.query('insert into auth.users(id,email,raw_app_meta_data) values($1,$2,$3)',[id,`student${index}@example.invalid`,JSON.stringify({invite_hash:String(index+1).repeat(64)})]);
 }
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
 const course=(await db.query<{id:string}>("insert into public.courses(slug,title) values('editor-test','Curso do editor') returning id")).rows[0].id;
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
