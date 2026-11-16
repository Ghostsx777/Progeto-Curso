import {readFileSync} from 'node:fs';
import {resolve,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../content/bootcamp');
const sections=['Objetivos','Pré-requisitos','Explicação','Conceitos e diagrama','Exemplo executável','Explicação do código','Exercício guiado','Exercícios independentes','Desafio prático','Erros comuns e boas práticas','Resumo','Verificação de aprendizagem','Referências e revisão'];
export function loadContent(){
 const manifest=JSON.parse(readFileSync(resolve(root,'manifest.json'),'utf8'));
 const orders=new Set();
 const lessons=manifest.lessons.map(lesson=>{
   const path=resolve(root,lesson.file);
   if(!path.startsWith(root+sep)||!path.endsWith('.md'))throw new Error('Caminho de conteúdo inválido.');
   if(orders.has(lesson.sort_order))throw new Error('Ordem de aula duplicada.');orders.add(lesson.sort_order);
   const body=readFileSync(path,'utf8');
   const missing=sections.filter(section=>!body.includes('## '+section));
   if(missing.length||body.split(/\s+/).length<500)throw new Error(`Aula incompleta: ${lesson.file}; seções ausentes: ${missing.join(', ')}`);
   if(!Number.isInteger(lesson.estimated_minutes)||lesson.estimated_minutes<=0)throw new Error('Duração inválida.');
   return {...lesson,body_md:body,words:body.split(/\s+/).length};
 });
 return {manifest,lessons};
}
