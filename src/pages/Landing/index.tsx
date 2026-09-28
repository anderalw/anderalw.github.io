import React from 'react';
import { FiArrowRight, FiCalendar, FiScissors } from 'react-icons/fi';

import AuthLayout from '../../components/AuthLayout';

import { Choices, Choice } from './styles';

const Landing: React.FC = () => (
  <AuthLayout
    wide
    title="O seu estilo nas mãos dos melhores especialistas."
    subtitle="Agende seu horário de forma simples, rápida e à distância de um clique."
    quote="Cortes, barbas e tratamentos com hora marcada."
  >
    <Choices>
      <Choice to="/cliente/login" $primary>
        <span className="icon">
          <FiCalendar />
        </span>
        <div>
          <strong>Sou cliente</strong>
          <small>Agende um horário ou veja seus agendamentos.</small>
        </div>
        <FiArrowRight className="arrow" />
      </Choice>

      <Choice to="/barbeiro">
        <span className="icon">
          <FiScissors />
        </span>
        <div>
          <strong>Sou barbeiro</strong>
          <small>Acesse a agenda e o painel da barbearia.</small>
        </div>
        <FiArrowRight className="arrow" />
      </Choice>
    </Choices>
  </AuthLayout>
);

export default Landing;
