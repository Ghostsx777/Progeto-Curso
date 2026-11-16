import Link from 'next/link';
import {requireUser} from '@/lib/auth';
import {ContentForm} from '@/components/content-form';
import {ActionForm} from '@/components/action-form';import {publishCourse} from '../content-actions';
export default async function Contents(){
 const {db}=await requireUser(true);
 const [courses,modules]=await Promise.all([db.from('courses').select('*').order('title'),db.from('modules').select('*').order('sort_order')]);
 if(courses.error||modules.error)throw new Error('Não foi possível carregar o conteúdo.');
 return <div className="stack">
   <div className="page-head"><p className="eyebrow">Administração · Conteúdo</p><h1 className="heading mt-3">Construa a formação.</h1><p>Prepare rascunhos, revise e publique quando estiver pronto para ensinar.</p></div>
   <p className="message">Depois que há progresso, mudanças de estrutura e critérios exigem uma nova versão do curso. Textos continuam editáveis e ficam registrados no histórico.</p>
   {courses.data.map(c=><section className="stack" key={c.id}>
     <h2 className="title">{c.title}</h2>
     <ActionForm action={publishCourse} label={c.published?'Fechar novas matrículas':'Abrir matrículas'}>
       <input type="hidden" name="course_id" value={c.id}/><input type="hidden" name="published" value={String(!c.published)}/>
     </ActionForm>
     <div className="grid-cards">{modules.data.filter(m=>m.course_id===c.id).map(m=><Link className="card stack" href={`/admin/conteudos/${m.id}`} key={m.id}><span className="eyebrow">Módulo {m.sort_order}</span><h3 className="title">{m.title}</h3><span className="badge">{m.published?'Publicado':'Rascunho'}</span><span className="text-cyan-300 text-sm">Editar aulas e atividades →</span></Link>)}</div>
     <details className="card"><summary>Criar módulo</summary><ContentForm value={{kind:'module',id:'',course_id:c.id,title:'',slug:'',sort_order:Math.max(0,...modules.data.filter(m=>m.course_id===c.id).map(m=>m.sort_order))+1,pass_mark:70,description:'',preview:'',published:false}}/></details>
   </section>)}
   {!courses.data.length&&<p className="card muted">Execute as migrações para criar a formação inicial.</p>}
 </div>;
}
