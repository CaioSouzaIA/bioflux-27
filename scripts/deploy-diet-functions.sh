#!/bin/bash

set -euo pipefail

PROJECT_REF="${PROJECT_REF:-kllprstrjpeedlegkedp}"
ENV_FILE="${ENV_FILE:-.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Arquivo de env não encontrado: $ENV_FILE" >&2
  exit 1
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "SUPABASE_ACCESS_TOKEN não definido no ambiente." >&2
  echo "Gere um Personal Access Token no dashboard da Supabase e exporte antes de rodar este script." >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

if [[ -z "${OPENROUTER_API_KEY:-}" ]]; then
  echo "OPENROUTER_API_KEY não encontrado em $ENV_FILE" >&2
  exit 1
fi

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "SUPABASE_SERVICE_ROLE_KEY não encontrado em $ENV_FILE" >&2
  exit 1
fi

echo "Sincronizando secrets no projeto $PROJECT_REF..."
supabase secrets set \
  --project-ref "$PROJECT_REF" \
  --env-file "$ENV_FILE" \
  OPENROUTER_API_KEY="$OPENROUTER_API_KEY"

echo "Fazendo deploy das Edge Functions de dieta..."
supabase functions deploy diet-intake-webhook --project-ref "$PROJECT_REF" --use-api
supabase functions deploy diet-generate-worker --project-ref "$PROJECT_REF" --use-api

echo "Deploy concluído."
