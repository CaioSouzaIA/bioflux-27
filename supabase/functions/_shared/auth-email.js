const DEFAULT_SUBJECTS = {
  signup: 'Confirme seu cadastro - BIOFLUX',
  recovery: 'Recuperação de senha - BIOFLUX',
  magiclink: 'Seu link de acesso - BIOFLUX',
  invite: 'Convite para acessar a BIOFLUX',
  email_change: 'Confirme a alteração do seu email - BIOFLUX',
  reauthentication: 'Confirme sua ação - BIOFLUX',
};

/**
 * @typedef {{
 *   email: string;
 *   new_email?: string;
 * }} HookUser
 */

/**
 * @typedef {{
 *   token: string;
 *   token_hash: string;
 *   redirect_to?: string;
 *   email_action_type: string;
 *   site_url?: string;
 *   token_new?: string;
 *   token_hash_new?: string;
 *   old_email?: string;
 *   old_phone?: string;
 *   provider?: string;
 *   factor_type?: string;
 * }} HookEmailData
 */

/**
 * @typedef {{
 *   user: HookUser;
 *   email_data: HookEmailData;
 * }} HookEmailPayload
 */

/**
 * @typedef {{
 *   supabaseUrl: string;
 *   fromEmail: string;
 *   fromName: string;
 *   templateAliases: Record<string, string>;
 *   subjects?: Record<string, string>;
 * }} BuildEmailOptions
 */

const normalizeUrl = (value) => {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).toString();
  } catch (_error) {
    return null;
  }
};

const buildVerificationUrl = ({
  supabaseUrl,
  tokenHash,
  emailActionType,
  redirectTo,
}) => {
  const baseUrl = normalizeUrl(supabaseUrl);

  if (!baseUrl) {
    throw new Error('SUPABASE_URL inválida para montar links de confirmação.');
  }

  if (!tokenHash) {
    throw new Error(`Token hash ausente para o tipo de email "${emailActionType}".`);
  }

  const verifyUrl = new URL('/auth/v1/verify', baseUrl);
  verifyUrl.searchParams.set('token', tokenHash);
  verifyUrl.searchParams.set('type', emailActionType);

  if (redirectTo) {
    verifyUrl.searchParams.set('redirect_to', redirectTo);
  }

  return verifyUrl.toString();
};

const buildFromField = (fromName, fromEmail) => {
  if (!fromEmail) {
    throw new Error('RESEND_FROM_EMAIL não configurado.');
  }

  return fromName ? `${fromName} <${fromEmail}>` : fromEmail;
};

const buildPrimaryMessage = (payload, options) => {
  const { user, email_data: emailData } = payload;
  const templateAlias = options.templateAliases[emailData.email_action_type];

  if (!templateAlias) {
    throw new Error(
      `Nenhum template do Resend configurado para o tipo de email "${emailData.email_action_type}".`,
    );
  }

  const confirmationUrl = buildVerificationUrl({
    supabaseUrl: options.supabaseUrl,
    tokenHash: emailData.token_hash,
    emailActionType: emailData.email_action_type,
    redirectTo: emailData.redirect_to,
  });

  const subject =
    options.subjects?.[emailData.email_action_type] ??
    DEFAULT_SUBJECTS[emailData.email_action_type] ??
    'BIOFLUX';

  return {
    from: buildFromField(options.fromName, options.fromEmail),
    to: [user.email],
    subject,
    template: {
      id: templateAlias,
      variables: {
        CONFIRMATION_URL: confirmationUrl,
        ConfirmationURL: confirmationUrl,
        SITE_URL: emailData.redirect_to ?? emailData.site_url ?? '',
        EMAIL_ACTION_TYPE: emailData.email_action_type,
        TOKEN: emailData.token,
      },
    },
  };
};

/**
 * @param {HookEmailPayload} payload
 * @param {BuildEmailOptions} options
 */
export const buildResendAuthEmail = (payload, options) => {
  if (!payload?.user?.email) {
    throw new Error('Payload do hook sem email do usuário.');
  }

  if (!payload?.email_data?.email_action_type) {
    throw new Error('Payload do hook sem email_action_type.');
  }

  return buildPrimaryMessage(payload, options);
};

export { buildVerificationUrl };
