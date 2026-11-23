'use client';
import {useState} from 'react';
import {LessonContent} from './lesson-content';
import {MediaBuilder} from './media-builder';
export function MarkdownEditor({name,value='',label,maxLength}:{name:string;value?:string;label:string;maxLength:number}){
 const [body,setBody]=useState(value);const [preview,setPreview]=useState(false);
 return <div className="stack"><div className="flex items-center justify-between gap-3"><label htmlFor={`${name}-editor`}>{label}</label><button type="button" className="btn secondary" aria-pressed={preview} onClick={()=>setPreview(!preview)}>{preview?'Voltar à edição':'Visualizar'}</button></div>{!preview&&name==='body_md'&&<MediaBuilder body={body} onChange={setBody} maxLength={maxLength}/>}<textarea id={`${name}-editor`} name={name} value={body} onChange={e=>setBody(e.target.value)} maxLength={maxLength} rows={16} hidden={preview} className="font-mono text-sm"/>{preview&&<div className="card"><LessonContent body={body||'*Ainda sem conteúdo.*'}/></div>}<p className="muted text-xs">Markdown preservado: títulos, listas e blocos de código. Use o assistente para mídias. HTML e scripts embutidos não são permitidos. A prévia não publica nem salva.</p></div>;
}
