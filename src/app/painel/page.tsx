import {Performance} from '@/components/performance';
import Link from 'next/link';
import {BookOpen,Clock,GraduationCap,CheckCircle,Code2,Folder,CalendarDays,Library,Flame} from 'lucide-react';
import {studyData} from '@/lib/study-data';
export default async function Dashboard(){
 const d=await studyData();
 const done=new Set(d.progress.filter(p=>p.completed_at).map(p=>p.lesson_id));
 const completed=d.lessons.filter(l=>done.has(l.id)).length;
 const next=d.lessons.find(l=>!done.has(l.id));
 const projects=d.activities.filter(a=>a.activity_type==='project');
 const submitted=new Set(d.submissions.map(s=>s.activity_id));
 const percent=d.lessons.length?Math.round(completed/d.lessons.length*100):0;
 const resume=next?`/painel/aula/${next.id}`:'/painel/formacao';
 const course=d.courses[0]?.courses as unknown as {title:string}|null;
 const scores=d.submissions.filter(s=>s.grade!=null&&s.graded_at).map(s=>({date:s.graded_at,value:Number(s.grade)}));
 const metrics=[
  {icon:GraduationCap,label:'Progresso nas aulas liberadas',value:percent+'%',ratio:percent},
  {icon:BookOpen,label:'Aulas concluídas',value:completed+' / '+d.lessons.length,ratio:percent},
  {icon:CheckCircle,label:'Projetos entregues',value:projects.filter(p=>submitted.has(p.id)).length+' / '+projects.length},
  {icon:Clock,label:'Tempo de estudo',value:d.progress.reduce((n,p)=>n+p.study_minutes,0)+' min'}
 ];
 return <div className="dashboard"><section className="academy-hero"><span className="badge">🚀 Seu Bootcamp Full Stack</span><h1>Olá, <em>{d.profile.full_name}!</em></h1><p>Bem-vindo de volta à DevPath Academy. Continue sua jornada de desenvolvimento Full Stack.</p><Link className="btn" href={resume}>{next?'▶  Continuar de onde parou':'Explorar minha formação'} →</Link></section>
 <section className="metrics">{metrics.map(({icon:I,label,value,ratio})=><div className="card metric" key={label}><I/><div><small>{label}</small><strong>{value}</strong></div>{ratio!==undefined&&<progress aria-label={label} max={100} value={ratio}/>}</div>)}</section>
 <section className="dash-pair"><article className="card"><h2><Flame/> Seu próximo passo</h2><div className="lesson-tile"><img src="/academy/lesson.webp" alt=""/><div><small>{d.modules.find(m=>m.id===next?.module_id)?.title}</small><h3>{next?.title??'Explore sua trilha'}</h3><p>{next?next.estimated_minutes+' minutos de estudo':'Consulte os módulos e as aulas disponíveis.'}</p><Link className="btn" href={resume}>{next?'Acessar aula':'Ver trilha'} →</Link></div></div></article>
 <article className="card course-tile"><h2><BookOpen/> Sua formação</h2><h3>{course?.title??'Escolha sua formação'}</h3><p>{course?'Consulte os módulos, projetos e avaliações.':'Veja as formações abertas para matrícula.'}</p><Link className="btn secondary" href={course?'/painel/formacao':'/painel/matriculas'}>Ver formação →</Link></article></section>
 <section className="dash-pair"><Performance grades={scores} asOf={Date.now()}/><article className="card"><h2>Atalhos rápidos</h2><div className="quick">{[[Code2,'Exercícios','exercicios'],[Folder,'Projetos','projetos'],[CalendarDays,'Calendário','calendario'],[Library,'Biblioteca','biblioteca']].map(([I,label,url])=>{const Icon=I as typeof Folder;return <Link href={'/painel/recursos/'+url} key={String(url)}><Icon/>{String(label)}</Link>})}</div></article></section>
 {d.profile.role==='admin'&&<Link className="btn secondary" href="/admin">Abrir painel administrativo →</Link>}<section className="card"><h2>Entregas recentes</h2><small>{d.submissions.filter(s=>["submitted","under_review"].includes(s.status)).length} em correção</small>{d.submissions.slice(0,5).map(s=><p key={s.id}>{d.activities.find(a=>a.id===s.activity_id)?.title??"Atividade"} · Tentativa {s.attempt_no} · {s.grade==null?"Aguardando correção":s.grade+"/100"}{s.feedback&&<small className="block">{s.feedback}</small>}</p>)}<Link href="/painel/entregas">Consultar entregas e feedback →</Link></section></div>;
}


