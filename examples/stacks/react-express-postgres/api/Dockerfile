FROM node:24-bookworm-slim
WORKDIR /app
COPY . .
RUN npm install --omit=dev
EXPOSE 8080
CMD ["node","server.mjs"]
