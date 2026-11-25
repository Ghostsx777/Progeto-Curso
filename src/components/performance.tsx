'use client';
import {useState} from 'react';
import {ChartNoAxesCombined} from 'lucide-react';

type Grade = {date:string;value:number};
export function Performance({grades,asOf}:{grades:Grade[];asOf:number}){
 const [days,setDays]=useState(30);
 const start=asOf-days*86400000;
 const points=grades.filter(g=>Date.parse(g.date)>=start).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date))
  .map(g=>({...g,x:24+(Date.parse(g.date)-start)/(asOf-start)*452,y:115-g.value}));
 return <article className="card"><div className="chart-heading"><h2><ChartNoAxesCombined/>Seu desempenho</h2>
 <select aria-label="Período das notas" value={days} onChange={e=>setDays(Number(e.target.value))}>{[7,30,90].map(n=><option value={n} key={n}>Últimos {n} dias</option>)}</select></div>
 {points.length?<><svg className="grade-chart" viewBox="0 0 500 140" role="img" aria-label="Evolução das notas de zero a cem">
 {[0,50,100].map(n=><g key={n}><line x1="24" x2="485" y1={115-n} y2={115-n} stroke="#213451"/><text x="0" y={118-n} fill="#a8bed5" fontSize="10">{n}</text></g>)}
 <polyline points={points.map(p=>p.x+','+p.y).join(' ')} stroke="#00daff" strokeWidth="2.5" fill="none"/>
 {points.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3" fill="#00daff"><title>{p.date.slice(0,10)} · {p.value}/100</title></circle>)}</svg>
 <details><summary>Consultar notas do período</summary><ul>{points.map((p,i)=><li key={i}>{new Date(p.date).toLocaleDateString('pt-BR',{timeZone:'UTC'})} · {p.value}/100</li>)}</ul></details></>:<p>Nenhuma nota recebida neste período. As correções aparecerão aqui.</p>}</article>;
}
