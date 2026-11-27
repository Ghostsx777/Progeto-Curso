'use server';
import {requireUser} from '@/lib/auth';
import {revision,voice} from '@/lib/narration';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import type {FormState} from '@/components/action-form';
export async function manageNarration(_:FormState,form:FormData):Promise<FormState>{
 const args=z.object({id:z.uuid(),operation:z.enum(['queue','release','withdraw']),hash:z.string().regex(/^[a-f0-9]{64}$/)}).safeParse(Object.fromEntries(form));
 if(!args.success)return {error:'Operação inválida.'};
 const {db}=await requireUser(true),{id,operation,hash}=args.data;
 const lesson=await db.from('lessons').select('body_md').eq('id',id).single();
 if(!lesson.data||revision(lesson.data.body_md)!==hash)return {error:'A aula mudou. Atualize a página.'};
 const key={lesson_id:id,revision:hash,voice},table=db.from('lesson_narrations');
 const row=await table.select('status,updated_at').match(key).maybeSingle();if(row.error)throw row.error;
 if(operation==='queue'){
  const stale=row.data?.status==='processing'&&Date.parse(row.data.updated_at)<Date.now()-86400000;
  if(row.data&&row.data.status!=='failed'&&!stale)return {error:'Esta versão já possui áudio ou está em processamento.'};
 }
 const status=operation==='queue'?'queued':operation==='release'?'ready':'preview';
 const expected=operation==='release'?'preview':operation==='withdraw'?'ready':row.data?.status;
 const res=expected?await table.update({status,error:null,updated_at:new Date().toISOString()}).match(key).eq('status',expected).select('lesson_id'):await table.insert({...key,status}).select('lesson_id');
 if(res.error||!res.data?.length)return {error:'O estado mudou. Atualize a página.'};
 revalidatePath('/admin/narracoes');return {success:operation==='queue'?'Adicionada à fila de geração local.':'Disponibilidade atualizada.'};
}
