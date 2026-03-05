FROM golang:1.22-alpine AS builder
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY cmd ./cmd
COPY internal ./internal

RUN go build -o /bin/server ./cmd/server

FROM alpine:3.20
WORKDIR /app
RUN adduser -D -g '' appuser

COPY --from=builder /bin/server /app/server

USER appuser
EXPOSE 8080
CMD ["/app/server"]
