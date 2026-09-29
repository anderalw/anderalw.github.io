import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

// 'system': segue o modo do computador ou do celular
export type ThemeChoice = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

interface ThemeContextData {
  choice: ThemeChoice;
  // O modo em uso (com 'system', o do aparelho)
  theme: ResolvedTheme;
  setChoice(choice: ThemeChoice): void;
}

// A mesma chave é lida no index.html, antes do React, para não piscar
const STORAGE_KEY = '@GoBarber:theme';
const LIGHT_QUERY = '(prefers-color-scheme: light)';

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

function storedChoice(): ThemeChoice {
  try {
    const value = localStorage.getItem(STORAGE_KEY);

    return value === 'light' || value === 'system' ? value : 'dark';
  } catch {
    return 'dark';
  }
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia && window.matchMedia(LIGHT_QUERY).matches
    ? 'light'
    : 'dark';
}

function resolve(choice: ThemeChoice): ResolvedTheme {
  return choice === 'system' ? systemTheme() : choice;
}

// Troca o modo sem animar os elementos (ver .branding-switch em global.ts)
function applyTheme(theme: ResolvedTheme): void {
  const html = document.documentElement;

  if (html.dataset.theme === theme) return;

  html.classList.add('branding-switch');
  html.dataset.theme = theme;
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  html.offsetHeight;
  html.classList.remove('branding-switch');
}

// Modo escuro ou claro, escolhido por quem usa (fica neste navegador)
export const ThemeProvider: React.FC = ({ children }) => {
  const [choice, setChoiceState] = useState<ThemeChoice>(storedChoice);
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolve(choice));

  useEffect(() => {
    const next = resolve(choice);

    setTheme(next);
    applyTheme(next);

    if (choice !== 'system' || !window.matchMedia) return undefined;

    // Automático: acompanha quando o aparelho muda de modo
    const query = window.matchMedia(LIGHT_QUERY);
    const handleChange = (): void => {
      const current = systemTheme();

      setTheme(current);
      applyTheme(current);
    };

    query.addEventListener('change', handleChange);

    return () => query.removeEventListener('change', handleChange);
  }, [choice]);

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sem storage: vale até recarregar a página
    }
  }, []);

  const value = useMemo(
    () => ({ choice, theme, setChoice }),
    [choice, theme, setChoice],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextData {
  return useContext(ThemeContext);
}
