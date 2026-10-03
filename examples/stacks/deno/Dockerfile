FROM denoland/deno:2.4.5 AS build
WORKDIR /app
COPY server.ts .
RUN deno compile --allow-net --allow-read=/data --allow-write=/data --allow-env=PORT,PODS_APP_DATA --output /product server.ts
FROM debian:bookworm-slim
COPY --from=build /product /product
ENV PORT=8080 PODS_APP_DATA=/data
EXPOSE 8080
CMD ["/product"]
