import React from 'react';
import styled from 'styled-components';

const Container = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background: var(--c-background);
  color: var(--c-text);
  text-align: center;

  h1 {
    font-size: 22px;
    margin-bottom: 8px;
  }

  p {
    color: var(--c-text-muted);
    max-width: 360px;
  }
`;

export type TenantProblem = 'not_found' | 'suspended';

const TEXTS: Record<TenantProblem, { title: string; text: string }> = {
  not_found: {
    title: 'Endereço não encontrado',
    text: 'Não há nada neste endereço. Confira o link que você recebeu.',
  },
  suspended: {
    title: 'Sistema temporariamente indisponível',
    text: 'Este endereço está com o sistema pausado. Tente de novo mais tarde.',
  },
};

// Página no lugar do sistema quando o endereço não é de nenhuma barbearia
// ou a barbearia está suspensa
const TenantUnavailable: React.FC<{ problem: TenantProblem }> = ({
  problem,
}) => (
  <Container>
    <div>
      <h1>{TEXTS[problem].title}</h1>
      <p>{TEXTS[problem].text}</p>
    </div>
  </Container>
);

export default TenantUnavailable;
