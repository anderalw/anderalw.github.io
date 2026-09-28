import React, { useCallback, useRef } from 'react';

import { Form } from '@unform/web';
import { FormHandles } from '@unform/core';

import * as Yup from 'yup';
import { Link, useHistory } from 'react-router-dom';
import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';

import getValidationErrors from '../../utils/getValidationErros';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

import AuthLayout, { InlineLink } from '../../components/AuthLayout';
import FormField from '../../components/FormField';
import { UIButton } from '../../components/ui';

interface SignInFormData {
  email: string;
  password: string;
}

const SignIn: React.FC = () => {
  const formRef = useRef<FormHandles>(null);

  const { signIn } = useAuth();
  const { addToast } = useToast();
  const history = useHistory();

  const handleSubmit = useCallback(
    async (data: SignInFormData) => {
      try {
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          email: Yup.string()
            .required('E-mail obrigatório')
            .email('Digite um e-mail válido'),
          password: Yup.string().required('Senha obrigatória'),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        await signIn({
          email: data.email,
          password: data.password,
        });

        history.push('/dashboard');
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
            'Ocorreu um erro ao fazer login, cheque as credenciais',
          ),
        });
      }
    },
    [signIn, addToast, history],
  );

  return (
    <AuthLayout
      title="Acesso do barbeiro"
      subtitle="Entre para ver a agenda da barbearia."
      footer={
        <p>
          <Link to="/">Voltar ao início</Link>
        </p>
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
        <InlineLink to="/barbeiro/esqueci-senha">
          Esqueci minha senha
        </InlineLink>

        <UIButton type="submit">Entrar</UIButton>
      </Form>
    </AuthLayout>
  );
};
export default SignIn;
