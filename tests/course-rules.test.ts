import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canUnlockNextModule,calculateProgress} from '../src/lib/course-rules';
test('aprovação exige todos os requisitos e nota válida',()=>{
 const valid={requiredLessonsDone:true,requiredActivitiesApproved:true,projectApproved:true,finalExamGrade:70};
 assert.equal(canUnlockNextModule(valid),true);
 for(const key of ['requiredLessonsDone','requiredActivitiesApproved','projectApproved']) assert.equal(canUnlockNextModule({...valid,[key]:false}),false);
 for(const grade of [null,69,101,NaN,Infinity]) assert.equal(canUnlockNextModule({...valid,finalExamGrade:grade}),false);
});
test('progresso permanece entre 0 e 100 inclusive com entradas inválidas',()=>{
 assert.equal(calculateProgress(1,3),33);assert.equal(calculateProgress(10,3),100);
 assert.equal(calculateProgress(-2,3),0);assert.equal(calculateProgress(2,0),0);assert.equal(calculateProgress(NaN,4),0);
});
