import React, { useMemo } from 'react';
import styled from 'styled-components';

import { Select } from '../ui';
import { colors } from '../../styles/theme';

interface TimeSelectProps {
  // 'HH:mm'
  value: string;
  onChange(value: string): void;
  // Intervalo dos minutos (padrão 15: 00, 15, 30 e 45; 60: só hora cheia)
  stepMinutes?: number;
  disabled?: boolean;
  'aria-label'?: string;
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;

  span {
    color: ${colors.textSubtle};
  }
`;

// Listas curtas, com o número centralizado e sem a seta do navegador
const Part = styled(Select)`
  flex: 1;
  min-width: 0;
  padding: 0 4px;
  text-align: center;
  text-align-last: center;
  appearance: none;
`;

const pad = (value: number): string => String(value).padStart(2, '0');

// Hora e minutos em duas listas curtas, em vez do campo de hora do
// navegador, que mostra todos os minutos
const TimeSelect: React.FC<TimeSelectProps> = ({
  value,
  onChange,
  stepMinutes = 15,
  disabled,
  'aria-label': label = 'Horário',
}) => {
  const [hour = '00', minute = '00'] = (value || '').split(':');

  const minutes = useMemo(() => {
    const options: string[] = [];

    for (let current = 0; current < 60; current += stepMinutes) {
      options.push(pad(current));
    }

    // Um valor fora da grade (ex: salvo antes) continua aparecendo
    if (!options.includes(minute)) {
      options.push(minute);
      options.sort();
    }

    return options;
  }, [stepMinutes, minute]);

  return (
    <Wrapper>
      <Part
        aria-label={`${label} (hora)`}
        value={hour}
        disabled={disabled}
        onChange={event => onChange(`${event.target.value}:${minute}`)}
      >
        {Array.from({ length: 24 }, (_, index) => (
          <option key={index} value={pad(index)}>
            {pad(index)}
          </option>
        ))}
      </Part>
      <span>:</span>
      <Part
        aria-label={`${label} (minutos)`}
        value={minute}
        // Com só uma opção (hora cheia), não há o que escolher
        disabled={disabled || minutes.length === 1}
        onChange={event => onChange(`${hour}:${event.target.value}`)}
      >
        {minutes.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Part>
    </Wrapper>
  );
};

export default TimeSelect;
