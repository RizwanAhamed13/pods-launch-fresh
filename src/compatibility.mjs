const families = {
  'Browser frontends': ['react','angular','vue','svelte','preact','solid','lit','alpine'],
  'SSR and full-stack': ['next','nuxt','sveltekit','astro','react-router','angular-ssr'],
  'Node.js backends': ['express','fastify','nestjs','hono','koa','adonis'],
  'Python and data services': ['flask-sqlite','flask-postgres','flask-mysql','flask-mariadb','flask-redis','flask-valkey','flask-mongodb7','fastapi','fastapi-api','django','streamlit','gradio'],
  'Java and Kotlin': ['spring-boot','quarkus','micronaut','ktor'],
  'Go': ['go','gin','echo','fiber'], 'Rust': ['axum','actix','rocket'],
  '.NET': ['aspnet','blazor'], 'PHP': ['php','laravel','symfony'],
  'Ruby': ['rails','sinatra'], 'Other runtimes': ['deno','bun','phoenix'],
  'Combined apps and workers': ['react-express-postgres','worker-redis'],
};
const labels = {
  react:'React',angular:'Angular',vue:'Vue',svelte:'Svelte',preact:'Preact',solid:'Solid',lit:'Lit',alpine:'Alpine',
  next:'Next.js',nuxt:'Nuxt',sveltekit:'SvelteKit',astro:'Astro','react-router':'React Router','angular-ssr':'Angular SSR + SQLite',
  express:'Express',fastify:'Fastify',nestjs:'NestJS',hono:'Hono',koa:'Koa',adonis:'AdonisJS',
  'flask-sqlite':'Flask + SQLite','flask-postgres':'Flask + PostgreSQL','flask-mysql':'Flask + MySQL','flask-mariadb':'Flask + MariaDB',
  'flask-redis':'Flask + Redis','flask-valkey':'Flask + Valkey','flask-mongodb7':'Flask + MongoDB 7',
  fastapi:'FastAPI', 'fastapi-api':'FastAPI JSON API + SQLite',django:'Django + SQLite',streamlit:'Streamlit',gradio:'Gradio',
  'spring-boot':'Spring Boot + SQLite',quarkus:'Quarkus + SQLite',micronaut:'Micronaut + SQLite',ktor:'Ktor + SQLite',
  go:'Go net/http',gin:'Gin',echo:'Echo',fiber:'Fiber',axum:'Axum',actix:'Actix Web',rocket:'Rocket',
  aspnet:'ASP.NET Core',blazor:'Blazor Server + SQLite',php:'PHP',laravel:'Laravel + SQLite',symfony:'Symfony',rails:'Rails + SQLite',sinatra:'Sinatra',
  deno:'Deno',bun:'Bun WebSocket + SQLite',phoenix:'Elixir / Phoenix','react-express-postgres':'React + Express + PostgreSQL','worker-redis':'Flask + Python worker + Redis',
};
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const verified = (row, provider) => row.nativeAcceptance?.[provider === 'google' ? 'googleBrowser' : 'codespacesProtocol'] === true;
export function renderCompatibility(coverage) {
  const rows = coverage.fixtures.filter(row => row.serverPassed && row.browserPassed);
  const count = provider => rows.filter(row => verified(row, provider)).length;
  const table = rows.map(row => {
    const family = Object.entries(families).find(([,ids]) => ids.includes(row.fixture))?.[0] || 'Other';
    return `<tr><th scope="row">${escape(labels[row.fixture] || row.fixture)}<small>${escape(family)}</small></th><td>Passed</td><td>${verified(row,'google')?'Passed':'Pending'}</td><td>${verified(row,'codespaces')?'Passed':'Pending'}</td></tr>`;
  }).join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Application compatibility — PODS</title><link rel="stylesheet" href="/style.css"><script type="module" src="/support.js"></script></head><body>
<a class="skip-link" href="#main">Skip to content</a><header><a class="brand" href="/" aria-label="PODS home">pods<span aria-hidden="true"></span></a><span class="header-note">Good software. Your compute.</span><nav aria-label="Main"><a href="/">Try an app</a><a href="/develop">Prepare an app</a></nav></header>
<main id="main" class="compatibility"><section class="intro"><h1>Application compatibility.</h1><p>Real framework applications, tested from prepared artifacts. See what is verified and what is still pending.</p></section>
<section aria-labelledby="coverage-title"><h2 id="coverage-title">${rows.length} representative apps tested</h2><p>All ${rows.length} passed isolated server builds and browser interaction. ${count('google')} passed native Google Cloud Shell browser checks; ${count('codespaces')} passed Codespaces HTTP or protocol checks.</p><p><strong>Codespaces browser sign-in and interaction remain pending.</strong> A passing representative does not guarantee every repository using that framework will work.</p></section>
<section aria-labelledby="matrix-title"><h2 id="matrix-title">Find your stack</h2><label for="stack-search">Filter by framework, language or database</label><input id="stack-search" type="search" placeholder="For example, Angular or PostgreSQL" autocomplete="off"><p id="match-count" role="status">${rows.length} applications shown</p><div class="matrix-scroll" tabindex="0" role="region" aria-label="Application test matrix"><table><caption class="sr-only">Representative application test results</caption><thead><tr><th scope="col">Application</th><th scope="col">Isolated build + browser</th><th scope="col">Cloud Shell browser</th><th scope="col">Codespaces HTTP / protocol</th></tr></thead><tbody>${table}</tbody></table></div></section>
<section aria-labelledby="requirements-title"><h2 id="requirements-title">What your application needs</h2><p>PODS detects conventional frontend builds and server projects. Existing Linux Dockerfile or Compose projects provide a path for other applications. Dependencies, migrations and required settings must already be declared; PODS cannot invent production secrets or database schemas.</p><p>Database checks cover SQLite, PostgreSQL, MySQL, MariaDB, Redis, Valkey and MongoDB 7 with write, read and stop/restart persistence. Frontend-only counters use browser storage and do not prove database durability. Database ports stay private.</p><p>Application types tested include browser frontends, server-rendered sites, web APIs with an existing interface, dashboards, WebSocket apps and workers with a web product. Native mobile or desktop apps, GPU workloads and non-web interactive programs are outside this preview workflow.</p></section>
<section aria-labelledby="timing-title"><h2 id="timing-title">Launch time depends on the environment</h2><p>The target is a usable product within 20 seconds on ready compute. Cached examples have met it; new compute and first image delivery can exceed it. Health checks, visible pages and successful interactions are measured separately.</p><a class="back-link" href="/develop">Prepare your application →</a></section></main><footer><span>Prepared by PODS. Running with you.</span><a href="/">Try an app</a></footer></body></html>`;
}
