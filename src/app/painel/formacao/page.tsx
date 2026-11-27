import Link from 'next/link';
import {studyData} from '@/lib/study-data';
import {requireUser} from '@/lib/auth';
export default async function Formation({searchParams}:{searchParams:Promise<{curso?:string}>}){
 const {curso}=await searchParams,d=await studyData(),{db,user}=await requireUser();
 const states=await db.from('student_module_progress').select('module_id,status').eq('student_id',user.id);if(states.error)throw states.error;
 const courses=d.courses.filter(c=>!curso||c.course_id===curso),done=new Set(d.progress.filter(x=>x.completed_at).map(x=>x.lesson_id));
 if(!courses.length)return <section className="card stack"><h1 className="heading">Minha formação</h1><p>Escolha uma formação para começar a estudar.</p><Link className="btn" href="/painel/matriculas">Ver formações</Link></section>;
 return <div className="stack">{courses.map(c=>{
  const course=c.courses as unknown as {title:string;description:string},modules=d.modules.filter(m=>m.course_id===c.course_id);
  const lessons=d.lessons.filter(l=>modules.some(m=>m.id===l.module_id));
  const next=lessons.find(l=>l.id===d.lastLesson&&!done.has(l.id))??lessons.find(l=>!done.has(l.id));
  const completed=modules.filter(m=>states.data.some(s=>s.module_id===m.id&&s.status==='completed')).length;
  return <section className="stack" key={c.course_id}><header className="academy-hero"><span className="badge">Minha formação</span><h1>{course.title}</h1><p>{course.description}</p><div>{completed} de {modules.length} módulos concluídos</div>{next&&<Link className="btn" href={'/painel/aula/'+next.id}>Continuar estudos</Link>}</header>
  <h2 className="title">Mapa da jornada</h2><ol className="journey">{modules.map(m=>{
   const accessible=d.accessibleIds.includes(m.id),items=lessons.filter(l=>l.module_id===m.id),activities=d.activities.filter(a=>a.module_id===m.id);
   const finished=items.filter(l=>done.has(l.id)).length,official=states.data.find(s=>s.module_id===m.id)?.status;
   return <li className="card stack" key={m.id}><div className="flex justify-between"><span className="eyebrow">Módulo {m.sort_order}</span><span className="badge">{!accessible?'Bloqueado':official==='completed'?'Concluído':official==='failed'?'Em recuperação':official==='in_progress'||finished?'Em andamento':'Não iniciado'}</span></div><h3 className="title">{m.title}</h3><p>{m.description}</p>{m.preview&&<p className="muted whitespace-pre-wrap">{m.preview}</p>}{accessible?<><small>{finished}/{items.length} aulas · {items.reduce((n,l)=>n+l.estimated_minutes,0)} min · {activities.filter(a=>a.activity_type==='exercise').length} exercícios · {activities.filter(a=>a.activity_type==='project').length} projetos · {activities.filter(a=>['quiz','exam'].includes(a.activity_type)).length} avaliações</small><Link className="btn secondary" href={'/painel/modulo/'+m.id}>Abrir módulo</Link></>:<small>Conclua os requisitos acadêmicos do módulo anterior para acessar o material.</small>}</li>;
  })}</ol></section>
 })}</div>;
}
