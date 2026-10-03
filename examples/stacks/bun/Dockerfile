FROM oven/bun:1.4.2 AS build
WORKDIR /app
COPY server.ts .
RUN bun build --compile server.ts --outfile /product
FROM debian:bookworm-slim
COPY --from=build /product /product
ENV PORT=8080 PODS_APP_DATA=/data
EXPOSE 8080
CMD ["/product"]
