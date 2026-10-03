FROM golang:1.24-bookworm AS build
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o /product .
FROM scratch
COPY --from=build /product /product
ENV PORT=8080 PODS_APP_DATA=/data
EXPOSE 8080
CMD ["/product"]
