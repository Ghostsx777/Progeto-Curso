import {z} from 'zod';
const base={id:z.union([z.literal(''),z.uuid()]),title:z.string().trim().min(3).max(160),sort_order:z.coerce.number().int().min(1).max(10000),published:z.boolean()};
export const contentSchema=z.discriminatedUnion('kind',[
 z.object({...base,kind:z.literal('module'),course_id:z.uuid(),slug:z.string().min(1).max(100).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),description:z.string().max(5000),preview:z.string().max(10000),pass_mark:z.coerce.number().min(70).max(100)}),
 z.object({...base,kind:z.literal('lesson'),module_id:z.uuid(),body_md:z.string().max(200000),estimated_minutes:z.coerce.number().int().min(1).max(1440),required:z.boolean()}),
 z.object({...base,kind:z.literal('activity'),module_id:z.uuid(),instructions_md:z.string().max(100000),activity_type:z.enum(['exercise','quiz','project','exam']),max_attempts:z.coerce.number().int().min(1).max(100),required:z.boolean()})
]).superRefine((value,ctx)=>{
 if(value.published&&value.kind==='lesson'&&value.body_md.trim().length<100)ctx.addIssue({code:'custom',message:'Uma aula publicada precisa de conteúdo.',path:['body_md']});
 if(value.published&&value.kind==='activity'&&value.instructions_md.trim().length<30)ctx.addIssue({code:'custom',message:'Uma atividade publicada precisa de instruções.',path:['instructions_md']});
});
export type ContentInput=z.infer<typeof contentSchema>;
