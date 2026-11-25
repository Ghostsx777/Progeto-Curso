import {notFound} from 'next/navigation';
import Link from 'next/link';
import {requireUser} from '@/lib/auth';
const titles:Record<string,string>={matriculas:'Matrículas',avaliacoes:'Avaliações',relatorios:'Relatórios',recuperacao:'Recuperação',certificados:'Certificados',configuracoes:'Configurações'};
export default async function Management({params}:{params:Promise<{area:string}>}){
 const {area}=await params;if(!Object.hasOwn(titles,area))notFound();
 const {db}=await requireUser(true);
 type Row={title:string;detail:string;url?:string};let rows:Row[]=[];
 if(area==='matriculas'){
  const r=await db.from('enrollments').select('status,profiles(full_name),courses(title)');if(r.error)throw r.error;
  rows=r.data.map(e=>({title:(e.profiles as unknown as {full_name:string})?.full_name,detail:[(e.courses as unknown as {title:string})?.title,e.status].join(' · ')}));
 }else if(area==='avaliacoes'){
  const r=await db.from('activities').select('id,title,activity_type,published').in('activity_type',['quiz','exam']);if(r.error)throw r.error;
  rows=r.data.map(a=>({title:a.title,detail:a.published?'Publicada':'Rascunho',url:'/admin/conteudos'}));
 }else if(area==='certificados'){
  const r=await db.from('certificates').select('id,full_name,course_title,issued_at');if(r.error)throw r.error;
  rows=r.data.map(c=>({title:c.full_name,detail:c.course_title+' · '+c.id,url:'/certificado/'+c.id}));
 }else if(area==='configuracoes'){
  const r=await db.from('courses').select('title,target_hours,published');if(r.error)throw r.error;
  rows=r.data.map(c=>({title:c.title,detail:c.target_hours+' horas previstas · '+(c.published?'Matrículas abertas':'Matrículas fechadas'),url:'/admin/conteudos'}));
 }else{
  const r=await db.from('submissions').select('grade,status,feedback,activities(title)');if(r.error)throw r.error;
  if(area==='recuperacao')rows=r.data.filter(s=>['failed','needs_revision'].includes(s.status)).map(s=>({title:(s.activities as unknown as {title:string})?.title,detail:s.feedback??'Revisão solicitada',url:'/admin/alunos'}));
  else{const graded=r.data.filter(s=>s.grade!=null);rows=[{title:'Entregas registradas',detail:String(r.data.length)},{title:'Atividades corrigidas',detail:String(graded.length)},{title:'Média das notas',detail:graded.length?(graded.reduce((sum,s)=>sum+Number(s.grade),0)/graded.length).toFixed(1)+'/100':'Aguardando correções'}];}
 }
 return <section className="stack"><div className="page-head"><h1 className="heading">{titles[area]}</h1></div><div className="grid-cards">{rows.map((r,i)=><article className="card stack" key={i}><h2 className="title">{r.title}</h2><p>{r.detail}</p>{r.url&&<Link href={r.url}>Consultar →</Link>}</article>)}</div>{!rows.length&&<p className="card muted">Nenhum registro disponível.</p>}</section>
}
