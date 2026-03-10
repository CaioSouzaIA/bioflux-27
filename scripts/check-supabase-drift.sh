#!/bin/bash

set -euo pipefail

DB_URL="${DB_URL:-}"

if [[ -z "$DB_URL" ]]; then
  echo "Defina DB_URL com a connection string percent-encoded." >&2
  exit 1
fi

supabase migration list --db-url "$DB_URL"
