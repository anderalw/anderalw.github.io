import styled from 'styled-components';
import signInBackgroundImg from '../../assets/sign-in-background.png';

export const Container = styled.div`
  height: 100vh;
  display: flex;
  align-items: stretch;
`;

export const Background = styled.div`
  flex: 1;
  background: url(${signInBackgroundImg}) no-repeat center;
  background-size: cover;
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  width: 100%;
  max-width: 700px;
  padding: 0 32px;

  img {
    margin-bottom: 64px;
    width: 250px;
  }

  h1 {
    font-size: 42px;
    text-align: center;
    margin-bottom: 24px;
    line-height: 52px;
  }

  p {
    font-size: 18px;
    color: #999591;
    text-align: center;
    margin-bottom: 48px;
    max-width: 400px;
    line-height: 28px;
  }
`;

export const ActionBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 350px;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  /* Estilo para o botão secundário (Barbeiros) */
  .transparent-btn {
    background: transparent;
    color: #ff9000;
    border: 2px solid #ff9000;

    &:hover {
      background: #ff9000;
      color: #312e38;
    }
  }
`;
