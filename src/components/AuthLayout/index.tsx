import React from 'react';

import { useBranding } from '../../hooks/Branding';
import BrandMark, { BrandName } from '../BrandMark';
import ThemeToggle from '../ThemeToggle';
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
  TopBar,
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
}) => {
  const { branding } = useBranding();

  return (
    <Container>
      <Panel wide={wide}>
        <TopBar>
          <Brand to="/" title={branding.name}>
            <BrandMark size={32} />
            <BrandName>{branding.name}</BrandName>
          </Brand>
          <ThemeToggle />
        </TopBar>

        <Body wide={wide}>
          <Heading wide={wide}>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </Heading>

          {children}

          {footer && <Footer>{footer}</Footer>}
        </Body>

        <small>
          © {new Date().getFullYear()} {branding.name}
        </small>
      </Panel>

      <Photo image={images[image]}>
        <blockquote>
          {quote}
          <cite>Agende online, sem fila e sem ligação.</cite>
        </blockquote>
      </Photo>
    </Container>
  );
};

export default AuthLayout;
