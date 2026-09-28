import styled from 'styled-components';

import { colors } from '../../styles/theme';
import { FixedDialog } from './AppointmentDetails/styles';

// Modais largos da agenda (novo agendamento e detalhes), com tamanho fixo:
// resumo à esquerda e o conteúdo à direita, tudo sem rolagem por dentro
export const WideDialog = styled(FixedDialog)`
  max-width: 880px;
  height: min(600px, 100%);
  padding: 0;
`;

export const DialogHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${colors.border};

  && h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: ${colors.text};
  }
`;

export const Columns = styled.div`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
`;

// Coluna do resumo e da verificação do horário
export const Aside = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  padding: 20px;
  border-right: 1px solid ${colors.border};
  background: ${colors.sunken};
`;

// Coluna do passo atual
export const Main = styled.div`
  min-height: 0;
  padding: 20px 24px;
  /* Só por segurança (ex: catálogo muito grande); no uso normal não rola */
  overflow-y: auto;
`;

export const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 24px;
  border-top: 1px solid ${colors.border};

  button {
    margin: 0;
  }
`;

// Coluna do conteúdo com os botões empurrados para o pé
export const MainStack = styled(Main)`
  display: flex;
  flex-direction: column;
`;
