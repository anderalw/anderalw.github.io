// Cores e medidas do painel do barbeiro. As telas do cliente ainda usam os
// valores antigos direto no CSS
export const colors = {
  // Fundo da aplicação e das áreas afundadas (campos, trilhas)
  background: '#1b1a1f',
  sunken: '#161519',
  // Menu lateral, cards e painéis
  surface: '#232228',
  surfaceHover: '#2c2a32',
  border: '#302e36',
  borderStrong: '#423f4a',

  text: '#f4ede8',
  textMuted: '#a9a4a1',
  textSubtle: '#6f6a70',

  primary: '#ff9000',
  primaryHover: '#e88300',
  // Texto sobre o laranja
  onPrimary: '#1b1a1f',
  primarySoft: 'rgba(255, 144, 0, 0.12)',

  danger: '#f2555a',
  dangerSoft: 'rgba(242, 85, 90, 0.12)',
  success: '#4cc38a',
  successSoft: 'rgba(76, 195, 138, 0.12)',
};

export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
};

export const shadow = {
  popover: '0 12px 32px rgba(0, 0, 0, 0.45)',
};

export const SIDEBAR_WIDTH = 248;
// Abaixo desta largura o menu lateral vira uma coluna só de ícones
export const SIDEBAR_COLLAPSE = '(max-width: 1023px)';
