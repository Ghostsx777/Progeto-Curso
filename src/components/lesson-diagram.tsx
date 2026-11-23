'use client';
import {useEffect,useState,useId} from 'react';
import {diagramError} from '@/lib/lesson-media';
let queue=Promise.resolve();
export default function LessonDiagram({code}:{code:string}){
 const id=useId().replace(/[^a-z0-9]/gi,''),[svg,setSvg]=useState(''),[error,setError]=useState('');
 useEffect(()=>{let active=true;setSvg('');setError('');const invalid=diagramError(code);if(invalid){setError(invalid);return;}queue=queue.then(async()=>{try{const {default:mermaid}=await import('mermaid');mermaid.initialize({startOnLoad:false,securityLevel:'strict',maxTextSize:8000,maxEdges:120,suppressErrorRendering:true,theme:'dark',flowchart:{htmlLabels:false}});const result=await mermaid.render(`diagram${id}`,code);if(active)setSvg(result.svg);}catch{if(active)setError('Não foi possível desenhar este diagrama. Revise a sintaxe Mermaid.');}});return()=>{active=false;};},[code,id]);
 return <figure className="learning-block"><figcaption>Diagrama didático</figcaption>{error?<p role="alert">{error}</p>:svg?<iframe title="Diagrama Mermaid" sandbox="" referrerPolicy="no-referrer" className="diagram-frame" srcDoc={`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'"><style>body{margin:0;background:#101724}svg{max-width:100%;height:auto}</style>${svg}`}/>:<p role="status">Preparando diagrama…</p>}<details><summary>Descrição textual do diagrama</summary><pre>{code}</pre></details></figure>;
}
