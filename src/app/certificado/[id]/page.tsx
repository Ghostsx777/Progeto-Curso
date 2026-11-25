import {notFound} from 'next/navigation';
import {z} from 'zod';
import {database} from '@/lib/supabase';
export default async function Certificate({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!z.uuid().safeParse(id))notFound();
 const db=await database();const {data,error}=await db.rpc('verify_certificate',{cert:id});if(error)throw error;
 const cert=data?.[0];if(!cert)notFound();
 return <main className="auth"><article className="card stack"><img src="/academy/mark.svg" alt="DevPath Academy" width="60"/><h1 className="heading">Certificado de conclusão</h1><h2 className="title">{cert.full_name}</h2><p>{cert.course_title}</p><p>{cert.study_minutes} minutos registrados · {new Date(cert.issued_at).toLocaleDateString('pt-BR')}</p><small>Formação independente DevPath Academy · {cert.id}</small></article></main>
}
