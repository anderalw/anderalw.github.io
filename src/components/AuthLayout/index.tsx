import React from 'react';
import { FiScissors } from 'react-icons/fi';

import signInBackgroundImg from '../../assets/sign-in-background.png';
import signUpBackgroundImg from '../../assets/sign-up-background.png';

import {
  Container,
  Panel,
  Brand,
  Body,
  Heading,
  Footer,
  Photo,
} from './styles';

export { InlineLink } from './styles';

const images = {
  signin: signInBackgroundImg,
  signup: signUpBackgroundImg,
};

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  image?: keyof typeof images;
  // Links abaixo do conteúdo (ex: "Voltar ao início")
  footer?: React.ReactNode;
  // Conteúdo mais largo (página inicial)
  wide?: boolean;
  // Frase sobre a foto
  quote?: string;
}

// Telas públicas: formulário à esquerda e foto à direita
const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  image = 'signin',
  footer,
  wide = false,
  quote = 'O seu estilo nas mãos dos melhores especialistas.',
  children,
}) => (
  <Container>
    <Panel wide={wide}>
      <Brand to="/" title="GoBarber">
        <span>
          <FiScissors />
        </span>
        <strong>GoBarber</strong>
      </Brand>

      <Body wide={wide}>
        <Heading wide={wide}>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </Heading>

        {children}

        {footer && <Footer>{footer}</Footer>}
      </Body>

      <small>© {new Date().getFullYear()} GoBarber</small>
    </Panel>

    <Photo image={images[image]}>
      <blockquote>
        {quote}
        <cite>Agende online, sem fila e sem ligação.</cite>
      </blockquote>
    </Photo>
  </Container>
);

export default AuthLayout;
