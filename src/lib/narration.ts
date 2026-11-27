import {createHash} from 'node:crypto';
export const voice='pt_BR-faber-medium';
export function revision(body:string){return createHash('sha256').update(body.replace(/\r\n/g,'\n')).digest('hex')}
