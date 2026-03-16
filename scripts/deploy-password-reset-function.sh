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

if [[ -z "${RESEND_API_KEY:-}" ]]; then
  echo "RESEND_API_KEY não encontrado em $ENV_FILE" >&2
  exit 1
fi

echo "Sincronizando secret do Resend no projeto $PROJECT_REF..."
supabase secrets set \
  --project-ref "$PROJECT_REF" \
  --env-file "$ENV_FILE" \
  RESEND_API_KEY="$RESEND_API_KEY"

echo "Fazendo deploy da Edge Function de recuperação de senha..."
supabase functions deploy send-password-reset-email --project-ref "$PROJECT_REF" --use-api --no-verify-jwt

echo "Deploy concluído."
