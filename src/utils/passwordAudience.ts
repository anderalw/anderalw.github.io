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
    login: '/equipe',
    forgotEndpoint: '/password/forgot',
    resetEndpoint: '/password/reset',
    forgotSubtitle:
      'Informe o e-mail da sua conta da equipe. Enviaremos um link para você criar uma nova senha.',
    resetSubtitle: 'Escolha uma nova senha para sua conta da equipe.',
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
