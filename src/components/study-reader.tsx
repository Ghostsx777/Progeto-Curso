'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Pause,Play,RotateCcw,RotateCw} from 'lucide-react';
import {LessonContent} from './lesson-content';
import {headings} from '@/lib/lesson-media';
import {bookmark,savePosition} from '@/app/painel/learning-actions';

type Cue={anchor:string;start:number;end:number};
type Track={url:string;cues:Cue[];seconds:number;voice:string};
type Props={id:string;title:string;body:string;initial:{section:string;seconds:number;sections:string[]};stars:string[];tracks:Track[]};
function clock(value:number){return Math.floor(value/60)+':'+String(Math.floor(value%60)).padStart(2,'0')}
export function StudyReader({id,title,body,initial,stars,tracks}:Props){
 const content=useMemo(()=><LessonContent body={body} reading hideIndex/>,[body]);
 const [playing,setPlaying]=useState(false);
 const root=useRef<HTMLDivElement>(null),audio=useRef<HTMLAudioElement>(null);
 const toc=useMemo(()=>headings(body),[body]);
 const [section,setSection]=useState(initial.section||toc[0]?.id||''),[done,setDone]=useState(initial.sections);
 const [time,setTime]=useState(initial.seconds),[voice,setVoice]=useState(0),[rate,setRate]=useState(0.75),[volume,setVolume]=useState(1);
 const [follow,setFollow]=useState(true),[focused,setFocused]=useState(false),[query,setQuery]=useState('');
 const [hits,setHits]=useState<{anchor:string;text:string}[]>([]),[marks,setMarks]=useState(stars),[feedback,setFeedback]=useState('');
 const track=tracks[voice], cue=track?.cues.findIndex(c=>c.end>time)??-1;
 const position=useRef({section,seconds:time,sections:done}),lastSave=useRef(''),queue=useRef(Promise.resolve());
 const persist=useCallback(()=>{
  const snapshot={...position.current},key=JSON.stringify(snapshot);if(lastSave.current===key)return;
  lastSave.current=key;
  queue.current=queue.current.then(async()=>{if(!await savePosition(id,snapshot.section,snapshot.seconds,snapshot.sections))throw Error()}).catch(()=>{lastSave.current='';setFeedback('Falha ao guardar o ponto de leitura.')});
 },[id]);
 useEffect(()=>{
  const first=decodeURIComponent(location.hash.slice(1))||initial.section;
  if(first)document.getElementById(first)?.scrollIntoView();
  function scroll(){
   const current=toc.filter(h=>(document.getElementById(h.id)?.getBoundingClientRect().top??Infinity)<=130).at(-1)??toc[0];
   if(current){position.current.section=current.id;setSection(current.id)}
  }
  window.addEventListener('scroll',scroll,{passive:true});const timer=setInterval(persist,4000);
  document.addEventListener('visibilitychange',persist);persist();
  return()=>{window.removeEventListener('scroll',scroll);document.removeEventListener('visibilitychange',persist);clearInterval(timer);persist();document.body.classList.remove('study-focus')};
 },[id,toc,initial.section,persist]);
 const panel=useRef<HTMLElement>(null);
 const [compact,setCompact]=useState(false);
 useEffect(()=>{
  const target=panel.current;
  if(!target||!track)return;
  const observer=new IntersectionObserver(([entry])=>setCompact(!entry.isIntersecting));
  observer.observe(target);
  return ()=>observer.disconnect();
 },[track]);
 useEffect(()=>{
  const player=audio.current;
  if(player){player.defaultPlaybackRate=rate;player.playbackRate=rate}
 },[track,rate]);
 const resumeAt=useRef(initial.seconds);
 useEffect(()=>{
  const element=audio.current;
  if(!element||!track)return;
  function restore(){
   if(element&&track){element.currentTime=Math.min(resumeAt.current,track.seconds);setTime(element.currentTime);position.current.seconds=element.currentTime}
  }
  if(element.readyState>=1)restore();
  else element.addEventListener('loadedmetadata',restore,{once:true});
  return()=>element.removeEventListener('loadedmetadata',restore);
 },[track]);
 useEffect(()=>{const active=cue>=0&&track?document.getElementById(track.cues[cue].anchor):null;
  if(!active||audio.current?.paused)return;
  active.classList.add('spoken');if(follow)active.scrollIntoView({block:'center'});
  return()=>active.classList.remove('spoken');
 },[cue,track,follow,playing]);
 useEffect(()=>{const text=query.trim().toLocaleLowerCase();const nodes=root.current?.querySelectorAll<HTMLElement>('.prose [id]')??[];
  setHits(text?Array.from(nodes).filter(n=>n.innerText.toLocaleLowerCase().includes(text)).slice(0,30).map(n=>({anchor:n.id,text:n.innerText.slice(0,125)})):[]);
 },[query]);
 async function star(anchor:string,label:string){
  const remove=marks.includes(anchor);if(await bookmark(id,anchor,label.slice(0,240),remove)){setMarks(prev=>remove?prev.filter(a=>a!==anchor):[...prev,anchor]);setFeedback(remove?'Favorito removido.':'Favorito salvo.')}else setFeedback('Não foi possível salvar o favorito.');
 }
 function seek(seconds:number){if(audio.current&&track){const t=Math.max(0,Math.min(track.seconds,seconds));audio.current.currentTime=t;setTime(t);position.current.seconds=t;persist()}}
 const current=toc.find(h=>h.id===section),index=toc.findIndex(h=>h.id===section);
 return <div ref={root} className="study-reader"><div className="reader-tools">
 <button className="btn secondary" aria-pressed={focused} onClick={()=>{document.body.classList.toggle('study-focus',!focused);setFocused(!focused)}}>{focused?'Sair da concentração':'Concentração'}</button>
 <button aria-pressed={marks.includes('')} onClick={()=>void star('',title)}>{marks.includes('')?'Remover aula dos favoritos':'Favoritar aula'}</button><a href="#anotacoes">Anotar</a><a href={toc.find(h=>/glossário/i.test(h.text))?'#'+toc.find(h=>/glossário/i.test(h.text))!.id:'/painel/recursos/glossario'}>Glossário</a></div>
 <section ref={panel} className="audio-panel"><h2>Ouvir aula</h2>{track?<><audio ref={audio} controls preload="metadata" src={track.url} onTimeUpdate={e=>{position.current.seconds=e.currentTarget.currentTime;setTime(e.currentTarget.currentTime)}} onPlay={()=>setPlaying(true)} onPause={()=>{setPlaying(false);persist()}} onError={()=>setFeedback('Falha ao carregar o áudio. Reabra a aula para renovar o acesso.')}/>
 <div className="reader-tools"><button onClick={()=>seek(time-15)}>Voltar 15 s</button><button onClick={()=>seek(time+15)}>Avançar 15 s</button><button onClick={()=>seek(track.cues[Math.max(0,(cue<0?track.cues.length:cue)-1)].start)}>Parágrafo anterior</button><button onClick={()=>seek(track.cues[Math.min(track.cues.length-1,cue+1)].start)}>Próximo parágrafo</button></div>
 <div className="reader-tools"><label>Velocidade<select value={rate} onChange={e=>{setRate(+e.target.value);if(audio.current)audio.current.playbackRate=+e.target.value}}>{[0.75,1,1.25,1.5,2].map(n=><option key={n} value={n}>{n}×</option>)}</select></label><label>Volume<input type="range" min="0" max="1" step=".05" value={volume} onChange={e=>{setVolume(+e.target.value);if(audio.current)audio.current.volume=+e.target.value}}/></label>
 {tracks.length>1&&<label>Voz<select value={voice} onChange={e=>{resumeAt.current=time;setVoice(+e.target.value)}}>{tracks.map((t,i)=><option key={t.voice} value={i}>{t.voice}</option>)}</select></label>}<label><input type="checkbox" checked={follow} onChange={e=>setFollow(e.target.checked)}/>Acompanhar leitura</label><small>{clock(time)} decorrido · {clock(Math.max(0,track.seconds-time))} restante</small></div></>:<p>A narração desta versão ainda aguarda preparação ou revisão. A aula completa está disponível abaixo.</p>}</section>
 {track&&compact&&<div className="mini-narrator" role="group" aria-label="Controles rápidos de narração">
 <button aria-label="Retroceder 15 segundos" title="Retroceder 15 segundos" onClick={()=>seek((audio.current?.currentTime??time)-15)}><RotateCcw size={17}/>15</button>
 <button className="mini-play" aria-label={playing?'Pausar narração':'Reproduzir narração'} title={playing?'Pausar':'Reproduzir'} onClick={()=>{const player=audio.current;if(!player)return;if(player.paused)void player.play().catch(()=>setFeedback('Não foi possível reproduzir o áudio.'));else player.pause()}}>{playing?<Pause size={20}/>:<Play size={20}/>}</button>
 <button aria-label="Avançar 15 segundos" title="Avançar 15 segundos" onClick={()=>seek((audio.current?.currentTime??time)+15)}>15<RotateCw size={17}/></button></div>}
 <div className="reader-grid"><aside><label>Buscar nesta aula<input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label>{query&&<ul>{hits.length?hits.map(h=><li key={h.anchor}><a href={'#'+h.anchor}>{h.text}</a> <button onClick={()=>void star(h.anchor,h.text)}>{marks.includes(h.anchor)?'Remover favorito':'Favoritar trecho'}</button></li>):<li>Nenhum trecho encontrado.</li>}</ul>}
 <details open><summary>Índice da aula</summary><small>{done.length} de {toc.length} seções revisadas</small><nav>{toc.map(h=><a key={h.id} href={'#'+h.id} aria-current={section===h.id?'location':undefined}>{done.includes(h.id)?'✓ ':''}{h.text}</a>)}</nav></details>
 {current&&<div className="reader-tools"><button onClick={()=>void star(section,current.text)}>{marks.includes(section)?'Remover seção favorita':'Favoritar seção'}</button><button onClick={()=>{const updated=done.includes(section)?done.filter(s=>s!==section):[...done,section];position.current.sections=updated;setDone(updated);persist()}}>{done.includes(section)?'Desmarcar revisão':'Marcar seção revisada'}</button>{index>0&&<a href={'#'+toc[index-1].id}>Seção anterior</a>}{index+1<toc.length&&<a href={'#'+toc[index+1].id}>Próxima seção</a>}</div>}</aside><div className="reader-body">{content}</div></div><small role="status">{feedback}</small></div>;
}
