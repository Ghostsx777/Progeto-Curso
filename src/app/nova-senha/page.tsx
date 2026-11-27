import {database} from '@/lib/supabase';
import Link from 'next/link';
import {AcademyBrand} from '@/components/academy-brand';
import {ActionForm} from '@/components/action-form';import {changePassword,openRecovery} from '../auth-actions';
export default async function NewPassword({searchParams}:{searchParams:Promise<{code?:string;token_hash?:string;error?:string;error_code?:string}>}){
 const {code,token_hash,error,error_code}=await searchParams;
 const retry=<Link href="/recuperar-senha">Pedir novo link de recuperação</Link>;
 if(!error&&!error_code&&(code||token_hash))return <main className="auth"><div className="card stack"><AcademyBrand/><h1 className="heading">Recuperar sua conta</h1><p>Continue para escolher sua nova senha.</p><ActionForm action={openRecovery} label="Continuar"><input type="hidden" name={token_hash?'token_hash':'code'} value={token_hash||code}/></ActionForm>{retry}</div></main>;
 const db=await database();
 if(error||error_code||!(await db.auth.getUser()).data.user)return <main className="auth"><div className="card stack"><AcademyBrand/><h1 className="heading">Link de recuperação indisponível</h1><p>Abra o email mais recente no mesmo navegador em que pediu a recuperação. Se o link expirou ou já foi usado, solicite outro.</p>{retry}</div></main>;
 return <main className="auth"><div className="card stack"><AcademyBrand/><h1 className="heading">Nova senha</h1><ActionForm action={changePassword} label="Atualizar senha"><label>Nova senha<input type="password" name="password" minLength={12} maxLength={128} autoComplete="new-password" required/></label></ActionForm></div></main>;}


