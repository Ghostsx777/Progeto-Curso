import {requireUser} from '@/lib/auth';
import {readerTracks} from '@/lib/reader-tracks';
import {revision,voice} from '@/lib/narration';
import {ActionForm} from '@/components/action-form';
import {manageNarration} from './actions';
const labels:Record<string,string>={queued:'Na fila local',processing:'Gerando áudio',preview:'Aguardando revisão',ready:'Disponível aos alunos',failed:'Falha na geração'};
export default async function Narrations(){
 const {db}=await requireUser(true);
 const [lessons,jobs]=await Promise.all([db.from('lessons').select('id,title,body_md').order('sort_order'),db.from('lesson_narrations').select('lesson_id,revision,voice,status,error,bytes,seconds').eq('voice',voice)]);
 if(lessons.error||jobs.error)throw Error('Falha ao consultar as narrações.');
 return <div className="stack"><header className="page-head"><p className="eyebrow">Conteúdo · Áudio</p><h1 className="heading">Narrações das aulas</h1><p>Voz brasileira Faber. Geração local a €0 por caractere. Revise a prévia antes de liberar para a turma.</p></header>{await Promise.all(lessons.data.map(async l=>{
  const hash=revision(l.body_md),job=jobs.data.find(j=>j.lesson_id===l.id&&j.revision===hash);
  const tracks=job&&['preview','ready'].includes(job.status)?await readerTracks(db,l.id,l.body_md,true):[];
  const operation=job?.status==='preview'?'release':job?.status==='ready'?'withdraw':'queue';
  return <section className="card stack" key={l.id}><span className="eyebrow">{job?labels[job.status]:'Sem narração desta versão'}</span><h2 className="title">{l.title}</h2><small>{l.body_md.length.toLocaleString('pt-BR')} caracteres de material{job?.bytes?' · '+(job.bytes/1000000).toFixed(1)+' MB · '+Math.round(job.seconds/60)+' min':''}</small>{job?.error&&<p role="alert">{job.error}</p>}{tracks.map(t=><audio key={t.voice} aria-label={'Prévia de '+l.title} controls preload="none" src={t.url}/>)}{job?.status!=='queued'&&<ActionForm action={manageNarration} label={operation==='release'?'Aprovar e liberar áudio':operation==='withdraw'?'Retirar áudio para revisão':job?.status==='processing'?'Recuperar processamento interrompido':'Solicitar geração'}><input type="hidden" name="id" value={l.id}/><input type="hidden" name="hash" value={hash}/><input type="hidden" name="operation" value={operation}/></ActionForm>}</section>
 }))}</div>;
}
