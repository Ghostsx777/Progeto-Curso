import {AcademyBrand} from '@/components/academy-brand';
import {ActionForm} from '@/components/action-form';import {recover} from '../auth-actions';
export default function Recovery(){return <main className="auth"><div className="card stack"><AcademyBrand/><h1 className="heading">Recuperar acesso</h1><p className="muted">Enviaremos as instruções para o email da sua conta.</p><ActionForm action={recover} label="Enviar instruções"><label>Email<input type="email" name="email" required/></label></ActionForm><a href="/login">Voltar ao login</a></div></main>;}

