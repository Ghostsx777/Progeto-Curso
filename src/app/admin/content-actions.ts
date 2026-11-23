'use server';
import {revalidatePath} from 'next/cache';
import {requireUser} from '@/lib/auth';
import {contentSchema} from '@/lib/content-schema';
import type {FormState} from '@/components/action-form';
import {z} from 'zod';
import {reviewLesson} from '@/lib/lesson-review';
export async function publishCourse(_:FormState,form:FormData):Promise<FormState>{
 const id=z.uuid().safeParse(form.get('course_id'));const visible=form.get('published');
 if(!id.success||!['true','false'].includes(String(visible)))return {error:'Formação inválida.'};
 const {db}=await requireUser(true);const {error}=await db.rpc('set_course_publication',{cid:id.data,visible:visible==='true'});
 if(error)return {error:'Não foi possível alterar. Para abrir matrículas, publique pelo menos um módulo com uma aula.'};
 revalidatePath('/admin/conteudos');revalidatePath('/painel/matriculas');return {success:visible==='true'?'Formação disponível para matrículas.':'Novas matrículas fechadas. O acesso de quem já estuda foi preservado.'};
}
export async function saveContent(_:FormState,form:FormData):Promise<FormState>{
 const parsed=contentSchema.safeParse({...Object.fromEntries(form),published:form.get('published')==='true',required:form.get('required')==='true'});
 if(!parsed.success)return {error:parsed.error.issues[0]?.message||'Verifique os campos do conteúdo.'};
 const {db}=await requireUser(true);const {kind,...payload}=parsed.data;
 if(kind==='lesson'){
  const body=(parsed.data as {body_md:string}).body_md;
  const reviewError=await reviewLesson(body,payload.published,form.get('reviewed')==='true');
  if(reviewError)return {error:reviewError};
 }
 const {error}=await db.rpc('save_content',{kind,payload});
 if(error)return {error:'Não foi possível guardar. Verifique identificador/ordem duplicados e campos obrigatórios. Em módulos já utilizados, estrutura, publicação e critérios ficam protegidos para preservar o progresso; tentativas extras são concedidas por aluno.'};
 revalidatePath('/admin/conteudos','layout');revalidatePath('/admin/historico');revalidatePath('/painel','layout');
 return {success:'Conteúdo salvo no banco e alteração registrada no histórico.'};
}
