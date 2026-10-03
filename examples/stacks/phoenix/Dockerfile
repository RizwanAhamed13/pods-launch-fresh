FROM elixir:1.18-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends build-essential git ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV MIX_ENV=prod
COPY . .
RUN mix local.hex --force && mix local.rebar --force && mix deps.get && mix compile && mix release
FROM elixir:1.18-slim
WORKDIR /product
COPY --from=build /app/_build/prod/rel/pods_phoenix .
ENV PORT=8080 PODS_APP_DATA=/data
EXPOSE 8080
CMD ["/product/bin/pods_phoenix", "start"]
