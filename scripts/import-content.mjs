import {existsSync} from 'node:fs';import {createClient} from '@supabase/supabase-js';import {loadContent} from './content-library.mjs';
const {manifest,lessons}=loadContent();
console.log(JSON.stringify({status:manifest.status,lessons:lessons.map(l=>({title:l.title,minutes:l.estimated_minutes,words:l.words})),plannedHours:manifest.planned_hours,authoredHours:lessons.reduce((sum,l)=>sum+l.estimated_minutes,0)/60},null,2));
if(process.argv.includes('--dry-run'))process.exit(0);
if(!process.argv.includes('--apply'))throw new Error('Use --dry-run para auditar ou --apply para importar rascunhos.');
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Configure o Supabase no ambiente privado.');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const fail=error=>{if(error)throw new Error('Falha no banco. Confira migrações, permissões e conflitos de identificador; nenhum conteúdo existente será sobrescrito.');};
const course=await db.from('courses').select('id').eq('slug',manifest.course_slug).single();fail(course.error);
let module=await db.from('modules').select('*').eq('slug',manifest.module.slug).maybeSingle();fail(module.error);
if(module.data&&module.data.course_id!==course.data.id)throw new Error('Identificador de módulo pertence a outra formação.');
if(!module.data){module=await db.from('modules').insert({...manifest.module,course_id:course.data.id,published:false}).select('*').single();fail(module.error);}
const mid=module.data.id;
const [progress,activities]=await Promise.all([db.from('student_module_progress').select('student_id',{count:'exact',head:true}).eq('module_id',mid),db.from('activities').select('id').eq('module_id',mid)]);fail(progress.error);fail(activities.error);
if(progress.count)throw new Error('Módulo já utilizado. Importe numa nova versão para preservar critérios.');
if(activities.data.length){const submissions=await db.from('submissions').select('id',{count:'exact',head:true}).in('activity_id',activities.data.map(a=>a.id));fail(submissions.error);if(submissions.count)throw new Error('Módulo com entregas; importação interrompida.');}
for(const lesson of lessons){
 const existing=await db.from('lessons').select('id,title').eq('module_id',mid).eq('sort_order',lesson.sort_order).maybeSingle();fail(existing.error);
 if(existing.data){if(existing.data.title!==lesson.title)throw new Error(`Ordem ${lesson.sort_order} já ocupada; nada foi sobrescrito.`);console.log(`Preservada: ${lesson.title}`);continue;}
 const inserted=await db.from('lessons').insert({module_id:mid,title:lesson.title,body_md:lesson.body_md,sort_order:lesson.sort_order,estimated_minutes:lesson.estimated_minutes,required:true,published:false}).select('id').single();fail(inserted.error);
 const audit=await db.from('audit_log').insert({action:'content.imported_draft',target_type:'lesson',target_id:inserted.data.id,details:{source:lesson.file}});fail(audit.error);
 console.log(`Rascunho importado: ${lesson.title}`);
}
console.log('Importação terminada sem publicação. Revise os rascunhos no editor. O bootcamp permanece incompleto.');
