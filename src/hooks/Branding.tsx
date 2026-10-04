import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import api from '../services/api';
import {
  Vocabulary,
  DEFAULT_VOCABULARY,
  FeatureKey,
} from '../utils/vocabulary';
import TenantUnavailable, {
  TenantProblem,
} from '../components/TenantUnavailable';

export interface Branding {
  name: string;
  // '#rrggbb'
  primary_color: string;
  on_primary_color: string;
  logo_url: string | null;
  // Ramo do negócio e os termos das telas, fixos por ramo (hooks/Vocabulary)
  segment?: string;
  segment_name?: string;
  vocabulary?: Vocabulary;
  // Recursos ligados (padrão do ramo + ajuste do admin)
  features?: Partial<Record<FeatureKey, boolean>>;
  feature_defaults?: Partial<Record<FeatureKey, boolean>>;
}

interface BrandingContextData {
  branding: Branding;
  // Depois de salvar nas configurações: aplica na hora (junta com o que já
  // havia: o vocabulário vem separado da identidade)
  setBranding(branding: Partial<Branding>): void;
}

const STORAGE_KEY = '@GoBarber:branding';

export const DEFAULT_BRANDING: Branding = {
  name: 'Pontual',
  primary_color: '#ff9000',
  on_primary_color: '#1b1a1f',
  logo_url: null,
  vocabulary: DEFAULT_VOCABULARY,
};

const BrandingContext = createContext<BrandingContextData>(
  {} as BrandingContextData,
);

function hexToRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16)) as [
    number,
    number,
    number,
  ];
}

// Cor principal um pouco mais escura (passar o mouse nos botões)
function darken(hex: string, amount = 0.1): string {
  return `#${hexToRgb(hex)
    .map(channel =>
      Math.round(channel * (1 - amount))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

// Texto sobre a cor: escuro em cores claras, branco nas escuras (mesma
// regra da API)
export function onColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex).map(value => {
    const channel = value / 255;

    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.35 ? '#1b1a1f' : '#ffffff';
}

// Variáveis CSS de uma cor (ex: para uma prévia antes de salvar)
export function colorVariables(hex: string): Record<string, string> {
  return {
    '--color-primary': hex,
    '--color-primary-hover': darken(hex),
    '--color-primary-rgb': hexToRgb(hex).join(', '),
    '--color-on-primary': onColor(hex),
  };
}

// Cor atual (para quem precisa do valor, ex: avatar com as iniciais)
let currentColor = DEFAULT_BRANDING.primary_color;

export function brandColor(): string {
  return currentColor;
}

// Variáveis CSS da cor, título da aba e ícone
export function applyBranding(branding: Branding): void {
  const html = document.documentElement;
  const root = html.style;

  // Sem transições enquanto a cor muda (ver global.ts)
  html.classList.add('branding-switch');

  currentColor = branding.primary_color;
  root.setProperty('--color-primary', branding.primary_color);
  root.setProperty('--color-primary-hover', darken(branding.primary_color));
  root.setProperty(
    '--color-primary-rgb',
    hexToRgb(branding.primary_color).join(', '),
  );
  root.setProperty('--color-on-primary', branding.on_primary_color);

  // Aplica as cores agora, ainda sem transições: se o navegador só
  // recalculasse depois de liberar as transições, os elementos animariam
  // da cor antiga para a nova (e, em aba em segundo plano, parariam no meio)
  getComputedStyle(html).getPropertyValue('--color-primary');
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  html.offsetHeight;
  html.classList.remove('branding-switch');

  document.title = branding.name;

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.setAttribute('content', branding.primary_color);

  let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

  if (branding.logo_url) {
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      document.head.appendChild(icon);
    }

    icon.href = branding.logo_url;
  } else if (icon) {
    icon.remove();
  }
}

// Última identidade conhecida: a tela abre com o nome e a cor certos,
// sem piscar o laranja padrão (pode não haver storage)
function stored(): Branding {
  try {
    const value = localStorage.getItem(STORAGE_KEY);

    return value
      ? { ...DEFAULT_BRANDING, ...JSON.parse(value) }
      : DEFAULT_BRANDING;
  } catch {
    return DEFAULT_BRANDING;
  }
}

// Identidade da barbearia (nome, cor e logo), configurada pelo admin
export const BrandingProvider: React.FC = ({ children }) => {
  const [branding, setState] = useState<Branding>(() => {
    const initial = stored();

    applyBranding(initial);

    return initial;
  });

  const setBranding = useCallback((changes: Partial<Branding>) => {
    setState(previous => {
      const next = { ...previous, ...changes };

      applyBranding(next);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Sem storage: vale até recarregar a página
      }

      return next;
    });
  }, []);

  // Endereço sem barbearia, ou barbearia suspensa: nada do sistema abre
  const [problem, setProblem] = useState<TenantProblem | null>(null);

  useEffect(() => {
    api
      .get<Branding>('/settings/branding')
      .then(response => setBranding(response.data))
      .catch(error => {
        const code = error?.response?.data?.code;

        if (code === 'TENANT_NOT_FOUND') setProblem('not_found');
        if (code === 'TENANT_SUSPENDED') setProblem('suspended');
        // Sem a API, fica a identidade guardada (ou a padrão)
      });
  }, [setBranding]);

  const value = useMemo(
    () => ({ branding, setBranding }),
    [branding, setBranding],
  );

  if (problem) return <TenantUnavailable problem={problem} />;

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
};

export function useBranding(): BrandingContextData {
  return useContext(BrandingContext);
}
