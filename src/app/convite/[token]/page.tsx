import {AcademyBrand} from '@/components/academy-brand';
import {ActionForm} from '@/components/action-form';
import {register} from '@/app/auth-actions';
export default async function Invite({params}:{params:Promise<{token:string}>}){const {token}=await params;return <main className="auth"><div className="card"><AcademyBrand/><p className="eyebrow">DevPath Academy · Convite privado</p><h1 className="heading mt-4">Comece a sua jornada.</h1><ActionForm action={register} label="Criar minha conta"><input type="hidden" name="token" value={token}/><label>Nome completo<input name="full_name" minLength={3} maxLength={120} autoComplete="name" required/></label><label>Email<input name="email" type="email" autoComplete="email" required/></label><label>Senha · pelo menos 12 caracteres<input name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required/></label></ActionForm></div></main>;}

