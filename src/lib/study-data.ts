import {cache} from 'react';
import {requireUser} from './auth';

export const studyData=cache(async()=>{
 const {db,user,profile}=await requireUser();
 const [enroll,progress,submissions]=await Promise.all([
  db.from('enrollments').select('course_id,courses(title,description)').eq('student_id',user.id).in('status',['active','completed']),
  db.from('lesson_progress').select('lesson_id,completed_at,study_minutes').eq('student_id',user.id),
  db.from('submissions').select('id,attempt_no,activity_id,grade,feedback,submitted_at,graded_at,status').eq('student_id',user.id).order('submitted_at',{ascending:false})
 ]);
 for(const r of [enroll,progress,submissions])if(r.error)throw r.error;
 const ids=(enroll.data??[]).map(e=>e.course_id);
 const modules=ids.length?await db.from('modules').select('id,title,description,preview,course_id,sort_order').in('course_id',ids).eq('published',true).order('sort_order'):{data:[],error:null};
 if(modules.error)throw modules.error;
 const accessible=await Promise.all(modules.data.map(async m=>{
  const access=await db.rpc('can_study_module',{mid:m.id});if(access.error)throw access.error;return access.data?m:null;
 }));
 const mids=accessible.flatMap(m=>m?[m.id]:[]);
 const [lessons,activities]=await Promise.all([
  mids.length?db.from('lessons').select('id,title,module_id,sort_order,estimated_minutes').in('module_id',mids).eq('published',true).order('sort_order'):{data:[],error:null},
  mids.length?db.from('activities').select('id,title,module_id,activity_type').in('module_id',mids).eq('published',true).order('sort_order'):{data:[],error:null}
 ]);
 if(lessons.error||activities.error)throw new Error('Falha ao consultar material publicado.');
 const last=await db.from('reading_state').select('lesson_id').eq('student_id',user.id).order('updated_at',{ascending:false}).limit(1).maybeSingle();
 return {accessibleIds:mids,lastLesson:last.data?.lesson_id,user,profile,courses:enroll.data??[],modules:modules.data,lessons:lessons.data.sort((a,b)=>mids.indexOf(a.module_id)-mids.indexOf(b.module_id)),activities:activities.data,progress:progress.data??[],submissions:submissions.data??[]};
});

