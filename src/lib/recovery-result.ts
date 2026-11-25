type RecoveryError = {status?: number; code?: string};
const accepted = 'Se a conta existir, consulte a caixa de entrada e o spam. Abra o email mais recente no navegador em que pediu a recuperação.';

export function recoveryResult(error: RecoveryError | null) {
 if (!error || error.code === 'user_not_found') return {success: accepted};
 if (error.code === 'over_email_send_rate_limit') {
  return {error: 'A plataforma atingiu o limite de emails de autenticação. Confira se já recebeu uma mensagem. Se precisar de outra, tente novamente em até uma hora.'};
 }
 if (error.status === 429) return {error: 'Há muitos pedidos recentes. Aguarde alguns minutos antes de tentar novamente.'};
 return {error: 'Não foi possível solicitar a recuperação agora. Se o problema persistir, contacte o administrador.'};
}
