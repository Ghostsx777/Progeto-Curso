import {redirect} from 'next/navigation';
import {AcademyBrand} from '@/components/academy-brand';
import {ActionForm} from '@/components/action-form';import {changePassword} from '../auth-actions';
export default async function NewPassword({searchParams}:{searchParams:Promise<{code?:string}>}){
 const {code}=await searchParams;
 if(code) redirect('/auth/confirm?'+new URLSearchParams({code,type:'recovery'}));
 return <main className="auth"><div className="card stack"><AcademyBrand/><h1 className="heading">Nova senha</h1><ActionForm action={changePassword} label="Atualizar senha"><label>Nova senha<input type="password" name="password" minLength={12} maxLength={128} autoComplete="new-password" required/></label></ActionForm></div></main>;}


