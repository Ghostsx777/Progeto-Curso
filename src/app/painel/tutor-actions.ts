'use server';
import {z} from 'zod';import {revalidatePath} from 'next/cache';
import {requireUser} from '@/lib/auth';import {serviceDatabase} from '@/lib/supabase';import {TUTOR_INSTRUCTIONS,tutorInput,responseText,type TutorMessage} from '@/lib/tutor';import type {FormState} from '@/components/action-form';
export async function askTutor(_:FormState,form:FormData):Promise<FormState>{
 const parsed=z.object({lesson_id:z.uuid(),question:z.string().trim().min(3).max(4000),consent:z.literal('yes')}).safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:'Escreva uma pergunta e confirme o envio à IA.'};
 const {db,user}=await requireUser();
 const key=process.env.OPENAI_API_KEY,model=process.env.OPENAI_MODEL;
 if(process.env.AI_TUTOR_ENABLED!=='true'||!key||!model)return {error:'O professor de IA está desativado ou ainda não foi configurado pelo proprietário.'};
 const id=parsed.data.lesson_id;
 const {data:lesson}=await db.from('lessons').select('*').eq('id',id).eq('published',true).single();
 if(!lesson)return {error:'Aula indisponível.'};
 const {data:allowed}=await db.rpc('can_study_module',{mid:lesson.module_id});if(!allowed)return {error:'Esta aula ainda está bloqueada.'};
 const [history,progress]=await Promise.all([db.from('tutor_messages').select('role,body').eq('student_id',user.id).eq('lesson_id',id).order('id',{ascending:false}).limit(6),db.from('student_module_progress').select('status,final_grade').eq('student_id',user.id).eq('module_id',lesson.module_id).maybeSingle()]);
 if(history.error||progress.error)return {error:'Não foi possível carregar seu contexto.'};
 // Valida a configuração privilegiada antes de reservar cota.
 const service=serviceDatabase();
 const {data:requestId,error:reservationError}=await db.rpc('reserve_tutor',{lid:id,question:parsed.data.question});
 if(reservationError)return {error:'Não foi possível iniciar. Aguarde 10 segundos; o limite é 20 perguntas por dia por aluno e 200 na plataforma.'};
 try{
   const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,instructions:TUTOR_INSTRUCTIONS,input:tutorInput(lesson.title,lesson.body_md,history.data.reverse() as TutorMessage[],parsed.data.question,JSON.stringify(progress.data)),max_output_tokens:1200,store:false}),signal:AbortSignal.timeout(45000)});
   if(!response.ok)throw new Error('Provider failed');
   const data=await response.json();const answer=responseText(data);if(!answer)throw new Error('Empty response');
   const usage=z.object({input_tokens:z.number().int().nonnegative(),output_tokens:z.number().int().nonnegative()}).safeParse(data.usage);
   const {error}=await service.rpc('finish_tutor',{rid:requestId,response:answer,tokens_in:usage.success?usage.data.input_tokens:0,tokens_out:usage.success?usage.data.output_tokens:0});
   if(error)throw new Error('Persistence failed');
   revalidatePath(`/painel/aula/${id}`);return {success:'Resposta salva no seu histórico.'};
 }catch{
   await service.rpc('finish_tutor',{rid:requestId,response:null,tokens_in:0,tokens_out:0});
   revalidatePath(`/painel/aula/${id}`);return {error:'A IA não respondeu ou a resposta não pôde ser salva. Sua pergunta está no histórico. Tente mais tarde; esta tentativa conta para o limite de segurança.'};
 }
}
