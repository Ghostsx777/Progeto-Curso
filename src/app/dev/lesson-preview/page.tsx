import {notFound} from 'next/navigation';
import {LessonContent} from '@/components/lesson-content';
import {MarkdownEditor} from '@/components/markdown-editor';
import {mediaFence, type MediaBlock} from '@/lib/lesson-media';
export const dynamic='force-dynamic';
export default function Preview(){
 if(process.env.NODE_ENV!=='development'||process.env.LESSON_PREVIEW!=='true')notFound();
 const blocks:MediaBlock[]=[
 {type:'image',src:'/media/qa.png',alt:'Entrada, processamento e saída',caption:'Fluxo de um programa',width:'wide',align:'center'},
 {type:'video',url:'https://www.youtube.com/watch?v=UB1O30fR-EE',title:'HTML — vídeo externo',description:'Exemplo de incorporação, sem publicação no curso.'},
 {type:'code',language:'javascript',code:'const total = 2 + 3;\nconsole.log(total);',title:'Soma',explanation:'Somamos dois números.',input:'2 e 3',output:'5',lineNumbers:true,highlight:[2]},
 ...(['javascript','html','sql','algorithm'] as const).map(mode=>({type:'playground' as const,mode,title:'Laboratório '+mode,code:mode==='html'?'<h1>Olá</h1>':mode==='sql'?'SELECT nome FROM alunos WHERE pontos >= 70;':'console.log(2 + 3);',css:'h1 { color: blue; }',expected:mode==='javascript'?'5':''})),
 {type:'glossary',term:'Algoritmo',definition:'Sequência finita de instruções.'},
 {type:'callout',tone:'tip',title:'Pratique',body:'Altere os valores e observe a saída.'}
 ];
 const body='## Objetivos\nEntender entrada, processamento e saída.\n\n## Exemplos\n'+blocks.map(mediaFence).join('')+'\n```mermaid\nflowchart TD\n A[Entrada] --> B[Processamento]\n B --> C[Saída]\n```';
 return <main style={{maxWidth:1100,margin:'auto',padding:20}}><h1>Verificação local de aulas</h1><LessonContent body={body} reading/><section aria-label="Editor de teste"><MarkdownEditor name="body_md" value={"## Aula de teste\nTexto original."} label="Conteúdo" maxLength={100000}/></section></main>;
}
