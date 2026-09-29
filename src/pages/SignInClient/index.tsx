import React, { useRef, useCallback } from 'react';
import { FormHandles } from '@unform/core';
import { Form } from '@unform/web';
import * as Yup from 'yup';
import { Link, useHistory } from 'react-router-dom';

import { useToast } from '../../hooks/Toast';
import { useAuth } from '../../hooks/Auth';
import getValidationErrors from '../../utils/getValidationErros';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

import AuthLayout from '../../components/AuthLayout';
import FormField from '../../components/FormField';
import GoogleSignIn from '../../components/GoogleSignIn';
import { UIButton } from '../../components/ui';

interface SignInClientFormData {
  email: string;
  password: string;
}

const SignInClient: React.FC = () => {
  const formRef = useRef<FormHandles>(null);
  const { addToast } = useToast();
  const { signInClient } = useAuth();
  const history = useHistory();

  const handleSubmit = useCallback(
    async (data: SignInClientFormData) => {
      try {
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          email: Yup.string()
            .required('E-mail obrigatório')
            .email('Digite um e-mail válido'),
          password: Yup.string().required('Senha obrigatória'),
        });

        await schema.validate(data, { abortEarly: false });

        // Faz o login na rota exclusiva de clientes e guarda a sessão
        await signInClient({ email: data.email, password: data.password });

        // Redireciona para a página de agendamento
        history.push('/agendar');
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);
          formRef.current?.setErrors(errors);
          return;
        }

        addToast({
          type: 'error',
          title: 'Erro na autenticação',
          description: getApiErrorMessage(
            err,
            'Ocorreu um erro ao fazer login, confira seu e-mail e senha.',
          ),
        });
      }
    },
    [addToast, history, signInClient],
  );

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse sua conta para agendar e acompanhar seus horários."
      footer={
        <>
          <p>
            Ainda não tem conta? <Link to="/cliente/cadastro">Criar conta</Link>
          </p>
          <p>
            <Link to="/">Voltar ao início</Link>
          </p>
        </>
      }
    >
      <Form ref={formRef} onSubmit={handleSubmit}>
        <FormField
          name="email"
          type="email"
          label="E-mail"
          autoComplete="email"
          autoFocus
        />
        <FormField
          name="password"
          type="password"
          label="Senha"
          autoComplete="current-password"
        />

        <UIButton type="submit">Entrar</UIButton>
      </Form>

      <GoogleSignIn />
    </AuthLayout>
  );
};

export default SignInClient;
