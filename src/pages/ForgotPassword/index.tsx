import React, { useCallback, useRef, useState } from 'react';

import { Form } from '@unform/web';
import { FormHandles } from '@unform/core';

import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import { useToast } from '../../hooks/Toast';

import getValidationErrors from '../../utils/getValidationErros';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

import api from '../../services/api';

import AuthLayout from '../../components/AuthLayout';
import FormField from '../../components/FormField';
import { UIButton } from '../../components/ui';

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const formRef = useRef<FormHandles>(null);

  const { addToast } = useToast();

  const handleSubmit = useCallback(
    async (data: ForgotPasswordFormData) => {
      try {
        setLoading(true);
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          email: Yup.string()
            .required('E-mail obrigatório')
            .email('Digite um e-mail válido'),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        await api.post('/password/forgot', {
          email: data.email,
        });

        addToast({
          type: 'success',
          title: 'E-mail de recuperação enviado',
          description:
            'Enviamos um e-mail para confirmar a recuperação de senha, confira sua caixa de entrada',
        });
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);

          return;
        }
        addToast({
          type: 'error',
          title: 'Erro na recuperação de senha',
          description: getApiErrorMessage(
            err,
            'Ocorreu um erro ao tentar realizar a recuperação de senha, tente novamente',
          ),
        });
      } finally {
        setLoading(false);
      }
    },
    [addToast],
  );

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Informe o e-mail da sua conta de barbeiro. Enviaremos um link para você criar uma nova senha."
      footer={
        <p>
          Lembrou a senha? <Link to="/barbeiro">Voltar ao login</Link>
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

        <UIButton type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar link'}
        </UIButton>
      </Form>
    </AuthLayout>
  );
};
export default ForgotPassword;
