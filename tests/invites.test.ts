import {test} from 'node:test';import assert from 'node:assert/strict';
import {inviteStatus,invalidInviteMessage,inviteSchema} from '../src/lib/invites';
const now=Date.parse('2026-11-16T12:00:00Z');
const available={expires_at:'2026-11-20T15:30:00Z',used_at:null,revoked_at:null};
test('prazo futuro não permite reutilizar convite consumido',()=>{
 assert.equal(inviteStatus(available,now),'available');
 const used={...available,used_at:'2026-11-16T11:00:00Z'};
 assert.equal(inviteStatus(used,now),'used');
 assert.match(invalidInviteMessage(used,now)!,/já foi utilizado/);
 assert.equal(inviteStatus(used,Date.parse('2026-11-25T00:00:00Z')),'used');
});
test('expiração é inclusiva e revogação tem efeito imediato',()=>{
 assert.equal(inviteStatus({...available,expires_at:new Date(now).toISOString()},now),'expired');
 assert.equal(inviteStatus({...available,revoked_at:new Date(now).toISOString()},now),'revoked');
 assert.match(invalidInviteMessage(null,now)!,/não é válido/);
 assert.equal(inviteStatus({...available,expires_at:'invalid'},now),'expired');
});
test('prazo exige instante ISO com fuso, sem interpretação pelo fuso do servidor',()=>{
 assert.equal(inviteSchema.safeParse({email:'',expires_at:'2026-11-20T15:30:00Z'}).success,true);
 assert.equal(inviteSchema.safeParse({email:'',expires_at:'2026-11-20T12:30:00-03:00'}).success,true);
 assert.equal(inviteSchema.safeParse({email:'',expires_at:'2026-11-20T15:30'}).success,false);
});
