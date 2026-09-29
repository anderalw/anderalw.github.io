import { createGlobalStyle } from 'styled-components';

import { colors } from './theme';

export default createGlobalStyle`
* {
  margin:0;
  padding: 0;
  box-sizing: border-box;
  outline: 0;
}

html {
  /* Campos de data, selects e barras de rolagem nativos no tema escuro */
  color-scheme: dark;
}

/* Troca da cor da barbearia: sem animar (senão botões e menus passariam
   pelo laranja, e em abas em segundo plano ficariam presos nele) */
.branding-switch *,
.branding-switch *::before,
.branding-switch *::after {
  transition: none !important;
}

/* Cor da barbearia: o laranja do GoBarber até carregar a configurada */
:root {
  --color-primary: #ff9000;
  --color-primary-hover: #e88300;
  --color-primary-rgb: 255, 144, 0;
  --color-on-primary: #1b1a1f;
}

body {
  background: ${colors.background};
  color: ${colors.text};
  -webkit-font-smoothing: antialiased;
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 16px;
}

input, button, select, textarea {
  font: inherit;
}

h1, h2, h3, h4, h5, h6, strong {
  font-weight: 600;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
}

/* Foco visível só pelo teclado, em toda a aplicação */
:focus-visible {
  outline: 2px solid ${colors.primary};
  outline-offset: 2px;
}

/* Barras de rolagem finas, como nos apps de desktop */
* {
  scrollbar-width: thin;
  scrollbar-color: ${colors.borderStrong} transparent;
}
`;
