'use client';
import {useState} from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
export function MarkdownEditor({name,value='',label,maxLength}:{name:string;value?:string;label:string;maxLength:number}){
 const [body,setBody]=useState(value);const [preview,setPreview]=useState(false);
 return <div className="stack"><div className="flex items-center justify-between gap-3"><label htmlFor={`${name}-editor`}>{label}</label><button type="button" className="btn secondary" aria-pressed={preview} onClick={()=>setPreview(!preview)}>{preview?'Voltar à edição':'Visualizar'}</button></div><textarea id={`${name}-editor`} name={name} value={body} onChange={e=>setBody(e.target.value)} maxLength={maxLength} rows={16} className={preview?'sr-only':'font-mono text-sm'}/>{preview&&<div className="prose card"><Markdown remarkPlugins={[remarkGfm]}>{body||'*Ainda sem conteúdo.*'}</Markdown></div>}<p className="muted text-xs">Markdown: ## Título · **negrito** · [link](https://...) · ![descrição](https://.../imagem.png). Use blocos com três crases para código e diagramas em texto. HTML executável não é permitido.</p></div>;
}
