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

if [[ -z "${SEND_EMAIL_HOOK_SECRET:-}" ]]; then
  echo "SEND_EMAIL_HOOK_SECRET não encontrado em $ENV_FILE" >&2
  exit 1
fi

echo "Sincronizando secrets do hook de email no projeto $PROJECT_REF..."
supabase secrets set \
  --project-ref "$PROJECT_REF" \
  --env-file "$ENV_FILE" \
  RESEND_API_KEY="$RESEND_API_KEY" \
  SEND_EMAIL_HOOK_SECRET="$SEND_EMAIL_HOOK_SECRET"

echo "Fazendo deploy da Edge Function de email transacional do Auth..."
supabase functions deploy send-email --project-ref "$PROJECT_REF" --use-api --no-verify-jwt

echo "Deploy concluído."
