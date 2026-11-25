import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recoveryResult} from '../src/lib/recovery-result';

test('recuperação distingue cota de email, espera e falha do provedor', () => {
 assert.match(recoveryResult({status:429,code:'over_email_send_rate_limit'}).error!, /limite de emails/);
 assert.match(recoveryResult({status:429}).error!, /pedidos recentes/);
 assert.match(recoveryResult({status:500}).error!, /administrador/);
 assert.deepEqual(recoveryResult({code:'user_not_found'}), recoveryResult(null));
});
