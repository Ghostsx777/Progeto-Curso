import {resolve4} from 'node:dns/promises';
import {request} from 'node:https';
import {safeHttps} from './lesson-media';
export function publicIPv4(ip:string){const a=ip.split('.').map(Number);if(a.length!==4||a.some(v=>!Number.isInteger(v)||v<0||v>255))return false;return !(a[0]===0||a[0]===10||a[0]===127||a[0]>=224||a[0]===192||a[0]===198||a[0]===203||a[0]===169&&a[1]===254||a[0]===172&&a[1]>=16&&a[1]<=31||a[0]===100&&a[1]>=64&&a[1]<=127);}
export async function checkReference(value:string,redirects=0):Promise<boolean>{
 const u=safeHttps(value);if(!u||redirects>3)return false;
 try{
  const addresses=await Promise.race([resolve4(u.hostname),new Promise<never>((_,reject)=>{const t=setTimeout(()=>reject(new Error('DNS timeout')),2500);t.unref();})]);
  if(!addresses.length||addresses.some(ip=>!publicIPv4(ip)))return false;
  // Pin the validated address; never resolve a second time during the request.
  const response=await new Promise<{status:number;location?:string}>((resolve,reject)=>{
   const req=request(u,{method:'HEAD',family:4,headers:{'User-Agent':'DevPath-Reference-Checker/1.0'},lookup:(_host,_options,callback)=>callback(null,addresses[0],4)},res=>{res.destroy();resolve({status:res.statusCode||0,location:res.headers.location});});
   const timer=setTimeout(()=>req.destroy(new Error('Timeout')),4000);req.on('close',()=>clearTimeout(timer));req.on('error',reject);req.end();
  });
  if(response.status>=300&&response.status<400&&response.location)return checkReference(new URL(response.location,u).href,redirects+1);
  return response.status>=200&&response.status<300;
 }catch{return false;}
}
export async function checkReferences(urls:string[]){if(urls.length>16)return ['Use no máximo 16 referências externas por aula.'];const failed:string[]=[];for(let i=0;i<urls.length;i+=4){await Promise.all(urls.slice(i,i+4).map(async u=>{if(!await checkReference(u))failed.push(u);}));}return failed;}
