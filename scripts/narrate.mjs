import {createClient} from '@supabase/supabase-js';
import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,rename,stat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {unified} from 'unified';
import {spokenText} from './spoken-text.mjs';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

const dir=resolve(process.env.DEVPATH_VOICE_DIR||'../devpath-voz');
const model='pt_BR-faber-medium';
const voice=model+'-v2';
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
function checked(r){if(r.error)throw Error(r.error.message);return r.data}
const prep=process.argv[2]==='--prepare';
const jobs=prep?[{lesson_id:process.argv[3]}]:checked(await db.from('lesson_narrations').select('*').eq('voice',voice).eq('status','queued').limit(8));
for(const job of jobs){
 const lesson=checked(await db.from('lessons').select('id,body_md').eq('id',job.lesson_id).single());
 const body=lesson.body_md.replace(/\r\n/g,'\n'),revision=createHash('sha256').update(body).digest('hex');
 const identity={lesson_id:lesson.id,revision:job.revision??revision,voice};
 if(!prep&&!checked(await db.from('lesson_narrations').update({status:'processing',updated_at:new Date().toISOString()}).match(identity).eq('status','queued').select('lesson_id')).length)continue;
 try{
  if(!prep&&job.revision!==revision)throw Error('O texto mudou. Solicite a versão atual.');
  const cache=join(dir,voice,revision);
  try{await stat(join(cache,'cues.json'))}catch{
   const tmp=cache+'-'+randomUUID();await mkdir(tmp,{recursive:true});
   const segments=[];let heading=0;
   const plain=n=>n.type==='break'?'. ':n.value??(n.children??[]).map(plain).join('');
   function visit(n){
    if(n.type==='heading'||n.type==='paragraph'||n.type==='tableRow'){
     const text=n.type==='tableRow'?n.children.map(plain).join('. '):plain(n);
     if(text.trim())segments.push({anchor:n.type==='heading'?'section-'+(++heading):'para-'+n.position.start.offset,text:spokenText(text)});
    }else for(const c of n.children??[])visit(c);
   }
   visit(unified().use(remarkParse).use(remarkGfm).parse(body));
   await writeFile(join(tmp,'segments.json'),JSON.stringify(segments));
   const py=process.env.DEVPATH_VOICE_PYTHON||join(dir,'venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
   const result=spawnSync(py,['scripts/render-voice.py',join(dir,model+'.onnx'),tmp],{stdio:'inherit'});
   if(result.status!==0)throw Error('Falha no sintetizador local.');
   await rename(tmp,cache);
  }
  const audio=await readFile(join(cache,'lesson.mp3')),cues=JSON.parse(await readFile(join(cache,'cues.json'),'utf8'));
  console.log(lesson.id,revision,cues.length,'trechos',Math.round(cues.at(-1).end),'segundos',audio.length,'bytes');
  if(prep)continue;
  const bucket='lesson-narrations';
  const info=await db.storage.getBucket(bucket);
  if(info.error){checked(await db.storage.createBucket(bucket,{public:false,allowedMimeTypes:['audio/mpeg']}))}
  else if(info.data.public)throw Error('O armazenamento precisa ser privado.');
  const path=lesson.id+'/'+revision+'/'+voice+'.mp3';
  checked(await db.storage.from(bucket).upload(path,audio,{contentType:'audio/mpeg',upsert:true}));
  checked(await db.from('lesson_narrations').update({status:'preview',cues,object_path:path,bytes:audio.length,seconds:cues.at(-1).end,error:null,updated_at:new Date().toISOString()}).match(identity));
 }catch(error){if(!prep)checked(await db.from('lesson_narrations').update({status:'failed',error:String(error.message).slice(0,240)}).match(identity));console.error(error.message);process.exitCode=1}
}
