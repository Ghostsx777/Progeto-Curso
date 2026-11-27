import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import {serviceDatabase} from './supabase';
import {revision,voice} from './narration';

export async function readerTracks(db:SupabaseClient,id:string,body:string,preview=false){
 const hash=revision(body);
 const {data,error}=await db.from('lesson_narrations').select('voice,cues,seconds,object_path').eq('lesson_id',id).eq('revision',hash).in('status',preview?['ready','preview']:['ready']);
 if(error)throw error;
 const preferred=data.some(t=>t.voice===voice);
 const tracks=data.filter(t=>preview?t.voice===voice:!(preferred&&t.voice==='pt_BR-faber-medium'));
 return Promise.all(tracks.map(async t=>{
  const path=id+'/'+hash+'/'+t.voice+'.mp3';
  if(t.object_path!==path)throw Error('Referência de áudio inválida.');
  const result=await serviceDatabase().storage.from('lesson-narrations').createSignedUrl(path,14400);
  if(result.error)throw result.error;
  return {voice:t.voice,seconds:t.seconds,cues:t.cues,url:result.data.signedUrl};
 }));
}
