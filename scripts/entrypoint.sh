#!/bin/sh
# Migrations and seed are idempotent, so they run on every start; a failure
# stops the container before it serves traffic.
set -eu

echo "[entrypoint] Applying database migrations..."
./node_modules/.bin/prisma migrate deploy

echo "[entrypoint] Seeding the business card..."
node dist/database/seed/main.js

echo "[entrypoint] Starting the API..."
# exec: Node becomes PID 1 and receives SIGTERM for a graceful shutdown.
exec node dist/main.js
