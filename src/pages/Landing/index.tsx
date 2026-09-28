import React from 'react';
import { useHistory } from 'react-router-dom';
import { FiCalendar, FiUser } from 'react-icons/fi';

// Aproveitamos as imagens que já existem no teu projeto
import logoImg from '../../assets/logo.svg';
import Button from '../../components/Button';

import { Container, Content, Background, ActionBox } from './styles';

const Landing: React.FC = () => {
  const history = useHistory();

  return (
    <Container>
      <Background />

      <Content>
        <img src={logoImg} alt="GoBarber" />

        <h1>O seu estilo nas mãos dos melhores especialistas.</h1>
        <p>
          Agende seu horário de forma simples, rápida e à distância de um
          clique.
        </p>

        <ActionBox>
          <Button onClick={() => history.push('/cliente/login')}>
            <FiCalendar size={20} />
            Sou Cliente / Agendar Horário
          </Button>

          <Button
            className="transparent-btn"
            onClick={() => history.push('/barbeiro')}
          >
            <FiUser size={20} />
            Acesso Barbeiros
          </Button>
        </ActionBox>
      </Content>
    </Container>
  );
};

export default Landing;
