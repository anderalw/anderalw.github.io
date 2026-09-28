import { RefObject, useLayoutEffect, useState } from 'react';

import { MIN_HOUR_HEIGHT, MAX_HOUR_HEIGHT, AGENDA_PADDING } from './styles';

// Divide o espaço livre abaixo do cabeçalho da grade pelas horas do dia,
// para a agenda caber na tela sem barra de rolagem
export default function useHourHeight(
  headerRef: RefObject<HTMLElement>,
  hoursCount: number,
  // Qualquer mudança que altere a posição do cabeçalho (ex: carregamento)
  layoutKey: unknown,
): number {
  const [hourHeight, setHourHeight] = useState(64);

  useLayoutEffect(() => {
    function fitToScreen(): void {
      const header = headerRef.current;

      if (!header || hoursCount === 0) {
        return;
      }

      const bodyTop = header.getBoundingClientRect().bottom;
      // Espaço entre a grade e o pé da tela
      const available = window.innerHeight - bodyTop - AGENDA_PADDING;
      const fitted = Math.floor(available / hoursCount);

      setHourHeight(
        Math.min(MAX_HOUR_HEIGHT, Math.max(MIN_HOUR_HEIGHT, fitted)),
      );
    }

    fitToScreen();
    window.addEventListener('resize', fitToScreen);

    return () => window.removeEventListener('resize', fitToScreen);
  }, [headerRef, hoursCount, layoutKey]);

  return hourHeight;
}
