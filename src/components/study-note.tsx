'use client';
import {useEffect,useRef,useState} from 'react';
import {note} from '@/app/painel/actions';
export function StudyNote({id,initial}:{id:string;initial:string}){
 const [value,setValue]=useState(initial),[status,setStatus]=useState('');
 const saved=useRef(initial),current=useRef(initial),busy=useRef(false);
 async function flush(){
  if(busy.current||saved.current===current.current)return;
  busy.current=true;
  try{while(saved.current!==current.current){
   const text=current.current,form=new FormData();form.set('id',id);form.set('body',text);
   const result=await note({},form);if(result.error){setStatus(result.error);return}saved.current=text;
  }setStatus('Salvo na sua conta.')}catch{setStatus('Falha ao salvar. Tente novamente.')}finally{busy.current=false}
 }
 useEffect(()=>{const timer=setTimeout(()=>void flush(),700);return()=>clearTimeout(timer)},[value]);
 function change(text:string){current.current=text;setValue(text);setStatus('Alterações pendentes')}
 return <section className="card stack" id="anotacoes"><h2 className="title">Meu diário</h2><label>Anotações privadas<textarea maxLength={20000} value={value} onBlur={()=>void flush()} onChange={e=>change(e.target.value)}/></label><div><button className="btn secondary" onClick={()=>void flush()}>Salvar agora</button> <button onClick={()=>{change('');void flush()}}>Limpar anotação</button></div><small role="status">{status}</small></section>
}
