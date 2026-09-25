#!/usr/bin/env bash
# reset_db.sh
# Drops the database entirely and rebuilds it from migrations. Destructive.
# Usage: DB_NAME=argonyx DB_USER=postgres ./reset_db.sh

set -euo pipefail

DB_NAME="${DB_NAME:-argonyx}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export PGPASSWORD="${DB_PASSWORD:-}"

read -p "This will DROP database '$DB_NAME'. Continue? [y/N] " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted."
  exit 1
fi

echo "Dropping database '$DB_NAME' (if it exists)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME"

"$SCRIPT_DIR/init_db.sh"