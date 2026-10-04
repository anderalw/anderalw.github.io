import React, { useCallback, useRef } from 'react';
import { Form } from '@unform/web';
import { FormHandles } from '@unform/core';
import * as Yup from 'yup';
import { useHistory } from 'react-router-dom';

import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import getValidationErrors from '../../utils/getValidationErros';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

import AuthLayout, { InlineLink } from '../../components/AuthLayout';
import FormField from '../../components/FormField';
import { UIButton } from '../../components/ui';

interface ChangePasswordFormData {
  password: string;
  password_confirmation: string;
}

// Primeiro acesso (ou senha redefinida pelo administrador): a senha
// provisória é o e-mail e precisa ser trocada antes de usar o sistema
const ChangePassword: React.FC = () => {
  const formRef = useRef<FormHandles>(null);
  const { user, changeFirstPassword, signOut } = useAuth();
  const { addToast } = useToast();
  const history = useHistory();

  const handleSubmit = useCallback(
    async (data: ChangePasswordFormData) => {
      try {
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          password: Yup.string()
            .min(6, 'No mínimo 6 caracteres')
            .test(
              'not-email',
              'A senha nova não pode ser o seu e-mail',
              value =>
                (value || '').trim().toLowerCase() !== user.email.toLowerCase(),
            ),
          password_confirmation: Yup.string().oneOf(
            [Yup.ref('password')],
            'As senhas não conferem',
          ),
        });

        await schema.validate(data, { abortEarly: false });

        await changeFirstPassword(data.password, data.password_confirmation);

        addToast({
          type: 'success',
          title: 'Senha criada!',
          description: 'Use a nova senha nos próximos acessos.',
        });

        history.push('/dashboard');
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          formRef.current?.setErrors(getValidationErrors(err));
          return;
        }

        addToast({
          type: 'error',
          title: 'Não foi possível trocar a senha',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      }
    },
    [user.email, changeFirstPassword, addToast, history],
  );

  return (
    <AuthLayout
      title="Crie a sua senha"
      subtitle={`Olá, ${
        user.name.split(' ')[0]
      }! Você entrou com a senha provisória. Escolha uma senha só sua para continuar.`}
    >
      <Form ref={formRef} onSubmit={handleSubmit}>
        <FormField
          name="password"
          type="password"
          label="Nova senha"
          autoComplete="new-password"
          autoFocus
        />
        <FormField
          name="password_confirmation"
          type="password"
          label="Repita a nova senha"
          autoComplete="new-password"
        />
        <UIButton type="submit">Salvar e entrar</UIButton>
        <InlineLink to="/equipe" onClick={signOut}>
          Sair
        </InlineLink>
      </Form>
    </AuthLayout>
  );
};

export default ChangePassword;
