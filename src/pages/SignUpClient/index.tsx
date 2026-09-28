import React, { useCallback, useRef } from 'react';
import { FormHandles } from '@unform/core';
import { Form } from '@unform/web';
import * as Yup from 'yup';
import { Link, useHistory } from 'react-router-dom';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getValidationErrors from '../../utils/getValidationErros';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

import AuthLayout from '../../components/AuthLayout';
import FormField from '../../components/FormField';
import { UIButton } from '../../components/ui';

interface SignUpClientFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const SignUpClient: React.FC = () => {
  const formRef = useRef<FormHandles>(null);
  const { addToast } = useToast();
  const history = useHistory();

  const handleSubmit = useCallback(
    async (data: SignUpClientFormData) => {
      try {
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          name: Yup.string().required('Nome obrigatório'),
          email: Yup.string()
            .required('E-mail obrigatório')
            .email('Digite um e-mail válido'),
          password: Yup.string().min(6, 'No mínimo 6 caracteres'),
          phone: Yup.string().required('Celular obrigatório'),
        });

        await schema.validate(data, { abortEarly: false });

        // Comunica com a nova rota de clientes no backend
        await api.post('/clients', data);

        addToast({
          type: 'success',
          title: 'Cadastro concluído!',
          description: 'Agora é só fazer login para agendar seu horário.',
        });

        history.push('/cliente/login');
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);
          formRef.current?.setErrors(errors);
          return;
        }

        addToast({
          type: 'error',
          title: 'Erro no cadastro',
          description: getApiErrorMessage(
            err,
            'Ocorreu um erro ao fazer o cadastro, tente novamente.',
          ),
        });
      }
    },
    [addToast, history],
  );

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Se a barbearia já marcou um horário para você, use o mesmo e-mail para ver seus agendamentos."
      image="signup"
      footer={
        <>
          <p>
            Já tem conta? <Link to="/cliente/login">Entrar</Link>
          </p>
          <p>
            <Link to="/">Voltar ao início</Link>
          </p>
        </>
      }
    >
      <Form ref={formRef} onSubmit={handleSubmit}>
        <FormField
          name="name"
          label="Nome completo"
          autoComplete="name"
          autoFocus
        />
        <FormField
          name="email"
          type="email"
          label="E-mail"
          autoComplete="email"
        />
        <FormField
          name="phone"
          type="tel"
          label="Celular"
          autoComplete="tel"
          placeholder="(11) 99999-0000"
        />
        <FormField
          name="password"
          type="password"
          label="Senha"
          autoComplete="new-password"
        />

        <UIButton type="submit">Criar conta</UIButton>
      </Form>
    </AuthLayout>
  );
};

export default SignUpClient;
