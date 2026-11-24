import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {loadContent} from '../scripts/content-library.mjs';
import {totalCompra} from '../content/bootcamp/examples/01-programas.mjs';
import {mediaDeNotas} from '../content/bootcamp/examples/02-dados.mjs';
import {resultadoDaAvaliacao} from '../content/bootcamp/examples/03-decisoes.mjs';
import {validateLesson,parseMedia} from '../src/lib/lesson-media';
test('lote didático tem seções completas e corresponde ao código testado',()=>{
 const {manifest,lessons}=loadContent();assert.equal(manifest.status,'partial_draft');assert.equal(lessons.length,3);
 for(const lesson of lessons){const example=readFileSync(new URL('../content/bootcamp/examples/'+lesson.example,import.meta.url),'utf8').replace(/\r\n/g,'\n').replace(/^export /gm,'').trim();assert.ok(lesson.body_md.replace(/\r\n/g,'\n').includes(example),lesson.file);}
 assert.equal(lessons.reduce((sum:number,l:{estimated_minutes:number})=>sum+l.estimated_minutes,0),300);
});
test('Aula 001 inclui conteúdo pedagógico, vídeo, diagrama e laboratório válidos',()=>{
 const {lessons}=loadContent();const lesson=lessons.find((l:{file:string})=>l.file==='01-programas.md')!;
 for(const heading of ['Situação real','O que é programar','Decompor o problema','Construir o algoritmo','Da solução ao JavaScript','teste de mesa','Debugging','Exercícios progressivos','Desafio prático','Glossário'])assert.ok(lesson.body_md.toLowerCase().includes(heading.toLowerCase()),heading);
 assert.deepEqual(validateLesson(lesson.body_md),[]);
 const markdown=lesson.body_md.replace(/\r\n/g,'\n');
 const video=markdown.match(/\x60{4}devpath\n([\s\S]*?)\n\x60{4}/g)?.map((s:string)=>s.replace(/^\x60{4}devpath\n|\n\x60{4}$/g,'' )).map((s:string)=>JSON.parse(s)).find((b:any)=>b.type==='video');
 const playground=markdown.match(/\x60{4}devpath\n([\s\S]*?)\n\x60{4}/g)?.map((s:string)=>s.replace(/^\x60{4}devpath\n|\n\x60{4}$/g,'' )).map((s:string)=>JSON.parse(s)).find((b:any)=>b.type==='playground');
 assert.ok(video);assert.equal(parseMedia(JSON.stringify(video)).success,true);assert.ok(playground);assert.equal(parseMedia(JSON.stringify(playground)).success,true);
 assert.match(lesson.body_md,/\x60{3,4}mermaid/);
});
test('exemplos e respostas numéricas das aulas são corretos',()=>{
 for(const [price,quantity,expected] of [[12,3,36],[5,4,20],[4,8,32],[4,0,0],[2,6,12],[0,7,0],[10,1,10]])assert.equal(totalCompra(price,quantity),expected);
 for(const [first,second,expected] of [[80,60,70],[65,85,75],[0,100,50],[70,70,70],[55,75,65]])assert.equal(mediaDeNotas(first,second),expected);
 for(const value of [70,100,80])assert.equal(resultadoDaAvaliacao(value),'Aprovado');
 for(const value of [0,69.99,69])assert.equal(resultadoDaAvaliacao(value),'Revisar e tentar novamente');
 for(const value of [-1,101,NaN,Infinity,null,'70','80'])assert.equal(resultadoDaAvaliacao(value),'Nota inválida');
});
