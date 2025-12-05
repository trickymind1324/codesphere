FROM rust:1.75-slim AS development

WORKDIR /app

# Install cargo-watch for hot reloading
RUN cargo install cargo-watch

COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build

COPY . .

EXPOSE 3004

CMD ["cargo", "watch", "-x", "run"]

# Production stage
FROM rust:1.75-slim AS builder

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

COPY . .
RUN cargo build --release

# Final stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /root/

COPY --from=builder /app/target/release/code-execution-service .

EXPOSE 3004

CMD ["./code-execution-service"]
