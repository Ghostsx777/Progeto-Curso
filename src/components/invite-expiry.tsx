'use client';
import {useState} from 'react';
export function InviteExpiry(){
 const [deadline,setDeadline]=useState('');
 const parsed=deadline?new Date(deadline):null;
 const iso=parsed&&Number.isFinite(parsed.getTime())?parsed.toISOString():'';
 return <><label>Data e hora de expiração<input type="datetime-local" value={deadline} onChange={event=>setDeadline(event.target.value)} required step={60}/></label><input type="hidden" name="expires_at" value={iso}/><p className="muted text-xs">Escolha no fuso horário do seu dispositivo. O servidor armazena o instante em UTC. Um convite utilizado deixa de valer imediatamente, mesmo antes desse prazo.</p></>;
}
