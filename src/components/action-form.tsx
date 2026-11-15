'use client';
import {useActionState} from 'react';
export type FormState={error?:string;success?:string;link?:string};
export type FormAction=(state:FormState,data:FormData)=>Promise<FormState>;
export function ActionForm({action,children,label='Guardar',className='stack'}:{action:FormAction;children:React.ReactNode;label?:string;className?:string}){
 const [state,submit,pending]=useActionState(action,{});
 return <form action={submit} className={className}>{children}<button className="btn" disabled={pending}>{pending?'A processar…':label}</button><div aria-live="polite">{state.error&&<p role="alert" className="message">{state.error}</p>}{state.success&&<p className="message">{state.success}</p>}{state.link&&<p className="message break-all">Guarde este link; ele só aparece agora: <a href={state.link}>{state.link}</a></p>}</div></form>;
}
