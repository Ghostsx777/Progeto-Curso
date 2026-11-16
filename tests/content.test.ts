import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {loadContent} from '../scripts/content-library.mjs';
import {totalCompra} from '../content/bootcamp/examples/01-programas.mjs';
import {mediaDeNotas} from '../content/bootcamp/examples/02-dados.mjs';
import {resultadoDaAvaliacao} from '../content/bootcamp/examples/03-decisoes.mjs';
test('lote didático tem seções completas e corresponde ao código testado',()=>{
 const {manifest,lessons}=loadContent();assert.equal(manifest.status,'partial_draft');assert.equal(lessons.length,3);
 for(const lesson of lessons){const example=readFileSync(new URL('../content/bootcamp/examples/'+lesson.example,import.meta.url),'utf8').replace(/^export /gm,'').trim();assert.ok(lesson.body_md.includes(example),lesson.file);}
 assert.equal(lessons.reduce((sum:number,l:{estimated_minutes:number})=>sum+l.estimated_minutes,0),180);
});
test('exemplos e respostas numéricas das aulas são corretos',()=>{
 for(const [price,quantity,expected] of [[12,3,36],[5,4,20],[4,8,32],[4,0,0],[2,6,12],[0,7,0],[10,1,10]])assert.equal(totalCompra(price,quantity),expected);
 for(const [first,second,expected] of [[80,60,70],[65,85,75],[0,100,50],[70,70,70],[55,75,65]])assert.equal(mediaDeNotas(first,second),expected);
 for(const value of [70,100,80])assert.equal(resultadoDaAvaliacao(value),'Aprovado');
 for(const value of [0,69.99,69])assert.equal(resultadoDaAvaliacao(value),'Revisar e tentar novamente');
 for(const value of [-1,101,NaN,Infinity,null,'70','80'])assert.equal(resultadoDaAvaliacao(value),'Nota inválida');
});
