import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronDown, FiSearch } from 'react-icons/fi';

import {
  SelectWrapper,
  SelectInput,
  SelectList,
  SelectOption,
  SelectEmpty,
} from './styles';

export interface BlockReason {
  id: string;
  name: string;
}

interface ReasonSelectProps {
  reasons: BlockReason[];
  // Ainda carregando a lista
  loading: boolean;
  value: string | null;
  invalid: boolean;
  onChange(reason: BlockReason): void;
}

// Sem acentos e minúsculo, para a busca achar "ferias" em "Férias"
const normalize = (text: string): string =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Campo com busca (como o selectize): digita para filtrar e escolhe com o
// mouse ou com as setas e Enter. A lista abre para cima, porque o campo
// fica no pé do modal
const ReasonSelect: React.FC<ReasonSelectProps> = ({
  reasons,
  loading,
  value,
  invalid,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = reasons.find(reason => reason.id === value) || null;

  const filtered = useMemo(() => {
    const term = normalize(query.trim());

    return term
      ? reasons.filter(reason => normalize(reason.name).includes(term))
      : reasons;
  }, [reasons, query]);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return undefined;

    function handleMouseDown(event: MouseEvent): void {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener('mousedown', handleMouseDown);

    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  const openList = (): void => {
    setQuery('');
    setHighlight(
      Math.max(
        0,
        reasons.findIndex(reason => reason.id === value),
      ),
    );
    setOpen(true);
  };

  const choose = (reason: BlockReason): void => {
    onChange(reason);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();

      if (!open) {
        openList();
        return;
      }

      const step = event.key === 'ArrowDown' ? 1 : -1;

      setHighlight(current =>
        filtered.length === 0
          ? 0
          : (current + step + filtered.length) % filtered.length,
      );
    } else if (event.key === 'Enter') {
      // Enter escolhe o motivo em vez de enviar o formulário
      if (open) {
        event.preventDefault();

        if (filtered[highlight]) choose(filtered[highlight]);
      }
    } else if (event.key === 'Escape' && open) {
      // Fecha só a lista, não o modal
      event.preventDefault();
      event.nativeEvent.stopImmediatePropagation();
      setOpen(false);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  const listId = 'block-reason-options';

  // Buscando: mostra o escolhido como dica; fechado: pede para escolher
  let placeholder = loading ? 'Carregando...' : 'Escolha o motivo';
  if (open) placeholder = selected?.name || 'Buscar motivo';

  return (
    <SelectWrapper ref={wrapperRef} invalid={invalid}>
      {open ? <FiSearch /> : null}
      <SelectInput
        ref={inputRef}
        role="combobox"
        aria-label="Motivo"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={invalid}
        searching={open}
        value={open ? query : selected?.name || ''}
        placeholder={placeholder}
        readOnly={!open}
        onFocus={() => !open && openList()}
        onClick={() => !open && openList()}
        onChange={event => {
          setQuery(event.target.value);
          setHighlight(0);
        }}
        onKeyDown={handleKeyDown}
      />
      <FiChevronDown className="chevron" />

      {open && (
        <SelectList id={listId} role="listbox">
          {filtered.map((reason, index) => (
            <SelectOption
              key={reason.id}
              role="option"
              aria-selected={reason.id === value}
              highlighted={index === highlight}
              selected={reason.id === value}
              // mousedown: escolhe antes do campo perder o foco
              onMouseDown={event => {
                event.preventDefault();
                choose(reason);
              }}
              onMouseEnter={() => setHighlight(index)}
            >
              {reason.name}
            </SelectOption>
          ))}

          {filtered.length === 0 && (
            <SelectEmpty>
              {reasons.length === 0
                ? 'Nenhum motivo cadastrado. Cadastre em Administração › Motivos de bloqueio.'
                : 'Nenhum motivo encontrado.'}
            </SelectEmpty>
          )}
        </SelectList>
      )}
    </SelectWrapper>
  );
};

export default ReasonSelect;
