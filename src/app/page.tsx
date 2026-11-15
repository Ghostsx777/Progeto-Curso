const features = [
  {
    number: "01",
    title: "Aprendizagem estruturada",
    description: "Aulas guiadas, exemplos visuais, exercícios e projetos organizados numa única trilha.",
  },
  {
    number: "02",
    title: "Progresso individual",
    description: "Cada estudante acompanha as próprias aulas, entregas, avaliações e resultados.",
  },
  {
    number: "03",
    title: "Avanço por domínio",
    description: "Os módulos são desbloqueados quando os pré-requisitos são concluídos e aprovados.",
  },
];

const technologies = ["HTML", "CSS", "JavaScript", "React", "Node.js", "PostgreSQL", "TypeScript", "Git"];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080b14] text-slate-100 selection:bg-cyan-400/30">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(8,145,178,0.18),transparent_55%)]" />
      <div className="relative mx-auto max-w-7xl px-6 py-7 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <a href="/" className="flex items-center gap-3" aria-label="DevPath Academy início">
            <span className="grid size-10 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-lg font-black text-cyan-300">D</span>
            <span className="text-sm font-bold tracking-[0.16em]">DEVPATH <span className="text-cyan-300">ACADEMY</span></span>
          </a>
          <a href="/login" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/60 hover:text-cyan-200">
            Entrar na plataforma
          </a>
        </header>

        <section className="grid items-center gap-14 py-20 md:py-28 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
              <span className="size-1.5 rounded-full bg-cyan-300" /> Bootcamp Full Stack · 90 dias
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[1.06] tracking-tight sm:text-6xl lg:text-7xl">
              Transforme estudo em <span className="text-cyan-300">projetos reais.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
              Uma formação prática em desenvolvimento web, do primeiro HTML à construção e publicação de aplicações Full Stack.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="/login" className="rounded-xl bg-cyan-300 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">Acessar minha conta <span aria-hidden="true">→</span></a>
              <span className="rounded-xl border border-white/10 px-6 py-3.5 text-sm font-semibold text-slate-300">Acesso exclusivo por convite</span>
            </div>
            <div className="mt-12 flex flex-wrap gap-2">
              {technologies.map((technology) => (
                <span key={technology} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-400">{technology}</span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-300/15 bg-[#0d1422]/90 p-6 shadow-2xl shadow-cyan-950/20 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sua jornada</p>
                <h2 className="mt-2 text-xl font-bold">Full Stack Developer</h2>
              </div>
              <span className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">Trilha guiada</span>
            </div>
            <div className="my-8 h-px bg-white/10" />
            <div className="space-y-5">
              {[
                ["01", "Fundamentos da programação", "HTML · CSS · Lógica", "Conceitos"],
                ["02", "JavaScript", "DOM · Eventos · APIs", "Interatividade"],
                ["03", "React e interfaces", "Componentes · Estado", "Frontend"],
                ["04", "Backend e banco de dados", "Node.js · SQL · APIs", "Backend"],
                ["05", "Projeto final e publicação", "Deploy · Portfólio", "Projeto"],
              ].map(([number, title, detail, tag], index) => (
                <div key={number} className="flex items-center gap-4">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl border text-xs font-bold ${index === 0 ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-200" : "border-white/10 bg-white/[0.03] text-slate-500"}`}>{number}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-200">{title}</p>
                    <p className="mt-1 text-xs text-slate-500">{detail}</p>
                  </div>
                  <span className="hidden rounded-md bg-white/[0.04] px-2 py-1 text-[10px] text-slate-500 sm:inline">{tag}</span>
                </div>
              ))}
            </div>
            <p className="mt-8 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-xs leading-6 text-slate-400">
              O conteúdo completo de cada etapa é liberado conforme a conclusão das aulas, atividades e avaliações obrigatórias.
            </p>
          </div>
        </section>

        <section className="grid gap-4 border-t border-white/10 py-12 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.number} className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <p className="text-xs font-bold tracking-[0.2em] text-cyan-300">{feature.number}</p>
              <h2 className="mt-4 text-lg font-bold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
            </article>
          ))}
        </section>
        <footer className="flex flex-col gap-2 border-t border-white/10 py-7 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} DevPath Academy</span>
          <span>Formação independente · Acesso privado</span>
        </footer>
      </div>
    </main>
  );
}
