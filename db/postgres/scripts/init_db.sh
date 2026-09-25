#!/usr/bin/env bash
# init_db.sh
# Creates the database (if missing) and runs every migration in order.
# Usage: DB_NAME=argonyx DB_USER=postgres ./init_db.sh

set -euo pipefail

DB_NAME="${DB_NAME:-argonyx}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../migrations"

export PGPASSWORD="${DB_PASSWORD:-}"

echo "Ensuring database '$DB_NAME' exists..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tc \
  "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME"

echo "Running migrations..."
for f in "$MIGRATIONS_DIR"/*.sql; do
  echo " -> $(basename "$f")"
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$f"
done

echo "Done."