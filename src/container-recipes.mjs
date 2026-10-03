import { readFile, readdir } from 'node:fs/promises';
import { sourcePath } from './detect.mjs';
// Generated only on the isolated build server. No recipe runs on user compute.
export async function containerRecipe(root, recipe) {
  const has = async p => Boolean(await sourcePath(root,p,{optional:true}));
  const text = p => readFile(root+'/'+p,'utf8');
  const common = 'WORKDIR /app\nCOPY . .\nENV PORT=8080 HOST=0.0.0.0 PODS_APP_DATA=/data\nEXPOSE 8080\n';
  const command = args => 'CMD '+JSON.stringify(args)+'\n';
  switch (recipe) {
    case 'node': {
      const pkg = JSON.parse(await text('package.json'));
      const scripts = pkg.scripts || {}, dependencies = {...pkg.dependencies,...pkg.devDependencies};
      let start = scripts['start:prod'] ? 'start:prod' : 'start';
      if ('@angular/ssr' in dependencies) {
        const servers = Object.keys(scripts).filter(name => /^serve:ssr(?::[a-zA-Z0-9_.-]+)?$/.test(name));
        if (servers.length > 1) throw new Error('Choose one Angular SSR application; multiple production servers need an existing Dockerfile.');
        if (servers.length === 1) start = servers[0];
        else if (/\bng\s+serve\b/.test(scripts[start] || '')) throw new Error('Angular SSR needs its production serve:ssr script; ng serve rebuilds on user compute.');
      }
      if (typeof scripts[start] !== 'string' || !scripts[start].trim()) throw new Error('Server framework needs its existing production start script.');
      const manager = String(pkg.packageManager || 'npm').split('@')[0];
      if (!['npm','pnpm','yarn','bun'].includes(manager)) throw new Error('Unknown Node package manager');
      const install = manager==='npm' ? (await has('package-lock.json') ? 'npm ci' : 'npm install') : manager==='bun' ? 'bun install --frozen-lockfile' : `corepack enable && ${manager} install --frozen-lockfile`;
      // Remove npm's download cache in the layer that creates it; retain installed dependencies.
      const preparation = manager==='npm'
        ? `RUN export npm_config_cache=/tmp/pods-npm-cache && ${install}${scripts.build?' && npm run build':''} && rm -rf /tmp/pods-npm-cache\n`
        : `RUN ${install}\n${scripts.build?`RUN ${manager} run build\n`:''}`;
      return `FROM ${manager==='bun'?'oven/bun:1':'node:24-bookworm-slim'}\n${common}${preparation}ENV NODE_ENV=production\n${command([manager,'run',start])}`;
    }
    case 'python': {
      const requirements = await has('requirements.txt') ? await text('requirements.txt') : await text('pyproject.toml');
      let cmd;
      if (await has('manage.py')) {
        const projects=[];for(const d of await readdir(root,{withFileTypes:true}))if(d.isDirectory()&&await has(d.name+'/wsgi.py'))projects.push(d.name);
        if(projects.length!==1)throw new Error('Django WSGI module is ambiguous; use the existing Dockerfile.');
        cmd=['sh','-c',`python manage.py migrate --noinput && exec gunicorn ${projects[0]}.wsgi:application --bind 0.0.0.0:8080`];
      } else if (/\bstreamlit\b/i.test(requirements)) cmd=['streamlit','run',await has('app.py')?'app.py':'main.py','--server.port=8080','--server.address=0.0.0.0'];
      else if (/\bgradio\b/i.test(requirements)) cmd=['python',await has('app.py')?'app.py':'main.py'];
      else if (/\bfastapi\b/i.test(requirements)) cmd=['uvicorn',await has('main.py')?'main:app':'app:app','--host','0.0.0.0','--port','8080'];
      else if (/\bflask\b/i.test(requirements)) cmd=['gunicorn','app:app','--bind','0.0.0.0:8080'];
      else throw new Error('Python entrypoint cannot be inferred; an existing Dockerfile can declare it.');
      return `FROM python:3.12-slim\n${common}ENV GRADIO_SERVER_NAME=0.0.0.0 GRADIO_SERVER_PORT=8080 GRADIO_ANALYTICS_ENABLED=False\nRUN pip install --no-cache-dir ${await has('requirements.txt')?'-r requirements.txt':'.'} gunicorn uvicorn\n${command(cmd)}`;
    }
    case 'go': return `FROM golang:1.24-bookworm AS build\n${common}RUN CGO_ENABLED=0 go build -o /product .\nFROM gcr.io/distroless/static-debian12\nCOPY --from=build /product /product\nENV PORT=8080 PODS_APP_DATA=/data\nEXPOSE 8080\n${command(['/product'])}`;
    case 'rust': return `FROM rust:1-bookworm AS build\n${common}RUN cargo build --release && find target/release -maxdepth 1 -type f -executable > /bins && test "$(wc -l < /bins)" = 1 && cp "$(cat /bins)" /product\nFROM debian:bookworm-slim\nRUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*\nCOPY --from=build /product /product\nENV PORT=8080 PODS_APP_DATA=/data\nEXPOSE 8080\n${command(['/product'])}`;
    case 'maven': {
      const resolver = /io\.quarkus|quarkus-maven-plugin/.test(await text('pom.xml')) ? ' -Dquarkus.bootstrap.blocking-task-runner=true' : '';
      return `FROM maven:3.9-eclipse-temurin-21 AS build\n${common}RUN mvn -B -DskipTests${resolver} package && mkdir /product && if [ -f target/quarkus-app/quarkus-run.jar ]; then cp -a target/quarkus-app/. /product/; else find target -maxdepth 1 -name '*.jar' ! -name 'original-*.jar' ! -name '*-sources.jar' ! -name '*-javadoc.jar' > /jars && test "$(wc -l < /jars)" = 1 && cp "$(cat /jars)" /product/app.jar; fi\nFROM eclipse-temurin:21-jre\nCOPY --from=build /product /product\nENV SERVER_PORT=8080 PORT=8080 PODS_APP_DATA=/data\nEXPOSE 8080\n${command(['sh','-c','if [ -f /product/quarkus-run.jar ]; then exec java -jar /product/quarkus-run.jar; else exec java -jar /product/app.jar; fi'])}`;
    }
    case 'gradle': return `FROM gradle:8-jdk21 AS build\n${common}RUN gradle --no-daemon bootJar && cp build/libs/*.jar /product.jar\nFROM eclipse-temurin:21-jre\nCOPY --from=build /product.jar /product.jar\nENV SERVER_PORT=8080 PORT=8080 PODS_APP_DATA=/data\nEXPOSE 8080\n${command(['java','-jar','/product.jar'])}`;
    case 'dotnet': {
      const projects=(await readdir(root)).filter(x=>x.endsWith('.csproj'));
      if(projects.length!==1||!/^[a-zA-Z0-9_.-]+\.csproj$/.test(projects[0]))throw new Error('Choose a single .NET web project.');
      const xml=await text(projects[0]), version=/<TargetFramework>net(8|9|10)\.0<\/TargetFramework>/.exec(xml)?.[1];
      if(!version)throw new Error('Use a supported .NET 8, 9 or 10 target framework.');
      return `FROM mcr.microsoft.com/dotnet/sdk:${version}.0 AS build\n${common}RUN dotnet publish ${projects[0]} -c Release -o /out --no-self-contained\nFROM mcr.microsoft.com/dotnet/aspnet:${version}.0\nWORKDIR /app\nCOPY --from=build /out .\nENV ASPNETCORE_URLS=http://0.0.0.0:8080 PODS_APP_DATA=/data\nEXPOSE 8080\n${command(['dotnet',projects[0].replace('.csproj','.dll')])}`;
    }
    case 'php': return `FROM php:8.3-cli-bookworm\nCOPY --from=composer:2 /usr/bin/composer /usr/bin/composer\nRUN apt-get update && apt-get install -y --no-install-recommends git unzip libsqlite3-dev libpq-dev libonig-dev libxml2-dev && docker-php-ext-install pdo_sqlite pdo_pgsql pdo_mysql mbstring dom xml && rm -rf /var/lib/apt/lists/*\n${common}RUN composer install --no-dev --no-interaction --prefer-dist\n${command(await has('artisan')?['php','artisan','serve','--host=0.0.0.0','--port=8080']:['php','-S','0.0.0.0:8080','-t',await has('public')?'public':'.'])}`;
    case 'ruby': return `FROM ruby:3.3-slim\nRUN apt-get update && apt-get install -y --no-install-recommends build-essential libpq-dev libsqlite3-dev git && rm -rf /var/lib/apt/lists/*\n${common}RUN bundle install\n${command(await has('bin/rails')?['bundle','exec','rails','server','-b','0.0.0.0','-p','8080']:['bundle','exec','rackup','--host','0.0.0.0','--port','8080'])}`;
    case 'deno': throw new Error('Deno applications currently need an existing Dockerfile that caches their runtime dependencies during the server build.');
    default: throw new Error('This runtime needs an existing Dockerfile or Compose definition.');
  }
}
