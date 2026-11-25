import {AcademyBrand} from '@/components/academy-brand';
import Link from 'next/link';
import {ActionForm} from '@/components/action-form';
import {login} from '../auth-actions';
import {configured} from '@/lib/supabase';
export default async function Login({searchParams}:{searchParams:Promise<{message?:string}>}){
 const {message}=await searchParams;
 return <main className="auth"><div className="stack"><AcademyBrand/><div className="card"><p className="eyebrow">O próximo passo começa aqui</p><h1 className="heading mt-3">Bem-vindo de volta.</h1><p className="muted mt-4">Entre para continuar a sua formação.</p>{!configured()&&<p className="message mt-5">Ambiente ainda não configurado. O login será habilitado após conectar o Supabase.</p>}{message==='blocked'&&<p className="message">Conta indisponível. Contacte o administrador.</p>}{message==='password'&&<p className="message">Senha alterada. Entre novamente.</p>}<ActionForm action={login} label="Entrar na plataforma"><label>Email<input name="email" type="email" autoComplete="email" required/></label><label>Senha<input name="password" type="password" autoComplete="current-password" required/></label></ActionForm><Link href="/recuperar-senha" className="text-sm text-cyan-300">Esqueci a senha</Link></div><p className="muted text-center text-sm">Cadastro disponível exclusivamente por convite.</p></div></main>;
}

