// Recuperação de senha: a equipe e os clientes usam as mesmas telas, com
// endereços e textos diferentes
export type PasswordAudience = 'staff' | 'client';

export const PASSWORD_AUDIENCE: Record<
  PasswordAudience,
  {
    login: string;
    forgotEndpoint: string;
    resetEndpoint: string;
    forgotSubtitle: string;
    resetSubtitle: string;
  }
> = {
  staff: {
    login: '/barbeiro',
    forgotEndpoint: '/password/forgot',
    resetEndpoint: '/password/reset',
    forgotSubtitle:
      'Informe o e-mail da sua conta de barbeiro. Enviaremos um link para você criar uma nova senha.',
    resetSubtitle: 'Escolha uma nova senha para sua conta de barbeiro.',
  },
  client: {
    login: '/cliente/login',
    forgotEndpoint: '/clients/password/forgot',
    resetEndpoint: '/clients/password/reset',
    forgotSubtitle:
      'Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.',
    resetSubtitle: 'Escolha uma nova senha para entrar e agendar.',
  },
};
