'use server';
import {revalidatePath} from 'next/cache';
import {requireUser} from '@/lib/auth';
import {contentSchema} from '@/lib/content-schema';
import type {FormState} from '@/components/action-form';
export async function saveContent(_:FormState,form:FormData):Promise<FormState>{
 const parsed=contentSchema.safeParse({...Object.fromEntries(form),published:form.get('published')==='true',required:form.get('required')==='true'});
 if(!parsed.success)return {error:parsed.error.issues[0]?.message||'Verifique os campos do conteúdo.'};
 const {db}=await requireUser(true);const {kind,...payload}=parsed.data;
 const {error}=await db.rpc('save_content',{kind,payload});
 if(error)return {error:'Não foi possível guardar. Verifique identificador/ordem duplicados e campos obrigatórios. Em módulos já utilizados, estrutura, publicação e critérios ficam protegidos para preservar o progresso; tentativas extras são concedidas por aluno.'};
 revalidatePath('/admin/conteudos','layout');revalidatePath('/admin/historico');revalidatePath('/painel','layout');
 return {success:'Conteúdo salvo no banco e alteração registrada no histórico.'};
}
