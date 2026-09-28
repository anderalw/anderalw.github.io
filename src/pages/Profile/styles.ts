import styled from 'styled-components';

import { colors } from '../../styles/theme';

// Cartão da foto à esquerda; formulário à direita
export const Columns = styled.div`
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  max-width: 1000px;

  @media (max-width: 1080px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const AvatarCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 20px 24px;
  text-align: center;

  img {
    width: 112px;
    height: 112px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid ${colors.border};
  }

  strong {
    margin-top: 16px;
    font-size: 16px;
    color: ${colors.text};
  }

  small {
    margin-top: 2px;
    color: ${colors.textMuted};
  }

  /* O input de arquivo fica escondido; o botão abre a janela de seleção */
  input[type='file'] {
    display: none;
  }

  label {
    margin-top: 20px;
    cursor: pointer;
  }
`;

export const SectionTitle = styled.h3`
  margin: 4px 0 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${colors.textSubtle};

  & ~ & {
    margin-top: 20px;
  }
`;
