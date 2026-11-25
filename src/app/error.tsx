'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="auth"><section className="card stack"><img src="/academy/mark.svg" alt="DevPath Academy" width="48"/><h1 className="heading">Falha ao carregar a página</h1><button className="btn" onClick={reset}>Tentar novamente</button></section></main>}
