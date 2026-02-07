# Simple Dockerfile for Railway deployment
FROM rust:1.85-slim-bullseye AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Copy source code
COPY . .

# Pin problematic dependencies to compatible versions
RUN cargo update home@0.5.12 --precise 0.5.9

# Build the application (offline mode for SQLx)
ENV SQLX_OFFLINE=true
RUN cargo build --release --bin backend

# Runtime stage
FROM debian:bullseye-slim AS runtime
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/backend /usr/local/bin/backend
COPY --from=builder /app/migrations ./migrations

EXPOSE 3000

CMD ["/usr/local/bin/backend"]
