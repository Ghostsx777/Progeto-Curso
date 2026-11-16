import {test} from 'node:test';import assert from 'node:assert/strict';import {tutorInput,responseText,TUTOR_INSTRUCTIONS} from '../src/lib/tutor';
test('professor limita contexto e recebe apenas mensagens, sem ferramentas administrativas',()=>{
 const input=tutorInput('Aula','x'.repeat(100000),Array.from({length:30},()=>({role:'user' as const,body:'y'.repeat(10000)})),'z'.repeat(9000),'Progresso próprio');
 assert.equal(input.length,8);assert.equal(input.at(-1)?.content.length,4000);assert.ok(JSON.stringify(input).length<35000);assert.match(TUTOR_INSTRUCTIONS,/Não pode alterar notas/);
});
test('professor lê apenas texto de mensagens e recusa estruturas inesperadas',()=>{
 assert.equal(responseText({output:[{type:'message',content:[{type:'output_text',text:'Explicação'}]},{type:'reasoning',content:[{type:'output_text',text:'Não exibir'}]}]}),'Explicação');
 for(const value of [null,{},'text',{output:'wrong'}])assert.equal(responseText(value),'');
});
