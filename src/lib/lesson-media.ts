import {z} from 'zod';
import {unified} from 'unified';
import remarkParse from 'remark-parse';

export const imageHosts=['wwizysqyxiavcftwagrq.supabase.co','images.unsplash.com','upload.wikimedia.org'];
export function safeHttps(value:string){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!/^(localhost|.*\.localhost|.*\.local)$/.test(u.hostname)&&!/[\[\]:]/.test(u.hostname)&&!/^\d+(\.\d+)*$/.test(u.hostname)?u:null;}catch{return null;}}
export function imageUrl(value:string){if(/^\/media\/[a-zA-Z0-9/_-]+\.(png|jpg|jpeg|webp|avif|gif)$/.test(value))return value;const u=safeHttps(value);return u&&imageHosts.includes(u.hostname)&&/\.(png|jpe?g|webp|avif|gif)$/i.test(u.pathname)?u.href:null;}
export function youtubeId(value:string){const u=safeHttps(value);if(!u)return null;let id:string|null=null;if(u.hostname==='youtu.be')id=u.pathname.slice(1);else if(['youtube.com','www.youtube.com','www.youtube-nocookie.com'].includes(u.hostname)){if(u.pathname==='/watch')id=u.searchParams.get('v');else id=/^\/(?:embed|shorts)\/([^/]+)$/.exec(u.pathname)?.[1]||null;}return id&&/^[\w-]{11}$/.test(id)?id:null;}
const text=z.string().trim().min(1).max(2000),title=z.string().trim().min(1).max(160);
export const mediaSchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('image'),src:z.string().refine(v=>!!imageUrl(v),'Imagem: use /media ou PNG/JPEG/WebP/AVIF/GIF de um domínio autorizado.'),alt:title,caption:text,width:z.enum(['small','medium','wide']).default('medium'),align:z.enum(['left','center','right']).default('center')}),
 z.object({type:z.literal('video'),url:z.string().refine(v=>!!youtubeId(v),'Use um link válido do YouTube.'),title,description:text}),
 z.object({type:z.literal('callout'),tone:z.enum(['tip','warning','concept']),title,body:text}),
 z.object({type:z.literal('glossary'),term:title,definition:text}),
 z.object({type:z.literal('reference'),title,description:text,source:title,url:z.string().refine(v=>!!safeHttps(v),'A referência precisa de HTTPS público.')}),
 z.object({type:z.literal('code'),language:z.string().regex(/^[a-z0-9+-]{1,20}$/),code:z.string().max(20000),title,explanation:text,input:z.string().max(2000).default(''),output:z.string().max(2000).default(''),lineNumbers:z.boolean().default(true),highlight:z.array(z.number().int().min(1).max(1000)).max(100).default([])}),
 z.object({type:z.literal('playground'),mode:z.enum(['html','javascript','sql','algorithm']),title,code:z.string().max(12000),css:z.string().max(8000).default(''),expected:z.string().max(2000).default('')}),
]);
export type MediaBlock=z.infer<typeof mediaSchema>;
export function parseMedia(source:string){try{return mediaSchema.safeParse(JSON.parse(source));}catch{return mediaSchema.safeParse(null);}}
export function mediaFence(block:MediaBlock){return '\n\n````devpath\n'+JSON.stringify(block,null,2)+'\n````\n\n';}
export function diagramError(code:string){if(code.length>8000)return 'Diagrama limitado a 8.000 caracteres.';if(/%%\{|^---|\bclick\b|<|>|https?:|data:/m.test(code.replace(/-{1,2}>>?/g,'')))return 'Diagrama: não use HTML, links, cliques ou configurações embutidas.';if(!/^\s*(flowchart|graph|sequenceDiagram|classDiagram|erDiagram|stateDiagram(?:-v2)?|mindmap)\b/.test(code))return 'Tipo de diagrama não autorizado.';return null;}
type Node={type:string;lang?:string;value?:string;url?:string;alt?:string;depth?:number;children?:Node[];position?:{start:{offset?:number};end:{offset?:number}}};
export function markdownTree(body:string){return unified().use(remarkParse).parse(body) as Node;}
export function walk(node:Node,fn:(n:Node)=>void){fn(node);node.children?.forEach(n=>walk(n,fn));}
export function validateLesson(body:string){const errors:string[]=[];let count=0;walk(markdownTree(body),n=>{
 if(n.type==='code'&&n.lang==='devpath'){count++;const p=parseMedia(n.value||'');if(!p.success)errors.push(p.error.issues[0]?.message||'Bloco didático inválido.');}
 if(n.type==='code'&&n.lang==='mermaid'){count++;const error=diagramError(n.value||'');if(error)errors.push(error);}
 if(n.type==='image'&&(!imageUrl(n.url||'')||!n.alt?.trim()))errors.push('Imagem Markdown precisa de URL autorizada e descrição alternativa.');
 if(n.type==='html')errors.push('HTML embutido não é permitido. Use os blocos didáticos.');
 if((n.type==='link'||n.type==='definition')&&n.url&&!n.url.startsWith('#')&&!safeHttps(n.url))errors.push('Links precisam de HTTPS público.');
 });if(count>50)errors.push('Use no máximo 50 blocos didáticos por aula.');return errors;}
export function lessonLinks(body:string){const urls=new Set<string>();walk(markdownTree(body),n=>{if((n.type==='link'||n.type==='definition')&&n.url&&safeHttps(n.url))urls.add(n.url);if(n.type==='code'&&n.lang==='devpath'){const p=parseMedia(n.value||'');if(p.success&&p.data.type==='reference')urls.add(p.data.url);}});return [...urls];}
export function headings(body:string){const result:{id:string;text:string;depth:number;offset:number|undefined}[]=[];walk(markdownTree(body),n=>{if(n.type==='heading'){let text='';walk(n,c=>{if(c.type==='text'||c.type==='inlineCode')text+=c.value;});result.push({id:`section-${result.length+1}`,text,depth:n.depth||2,offset:n.position?.start.offset});}});return result;}
export function mediaRanges(body:string){const ranges:{start:number;end:number;source:string}[]=[];walk(markdownTree(body),n=>{if(n.type==='code'&&['devpath','mermaid'].includes(n.lang||'')&&n.position){const start=n.position.start.offset!,end=n.position.end.offset!;ranges.push({start,end,source:body.slice(start,end)});}});return ranges;}
