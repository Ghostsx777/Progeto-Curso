import Link from 'next/link';
import {requireUser} from '@/lib/auth';
import {ActionForm} from '@/components/action-form';
import {InviteExpiry} from '@/components/invite-expiry';
import {inviteStatus} from '@/lib/invites';
import {invite,revoke} from '../actions';
const labels={available:'Disponível',used:'Utilizado',expired:'Expirado',revoked:'Revogado'};
type InviteRow={id:string;email:string|null;created_at:string;created_by:string;expires_at:string;used_at:string|null;used_by:string|null;revoked_at:string|null;creator:{full_name:string}|null;consumer:{full_name:string;email:string|null}|null};
function date(value:string|null){return value?new Date(value).toLocaleString('pt-PT',{timeZone:'UTC',dateStyle:'short',timeStyle:'medium'})+' UTC':'—';}
export default async function Invites(){
 const {db}=await requireUser(true);
 const {data,error}=await db.from('invites').select('id,email,created_at,created_by,expires_at,used_at,used_by,revoked_at,creator:profiles!invites_created_by_fkey(full_name),consumer:profiles!invites_used_by_fkey(full_name,email)').order('created_at',{ascending:false}).returns<InviteRow[]>();
 if(error)throw error;
 return <div className="stack"><div className="flex items-center justify-between"><h1 className="heading">Convites</h1><Link href="/admin/convites" className="btn secondary">Atualizar lista</Link></div><p className="muted">Cada link cria somente uma conta. O prazo nunca permite reutilizar um convite consumido.</p><div className="card"><ActionForm action={invite} label="Gerar convite seguro"><label>Email do convidado (opcional)<input name="email" type="email" maxLength={254}/></label><InviteExpiry/></ActionForm></div><div className="grid-cards">{data.map(i=>{const status=inviteStatus(i);return <article className="card stack" key={i.id}><div><span className="badge">{labels[status]}</span><h2 className="title mt-3">{i.email||'Sem restrição de email'}</h2></div><dl className="text-sm stack"><div><dt className="muted">Criado em</dt><dd>{date(i.created_at)}</dd><dd className="muted">Por {i.creator?.full_name||i.created_by}</dd></div><div><dt className="muted">Expiração</dt><dd>{date(i.expires_at)}</dd></div><div><dt className="muted">Utilizado em</dt><dd>{date(i.used_at)}</dd>{i.used_by&&<dd className="mt-1">{i.consumer?.full_name||i.used_by}<br/>{i.consumer?.email}<br/><span className="muted text-xs break-all">Conta: {i.used_by}</span></dd>}</div><div><dt className="muted">Revogado em</dt><dd>{date(i.revoked_at)}</dd></div></dl>{status==='available'&&<ActionForm action={revoke} label="Revogar convite"><input type="hidden" name="id" value={i.id}/></ActionForm>}</article>;})}</div>{!data.length&&<p className="card muted">Nenhum convite criado.</p>}</div>;
}
