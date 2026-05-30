# Multi-stage Rust build with cargo-chef (cached dependency layer). Produces
# both binaries; docker-compose picks which to run per service.
# Build from the REPO ROOT:  docker build -f rust/Dockerfile -t sentinel-rust .
FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /app

FROM chef AS planner
COPY rust/ .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
# Build & cache dependencies only — this layer is reused until deps change.
RUN cargo chef cook --release --recipe-path recipe.json
COPY rust/ .
# Use committed offline query metadata so no database is needed at build time.
ENV SQLX_OFFLINE=true
RUN cargo build --release --bin sentinel-ingestor --bin sentinel-matcher

FROM debian:bookworm-slim AS runtime
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/sentinel-ingestor /usr/local/bin/sentinel-ingestor
COPY --from=builder /app/target/release/sentinel-matcher /usr/local/bin/sentinel-matcher
# Default command; overridden per compose service.
CMD ["sentinel-matcher"]
