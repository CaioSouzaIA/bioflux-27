import test from 'node:test';
import assert from 'node:assert/strict';

import { buildResendAuthEmail } from '../supabase/functions/_shared/auth-email.js';

const basePayload = {
  user: {
    email: 'cliente@bioflux.ai',
  },
  email_data: {
    token: '305805',
    token_hash: 'hash-confirmacao',
    redirect_to: 'https://biofluxapp.com/client',
    email_action_type: 'signup',
    site_url: 'https://kllprstrjpeedlegkedp.supabase.co',
    token_new: '',
    token_hash_new: '',
    old_email: '',
    old_phone: '',
    provider: '',
    factor_type: '',
  },
};

test('maps signup emails to the confirmation template and verification link', () => {
  const result = buildResendAuthEmail(basePayload, {
    supabaseUrl: 'https://kllprstrjpeedlegkedp.supabase.co',
    fromEmail: 'app@biofluxapp.com',
    fromName: 'BIOFLUX',
    templateAliases: {
      signup: 'confirmacao-cadastro',
    },
  });

  assert.deepEqual(result, {
    from: 'BIOFLUX <app@biofluxapp.com>',
    to: ['cliente@bioflux.ai'],
    subject: 'Confirme seu cadastro - BIOFLUX',
    template: {
      id: 'confirmacao-cadastro',
      variables: {
        CONFIRMATION_URL:
          'https://kllprstrjpeedlegkedp.supabase.co/auth/v1/verify?token=hash-confirmacao&type=signup&redirect_to=https%3A%2F%2Fbiofluxapp.com%2Fclient',
        ConfirmationURL:
          'https://kllprstrjpeedlegkedp.supabase.co/auth/v1/verify?token=hash-confirmacao&type=signup&redirect_to=https%3A%2F%2Fbiofluxapp.com%2Fclient',
        SITE_URL: 'https://biofluxapp.com/client',
        EMAIL_ACTION_TYPE: 'signup',
        TOKEN: '305805',
      },
    },
  });
});

test('fails clearly when a template alias is missing for the email action', () => {
  assert.throws(
    () =>
      buildResendAuthEmail(basePayload, {
        supabaseUrl: 'https://kllprstrjpeedlegkedp.supabase.co',
        fromEmail: 'app@biofluxapp.com',
        fromName: 'BIOFLUX',
        templateAliases: {},
      }),
    /Nenhum template do Resend configurado para o tipo de email "signup"\./,
  );
});
