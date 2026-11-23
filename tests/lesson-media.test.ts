import {test} from 'node:test';
import assert from 'node:assert/strict';
import {safeHttps,imageUrl,youtubeId,validateLesson,mediaFence,mediaSchema,lessonLinks,headings,mediaRanges,diagramError} from '../src/lib/lesson-media';
import {publicIPv4,checkReference} from '../src/lib/check-references';
import {javascriptPreview,simulateSql} from '../src/lib/playground';
test('media: rejects untrusted URLs and unsafe markup',()=>{
 for(const url of ['javascript:alert(1)','http://example.com','https://localhost/x','https://127.0.0.1','https://user:pass@example.com','https://example.com:444'])assert.equal(safeHttps(url),null);
 assert.equal(imageUrl('https://evil.test/photo.png'),null);
 assert.equal(imageUrl('/media/../secret.png'),null);
 assert.equal(imageUrl('https://upload.wikimedia.org/image.svg'),null);
 assert.ok(imageUrl('/media/diagram.png'));
 assert.equal(youtubeId('https://youtube.com.evil.test/watch?v=UB1O30fR-EE'),null);
 assert.equal(youtubeId('https://youtu.be/UB1O30fR-EE'),'UB1O30fR-EE');
 for(const body of ['<script>alert(1)</script>','![](/media/diagram.png)','[bad](javascript:alert)','```devpath\n{}\n```'])assert.ok(validateLesson(body).length);
 assert.deepEqual(validateLesson('```html\n<script>example only</script>\n```'),[]);
});
test('media: structured blocks, headings, references and ranges remain Markdown',()=>{
 const block=mediaSchema.parse({type:'reference',title:'MDN',description:'Documentação',source:'Mozilla',url:'https://developer.mozilla.org/'});
 const body='## Objetivos\n'+mediaFence(block);
 assert.deepEqual(validateLesson(body),[]);assert.deepEqual(lessonLinks(body),['https://developer.mozilla.org/']);
 assert.equal(headings(body)[0].text,'Objetivos');assert.equal(mediaRanges(body).length,1);
 assert.ok(diagramError('flowchart TD\n click A "https://evil.test"'));
 assert.equal(diagramError('flowchart TD\n A --> B'),null);
});
test('references: rejects internal addresses without making requests',async()=>{
 for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','172.16.0.1','192.168.0.1','100.64.0.1','0.0.0.0'])assert.equal(publicIPv4(ip),false);
 assert.equal(publicIPv4('8.8.8.8'),true);assert.equal(await checkReference('https://127.0.0.1'),false);
});
test('playgrounds: SQL is constrained and script payload cannot escape its envelope',()=>{
 assert.deepEqual(simulateSql('SELECT nome FROM alunos WHERE pontos >= 70;'),[{nome:'Ana'},{nome:'Carla'}]);
 assert.throws(()=>simulateSql('DROP TABLE alunos;'));assert.throws(()=>simulateSql('SELECT * FROM auth.users;'));
 const doc=javascriptPreview('</script><script>alert(1)</script>');assert.equal((doc.match(/<script>/g)||[]).length,1);assert.ok(doc.endsWith('</script>'));assert.ok(doc.includes("connect-src 'none'"));
});

import {reviewLesson} from '../src/lib/lesson-review';
test('publication: draft does not fetch, review required, broken references block publication',async()=>{
 let calls=0;const verify=async(urls:string[])=>{calls++;return urls;};
 const body='[Documentação](https://example.com/docs)';
 assert.equal(await reviewLesson(body,false,false,verify),undefined);assert.equal(calls,0);
 assert.match((await reviewLesson(body,true,false,verify))!,/revisão/);assert.equal(calls,0);
 assert.match((await reviewLesson(body,true,true,verify))!,/Publicação interrompida/);assert.equal(calls,1);
 assert.equal(await reviewLesson(body,true,true,async()=>[]),undefined);
 assert.ok(await reviewLesson('<script>alert(1)</script>',false,false,verify));
});
