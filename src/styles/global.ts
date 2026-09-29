import { createGlobalStyle } from 'styled-components';

import { colors } from './theme';

export default createGlobalStyle`
* {
  margin:0;
  padding: 0;
  box-sizing: border-box;
  outline: 0;
}

/* Modo escuro (padrão). O modo claro troca os valores logo abaixo; quem
   escolhe é hooks/Theme (data-theme no <html>) */
:root {
  /* Campos de data, selects e barras de rolagem nativos no mesmo modo */
  color-scheme: dark;

  --c-background: #1b1a1f;
  --c-sunken: #161519;
  --c-surface: #232228;
  --c-surface-hover: #2c2a32;
  --c-border: #302e36;
  --c-border-strong: #423f4a;

  --c-text: #f4ede8;
  --c-text-muted: #a9a4a1;
  --c-text-subtle: #6f6a70;

  --c-danger: #f2555a;
  --c-danger-soft: rgba(242, 85, 90, 0.12);
  --c-success: #4cc38a;
  --c-success-soft: rgba(76, 195, 138, 0.12);
  --c-warning: #fcc419;
  --c-warning-soft: rgba(252, 196, 25, 0.12);
  --c-info: #4dabf7;
  --c-info-soft: rgba(77, 171, 247, 0.12);

  --c-overlay: rgba(18, 17, 22, 0.7);
  --c-shadow-popover: 0 12px 32px rgba(0, 0, 0, 0.45);
  --c-shadow-card: 0 4px 12px rgba(0, 0, 0, 0.35);

  /* Cards da agenda: a cor do barbeiro misturada com o fundo */
  --c-card-base: #000000;
  --c-card-tint: 45%;
  --c-card-tint-past: 22%;

  /* Cor da barbearia: o laranja do GoBarber até carregar a configurada */
  --color-primary: #ff9000;
  --color-primary-hover: #e88300;
  --color-primary-rgb: 255, 144, 0;
  --color-on-primary: #1b1a1f;
}

:root[data-theme='light'] {
  color-scheme: light;

  --c-background: #f3f2ef;
  --c-sunken: #ebe9e5;
  --c-surface: #ffffff;
  --c-surface-hover: #f1efec;
  --c-border: #e3e0db;
  --c-border-strong: #cfcbc4;

  --c-text: #1f1d24;
  --c-text-muted: #5d5960;
  --c-text-subtle: #8c878e;

  --c-danger: #d63a3f;
  --c-danger-soft: rgba(214, 58, 63, 0.1);
  --c-success: #23865a;
  --c-success-soft: rgba(35, 134, 90, 0.11);
  --c-warning: #b7791f;
  --c-warning-soft: rgba(214, 150, 20, 0.14);
  --c-info: #1c7ed6;
  --c-info-soft: rgba(28, 126, 214, 0.1);

  --c-overlay: rgba(31, 29, 36, 0.45);
  --c-shadow-popover: 0 12px 32px rgba(31, 29, 36, 0.16);
  --c-shadow-card: 0 4px 12px rgba(31, 29, 36, 0.14);

  --c-card-base: #ffffff;
  --c-card-tint: 24%;
  --c-card-tint-past: 12%;
}

/* Troca da cor da barbearia ou do modo: sem animar (senão botões e menus
   passariam pela cor antiga, e em abas em segundo plano ficariam presos) */
.branding-switch *,
.branding-switch *::before,
.branding-switch *::after {
  transition: none !important;
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
