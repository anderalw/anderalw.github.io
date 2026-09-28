import styled from 'styled-components';

// Fixo no canto: continua visível mesmo com a página rolada
export const Container = styled.div`
  position: fixed;
  right: 0;
  top: 0;
  z-index: 100;
  padding: 24px;
  overflow: hidden;
`;
