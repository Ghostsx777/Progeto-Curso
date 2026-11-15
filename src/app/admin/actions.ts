'use server';
import {randomBytes,createHash} from 'node:crypto';import {z} from 'zod';import {revalidatePath} from 'next/cache';import {requireUser} from '@/lib/auth';import type {FormState} from '@/components/action-form';
import {inviteSchema} from '@/lib/invites';
export async function invite(_:FormState,f:FormData):Promise<FormState>{
 const p=inviteSchema.safeParse(Object.fromEntries(f));
 if(!p.success||Date.parse(p.data.expires_at)<=Date.now())return {error:'Informe um email válido (ou deixe vazio) e uma data/hora futura para a expiração.'};
 const {db}=await requireUser(true);const token=randomBytes(32).toString('hex');
 const {error}=await db.rpc('create_invite_at',{hash:createHash('sha256').update(token).digest('hex'),deadline:p.data.expires_at,bound_email:p.data.email||null});
 if(error)return {error:'Não foi possível criar o convite. Verifique se o prazo ainda é futuro.'};
 revalidatePath('/admin/convites');revalidatePath('/admin');
 return {success:'Convite individual criado. Ele permite apenas um cadastro.',link:`${process.env.NEXT_PUBLIC_APP_URL}/convite/${token}`};
}
export async function revoke(_:FormState,f:FormData):Promise<FormState>{const id=z.uuid().safeParse(f.get('id'));if(!id.success)return {error:'Convite inválido.'};const {db}=await requireUser(true);const {error}=await db.rpc('revoke_invite',{iid:id.data});if(error)return {error:'Não foi possível revogar.'};revalidatePath('/admin/convites');return {success:'Convite revogado.'};}
export async function grade(_:FormState,f:FormData):Promise<FormState>{const p=z.object({id:z.uuid(),mark:z.coerce.number().min(0).max(100),comment:z.string().trim().min(5).max(10000),result:z.enum(['approved','failed','needs_revision'])}).safeParse(Object.fromEntries(f));if(!p.success)return {error:'Informe nota entre 0 e 100, resultado e feedback.'};const {db}=await requireUser(true);const {error}=await db.rpc('grade_submission',{subid:p.data.id,mark:p.data.mark,comment:p.data.comment,result:p.data.result});if(error)return {error:'Correção não aceita: entrega já corrigida ou nota abaixo do mínimo para aprovação.'};revalidatePath('/admin');return {success:'Correção salva no histórico. Os requisitos de progressão foram reavaliados.'};}
export async function exception(_:FormState,f:FormData):Promise<FormState>{const p=z.object({id:z.uuid(),kind:z.enum(['block','unblock','unlock','attempt']),target:z.union([z.literal(''),z.uuid()]),reason:z.string().trim().min(10).max(2000)}).safeParse(Object.fromEntries(f));if(!p.success)return {error:'Informe os dados e uma justificativa de pelo menos 10 caracteres.'};const {db}=await requireUser(true);const {error}=await db.rpc('admin_exception',{sid:p.data.id,kind:p.data.kind,target:p.data.target||null,reason:p.data.reason});if(error)return {error:'Não foi possível executar a ação.'};revalidatePath('/admin/alunos');return {success:'Ação registrada no histórico administrativo.'};}
