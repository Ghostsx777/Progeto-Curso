'use server';
import {z} from 'zod';
import {requireUser} from '@/lib/auth';
export async function savePosition(lesson:string,section:string,seconds:number,sections:string[]){
 if(!z.array(z.string().regex(/^section-\d+$/)).max(2000).safeParse(sections).success || !z.uuid().safeParse(lesson).success || !/^(section-\d+)?$/.test(section)||!Number.isFinite(seconds)||seconds<0||seconds>360000)return false;
 const {db,user}=await requireUser();
 const {error}=await db.from('reading_state').upsert({student_id:user.id,lesson_id:lesson,section,seconds,sections,updated_at:new Date().toISOString()});
 return !error;
}
export async function bookmark(lesson:string,anchor:string,label:string,remove:boolean){
 if(!z.uuid().safeParse(lesson).success||!/^(section-\d+|para-\d+)?$/.test(anchor)||!label.trim()||label.length>240)return false;
 const {db,user}=await requireUser();
 const table=db.from('study_bookmarks');
 const {error}=remove?await table.delete().eq('student_id',user.id).eq('lesson_id',lesson).eq('anchor',anchor):await table.upsert({student_id:user.id,lesson_id:lesson,anchor,label});
 return !error;
}
