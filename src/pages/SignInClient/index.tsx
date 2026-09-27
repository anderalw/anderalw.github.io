import React, { useRef, useCallback } from 'react';
import { FiLogIn, FiMail, FiLock } from 'react-icons/fi';
import { FormHandles } from '@unform/core';
import { Form } from '@unform/web';
import * as Yup from 'yup';
import { Link, useHistory } from 'react-router-dom';

import { useToast } from '../../hooks/Toast';
import getValidationErrors from '../../utils/getValidationErros';

import api from '../../services/api';

import logoImg from '../../assets/logo.svg';
import Input from '../../components/Input';
import Button from '../../components/Button';

import { Container, Content, Background, AnimationContainer } from './styles';

const SignInClient: React.FC = () => {
  const formRef = useRef<FormHandles>(null);
  const { addToast } = useToast();
  const history = useHistory();

  const handleSubmit = useCallback(
    async (data: any) => {
      try {
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          email: Yup.string().required('E-mail obrigatório').email('Digite um e-mail válido'),
          password: Yup.string().required('Password obrigatória'),
        });

        await schema.validate(data, { abortEarly: false });

        // Faz o login na rota exclusiva de clientes
        const response = await api.post('/clients/sessions', data);
        
        const { token, client } = response.data;

        // Guarda os dados no armazenamento local do navegador
        localStorage.setItem('@GoBarber:clientToken', token);
        localStorage.setItem('@GoBarber:client', JSON.stringify(client));

        // Envia o token no cabeçalho das próximas requisições
        api.defaults.headers.authorization = `Bearer ${token}`;

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
          description: 'Ocorreu um erro ao fazer login, verifique as suas credenciais.',
        });
      }
    },
    [addToast, history],
  );

  return (
    <Container>
      <Content>
        <AnimationContainer>
          <img src={logoImg} alt="GoBarber" />

          <Form ref={formRef} onSubmit={handleSubmit}>
            <h1>Login de Cliente</h1>

            <Input name="email" icon={FiMail} placeholder="E-mail" />
            <Input name="password" icon={FiLock} type="password" placeholder="Password" />

            <Button type="submit">Entrar</Button>
          </Form>

          <Link to="/cliente/registo">
            <FiLogIn />
            Criar conta de cliente
          </Link>
        </AnimationContainer>
      </Content>
      <Background />
    </Container>
  );
};

export default SignInClient;