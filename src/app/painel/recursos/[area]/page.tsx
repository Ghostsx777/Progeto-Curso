import Link from 'next/link';
import {notFound} from 'next/navigation';
import {studyData} from '@/lib/study-data';
import {requireUser} from '@/lib/auth';
import {markdownTree,walk,parseMedia} from '@/lib/lesson-media';
const titles:Record<string,string>={aulas:'Minhas aulas',exercicios:'Exercícios',projetos:'Projetos',avaliacoes:'Avaliações',calendario:'Calendário de aprendizagem',biblioteca:'Biblioteca',glossario:'Glossário',diario:'Meu diário',perfil:'Perfil',configuracoes:'Configurações',perguntas:'Perguntas de revisão',pesquisa:'Pesquisar conteúdos',avisos:'Feedback recebido'};
type Entry={title:string;description?:string;href?:string};
export default async function Resources({params,searchParams}:{params:Promise<{area:string}>;searchParams:Promise<{q?:string}>}){
 const {area}=await params;if(!Object.hasOwn(titles,area))notFound();
 const d=await studyData();const {db}=await requireUser();const q=(await searchParams).q?.trim()??'';
 let rows:Entry[]=[];
 if(['aulas','biblioteca','pesquisa'].includes(area))rows=d.lessons.filter(l=>area!=='pesquisa'||l.title.toLocaleLowerCase().includes(q.toLocaleLowerCase())).map(l=>({title:l.title,description:l.estimated_minutes+' minutos',href:'/painel/aula/'+l.id}));
 if(['exercicios','projetos','avaliacoes','pesquisa'].includes(area)){
  const types=area==='exercicios'?['exercise']:area==='projetos'?['project']:area==='avaliacoes'?['quiz','exam']:['exercise','project','quiz','exam'];
  rows.push(...d.activities.filter(a=>types.includes(a.activity_type)&&(area!=='pesquisa'||a.title.toLocaleLowerCase().includes(q.toLocaleLowerCase()))).map(a=>({title:a.title,href:'/painel/modulo/'+a.module_id})));
 }
 if(area==='avisos'||area==='calendario')rows=d.submissions.filter(s=>area==='calendario'||s.feedback).map(s=>({title:d.activities.find(a=>a.id===s.activity_id)?.title??'Atividade',description:area==='avisos'?s.feedback:'Entrega em '+new Date(s.submitted_at).toLocaleDateString('pt-BR',{timeZone:'UTC'}),href:'/painel/entregas'}));
 if(area==='diario'){const notes=await db.from('notes').select('lesson_id,body').eq('student_id',d.user.id).order('updated_at',{ascending:false});if(notes.error)throw notes.error;rows=notes.data.map(n=>({title:d.lessons.find(l=>l.id===n.lesson_id)?.title??'Anotação',description:n.body,href:'/painel/aula/'+n.lesson_id}));}
 if(d.lessons.length && ['glossario','perguntas','biblioteca'].includes(area)){
 const bodies=await db.from('lessons').select('id,title,body_md').in('id',d.lessons.map(l=>l.id));if(bodies.error)throw bodies.error;
 for(const l of bodies.data){const tree=markdownTree(l.body_md);if(area==='perguntas'){let active=false;for(const node of tree.children??[]){let parts:string[]=[];walk(node,n=>{if(n.type==='text'&&n.value)parts.push(n.value)});if(node.type==='heading')active=/verificação de aprendizagem/i.test(parts.join(' '));else if(active&&parts.length)rows.push({title:l.title,description:parts.join(' '),href:'/painel/aula/'+l.id});}}
 else walk(tree,n=>{if(n.type!=='code'||n.lang!=='devpath')return;const b=parseMedia(n.value??'');if(!b.success)return;const v=b.data;if(area==='glossario'&&v.type==='glossary')rows.push({title:v.term,description:v.definition,href:'/painel/aula/'+l.id});if(area==='biblioteca'&&v.type==='reference')rows.push({title:v.title,description:v.source+' · '+v.description,href:v.url});});}}
 if(area==='perfil')rows=[{title:d.profile.full_name,description:d.user.email},{title:'Formações',description:String(d.courses.length),href:'/painel/matriculas'}];
 if(area==='configuracoes')rows=[{title:'Recuperar senha',href:'/recuperar-senha'},{title:'Dados da conta',href:'/painel/recursos/perfil'}];
 return <section className="stack"><header className="page-head"><h1 className="heading">{titles[area]}</h1></header>{area==='pesquisa'&&<form><label>Buscar por título<input name="q" defaultValue={q}/></label><button className="btn">Pesquisar</button></form>}<div className="grid-cards">{rows.map((r,i)=><article className="card stack" key={i}><h2 className="title">{r.title}</h2>{r.description&&<p className="muted whitespace-pre-wrap">{r.description}</p>}{r.href&&<Link href={r.href} className="text-cyan-300">Abrir</Link>}</article>)}</div>{!rows.length&&<div className="card"><p>{area==='pesquisa'?'Nenhum conteúdo encontrado para esta busca.':'Ainda não há registros disponíveis nesta área.'}</p><Link href="/painel/formacao">Consultar minha formação</Link></div>}</section>;
}

