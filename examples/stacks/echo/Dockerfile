FROM golang:1.26-bookworm AS build
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -mod=mod -o /product .
FROM gcr.io/distroless/static-debian12
COPY --from=build /product /product
ENV PORT=8080 PODS_APP_DATA=/data
EXPOSE 8080
CMD ["/product"]
