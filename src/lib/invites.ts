import {z} from 'zod';
export const inviteSchema=z.object({expires_at:z.iso.datetime({offset:true}),email:z.union([z.literal(''),z.email().max(254)])});
export type InviteDates={used_at:string|null;revoked_at:string|null;expires_at:string};
export type InviteStatus='available'|'used'|'expired'|'revoked';
export function inviteStatus(invite:InviteDates,now=Date.now()):InviteStatus{
 if(invite.used_at)return 'used';
 if(invite.revoked_at)return 'revoked';
 const deadline=Date.parse(invite.expires_at);
 return !Number.isFinite(deadline)||deadline<=now?'expired':'available';
}
export function invalidInviteMessage(invite:InviteDates|null,now=Date.now()):string|null{
 if(!invite)return 'Este convite não é válido. Solicite um novo ao administrador.';
 switch(inviteStatus(invite,now)){
   case 'used':return 'Este convite já foi utilizado e não é mais válido. Solicite um novo ao administrador.';
   case 'revoked':return 'Este convite foi revogado pelo administrador e não é mais válido.';
   case 'expired':return 'Este convite expirou e não é mais válido. Solicite um novo ao administrador.';
   default:return null;
 }
}
