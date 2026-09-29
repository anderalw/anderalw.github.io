import React, { useEffect, useRef, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

import { AgendaProvider } from '../agenda';
import {
  PickerButton,
  PickerList,
  PickerOption,
  PickerWrapper,
} from './styles';

interface ProviderPickerProps {
  providers: AgendaProvider[];
  selected: string[];
  onChange(selected: string[]): void;
}

// Campo com cara de select que abre uma lista de barbeiros para marcar um
// ou mais. Ocupa a mesma altura com qualquer número de barbeiros
const ProviderPicker: React.FC<ProviderPickerProps> = ({
  providers,
  selected,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora ou com Esc (sem fechar o modal junto)
  useEffect(() => {
    if (!open) return undefined;

    function handleMouseDown(event: MouseEvent): void {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.stopImmediatePropagation();
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [open]);

  const allSelected = selected.length === providers.length;
  const names = providers
    .filter(provider => selected.includes(provider.id))
    .map(provider => provider.name);

  let label = names.join(', ');
  if (names.length === 0) label = 'Escolha os barbeiros';
  else if (allSelected && providers.length > 1) label = 'Todos os barbeiros';
  else if (names.length > 2) label = `${names.length} barbeiros`;

  const toggle = (id: string): void => {
    onChange(
      selected.includes(id)
        ? selected.filter(item => item !== id)
        : providers
            .map(p => p.id)
            .filter(p => p === id || selected.includes(p)),
    );
  };

  return (
    <PickerWrapper ref={wrapperRef}>
      <PickerButton
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Barbeiros: ${label}`}
        onClick={() => setOpen(value => !value)}
      >
        <span>{label}</span>
        <FiChevronDown />
      </PickerButton>

      {open && (
        <PickerList role="listbox" aria-multiselectable="true">
          {providers.length > 1 && (
            <PickerOption>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() =>
                  onChange(allSelected ? [] : providers.map(p => p.id))
                }
              />
              <strong>Todos</strong>
            </PickerOption>
          )}
          {providers.map(item => (
            <PickerOption key={item.id}>
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() => toggle(item.id)}
              />
              {item.name}
            </PickerOption>
          ))}
        </PickerList>
      )}
    </PickerWrapper>
  );
};

export default ProviderPicker;
