import {createHash} from 'node:crypto';
export const voice='pt_BR-faber-medium-v2';
export function revision(body:string){return createHash('sha256').update(body.replace(/\r\n/g,'\n')).digest('hex')}
