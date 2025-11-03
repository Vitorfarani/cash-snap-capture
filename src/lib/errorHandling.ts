// User-friendly error message mapping to prevent information leakage
export const getErrorMessage = (error: any): string => {
  const errorMap: Record<string, string> = {
    // Auth errors
    'invalid_credentials': 'Email ou senha incorretos',
    'invalid_login_credentials': 'Email ou senha incorretos',
    'user_not_found': 'Email ou senha incorretos', // Don't reveal if user exists
    'invalid_grant': 'Email ou senha incorretos',
    'email_not_confirmed': 'Por favor, confirme seu email',
    'user_already_registered': 'Este email já está cadastrado',
    'email_exists': 'Este email já está cadastrado',
    'weak_password': 'Senha muito fraca. Use pelo menos 8 caracteres',
    'validation_failed': 'Por favor, verifique os dados informados',
    'over_email_send_rate_limit': 'Muitas tentativas. Tente novamente em alguns minutos',
    
    // Database errors
    'permission_denied': 'Você não tem permissão para realizar esta ação',
    'duplicate_key': 'Este registro já existe',
    'foreign_key_violation': 'Não é possível realizar esta operação',
    
    // Network errors
    'network_error': 'Erro de conexão. Verifique sua internet',
    'timeout': 'A operação demorou muito. Tente novamente',
  };

  // Check for specific error codes
  if (error?.code && errorMap[error.code]) {
    return errorMap[error.code];
  }

  // Check for error status
  if (error?.status === 400) {
    return 'Dados inválidos. Verifique as informações';
  }
  if (error?.status === 401 || error?.status === 403) {
    return 'Acesso não autorizado';
  }
  if (error?.status === 404) {
    return 'Recurso não encontrado';
  }
  if (error?.status >= 500) {
    return 'Erro no servidor. Tente novamente mais tarde';
  }

  // Generic fallback - never expose raw error messages
  return 'Ocorreu um erro inesperado. Tente novamente';
};
