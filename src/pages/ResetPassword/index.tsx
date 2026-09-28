import React, { useCallback, useRef } from 'react';

import { Form } from '@unform/web';
import { FormHandles } from '@unform/core';

import * as Yup from 'yup';
import { useHistory, useLocation, Link } from 'react-router-dom';
import { useToast } from '../../hooks/Toast';

import getValidationErrors from '../../utils/getValidationErros';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

import api from '../../services/api';

import AuthLayout from '../../components/AuthLayout';
import FormField from '../../components/FormField';
import { UIButton } from '../../components/ui';

interface ResetPasswordFormData {
  password: string;
  password_confirmation: string;
}

const ResetPassword: React.FC = () => {
  const formRef = useRef<FormHandles>(null);

  const { addToast } = useToast();
  const history = useHistory();
  const location = useLocation();

  const handleSubmit = useCallback(
    async (data: ResetPasswordFormData) => {
      try {
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          password: Yup.string().required('Senha obrigatória'),
          password_confirmation: Yup.string().oneOf(
            [Yup.ref('password'), null],
            'Confirmação incorreta',
          ),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        const { password, password_confirmation } = data;
        const token = new URLSearchParams(location.search).get('token');

        if (!token) {
          addToast({
            type: 'error',
            title: 'Link inválido',
            description:
              'Abra o link enviado no e-mail de recuperação ou peça um novo.',
          });

          return;
        }

        await api.post('/password/reset', {
          password,
          password_confirmation,
          token,
        });

        addToast({
          type: 'success',
          title: 'Senha alterada',
          description: 'Faça login com a nova senha.',
        });

        history.push('/barbeiro');
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);

          return;
        }
        addToast({
          type: 'error',
          title: 'Erro ao redefinir a senha',
          description: getApiErrorMessage(
            err,
            'Ocorreu um erro ao redefinir a senha, tente novamente.',
          ),
        });
      }
    },
    [addToast, history, location.search],
  );

  return (
    <AuthLayout
      title="Criar nova senha"
      subtitle="Escolha uma nova senha para sua conta de barbeiro."
      footer={
        <p>
          <Link to="/barbeiro">Voltar ao login</Link>
        </p>
      }
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
          label="Confirmar nova senha"
          autoComplete="new-password"
        />

        <UIButton type="submit">Salvar nova senha</UIButton>
      </Form>
    </AuthLayout>
  );
};
export default ResetPassword;
