import {test} from 'node:test';import assert from 'node:assert/strict';import {contentSchema} from '../src/lib/content-schema';
const module={kind:'module',id:'',course_id:'20000000-0000-4000-8000-000000000001',title:'Fundamentos',slug:'fundamentos',description:'',preview:'',sort_order:1,pass_mark:70,published:false};
test('conteúdo valida identificadores, ordem e nota antes de chamar o banco',()=>{
 assert.equal(contentSchema.safeParse(module).success,true);
 for(const invalid of [{slug:'Com espaços'},{sort_order:-1},{pass_mark:69},{course_id:'invalido'},{title:'A'}])assert.equal(contentSchema.safeParse({...module,...invalid}).success,false);
});
test('rascunhos podem estar vazios; conteúdo publicado exige texto',()=>{
 const lesson={kind:'lesson',id:'',module_id:module.course_id,title:'Introdução',sort_order:1,estimated_minutes:45,required:true,published:false,body_md:''};
 assert.equal(contentSchema.safeParse(lesson).success,true);
 assert.equal(contentSchema.safeParse({...lesson,published:true}).success,false);
 assert.equal(contentSchema.safeParse({...lesson,published:true,body_md:'Uma explicação completa. '.repeat(10)}).success,true);
});
