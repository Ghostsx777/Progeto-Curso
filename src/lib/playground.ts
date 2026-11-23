const escapeScript=(s:string)=>JSON.stringify(s).replaceAll('<','\\u003c');
// Only inert teaching markup survives; remove navigation and resource-loading elements.
export function cleanTeachingHtml(html:string){
 const doc=document.createElement('template');doc.innerHTML=html;
 const allowed=new Set('h1 h2 h3 h4 h5 h6 p div span section article header footer main aside nav ul ol li strong em b i code pre blockquote br hr table thead tbody tr th td button label input'.split(' '));
 for(const el of Array.from(doc.content.querySelectorAll('*'))){
  if(!allowed.has(el.tagName.toLowerCase())){el.remove();continue;}
  for(const a of Array.from(el.attributes))if(!['class','id','title','aria-label','type','placeholder'].includes(a.name))el.removeAttribute(a.name);
 }
 return doc.innerHTML;
}
export function htmlPreview(html:string,css:string){return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'"><style>body{font:16px system-ui;padding:16px}${css.replaceAll('<','')}</style>${cleanTeachingHtml(html)}`;}
export function javascriptPreview(code:string){
 const worker=`onmessage=e=>{let lines=[],size=0;const send=(...args)=>{const line=args.map(v=>typeof v==='string'?v:JSON.stringify(v)).join(' ');size+=line.length;if(size>8000||lines.length>=100)throw Error('Limite de saída');lines.push(line);};Object.defineProperty(globalThis,'Worker',{value:undefined,writable:false});Object.defineProperty(globalThis,'SharedWorker',{value:undefined,writable:false});console.log=send;console.error=send;try{new Function(e.data)();postMessage({output:lines.join('\\n')});}catch(err){postMessage({error:String(err.message).slice(0,500)});}};`;
 return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:; style-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; form-action 'none'"><style>body{font:14px monospace;background:#0b1220;color:#d8f6ff;white-space:pre-wrap;padding:12px}</style><pre id="out" role="status">Executando…</pre><script>const out=document.getElementById('out');const worker=new Worker(URL.createObjectURL(new Blob([${escapeScript(worker)}],{type:'text/javascript'})));const timer=setTimeout(()=>{worker.terminate();out.textContent='Interrompido: limite de 1 segundo.';},1000);worker.onmessage=e=>{clearTimeout(timer);worker.terminate();out.textContent=e.data.error?'Erro: '+e.data.error:e.data.output||'(Sem saída. Use console.log.)';parent.postMessage({type:'devpath-result',output:e.data.output,error:e.data.error},'*');};worker.onerror=()=>{clearTimeout(timer);worker.terminate();out.textContent='Execução indisponível neste navegador.';};worker.postMessage(${escapeScript(code.slice(0,12000))});<\/script>`;
}
export const sqlRows=[{nome:'Ana',pontos:80},{nome:'Bruno',pontos:60},{nome:'Carla',pontos:95}];
export function simulateSql(query:string){const m=/^\s*select\s+(\*|nome|pontos)\s+from\s+alunos(?:\s+where\s+pontos\s*(>=|>|=|<|<=)\s*(\d{1,3}))?\s*;?\s*$/i.exec(query);if(!m)throw new Error('Neste simulador: SELECT *, nome ou pontos FROM alunos [WHERE pontos >= 70].');const rows=sqlRows.filter(r=>!m[2]||({'>' :r.pontos>+m[3],'>=':r.pontos>=+m[3],'<':r.pontos<+m[3],'<=':r.pontos<=+m[3],'=':r.pontos===+m[3]})[m[2]]);return rows.map(r=>m[1]==='*'?r:{[m[1].toLowerCase()]:r[m[1].toLowerCase() as keyof typeof r]});}
