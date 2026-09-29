// Cores e medidas do sistema. Todas as cores são variáveis CSS: os valores
// dos modos escuro e claro ficam em global.ts, e a cor principal (a da
// barbearia) é definida em hooks/Branding
export const colors = {
  // Fundo da aplicação e das áreas afundadas (campos, trilhas)
  background: 'var(--c-background)',
  sunken: 'var(--c-sunken)',
  // Menu lateral, cards e painéis
  surface: 'var(--c-surface)',
  surfaceHover: 'var(--c-surface-hover)',
  border: 'var(--c-border)',
  borderStrong: 'var(--c-border-strong)',

  text: 'var(--c-text)',
  textMuted: 'var(--c-text-muted)',
  textSubtle: 'var(--c-text-subtle)',

  // Cor da barbearia (configurável)
  primary: 'var(--color-primary)',
  primaryHover: 'var(--color-primary-hover)',
  // Texto sobre a cor principal (escuro ou branco, conforme a cor)
  onPrimary: 'var(--color-on-primary)',
  primarySoft: 'rgba(var(--color-primary-rgb), 0.12)',
  // "r, g, b" da cor principal, para transparências: rgba(${primaryRgb}, .2)
  primaryRgb: 'var(--color-primary-rgb)',

  danger: 'var(--c-danger)',
  dangerSoft: 'var(--c-danger-soft)',
  success: 'var(--c-success)',
  successSoft: 'var(--c-success-soft)',
  // Avisos (a confirmar, faltas recentes, sem forma de pagamento)
  warning: 'var(--c-warning)',
  warningSoft: 'var(--c-warning-soft)',
  // Informação (em andamento, remarcado)
  info: 'var(--c-info)',
  infoSoft: 'var(--c-info-soft)',

  // Fundo escurecido atrás dos modais
  overlay: 'var(--c-overlay)',
};

export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
};

export const shadow = {
  popover: 'var(--c-shadow-popover)',
  card: 'var(--c-shadow-card)',
};

export const SIDEBAR_WIDTH = 248;
// Abaixo desta largura o menu lateral vira uma coluna só de ícones
export const SIDEBAR_COLLAPSE = '(max-width: 1023px)';
