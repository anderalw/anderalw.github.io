import React, { useCallback, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { FiCheck, FiCreditCard, FiX } from 'react-icons/fi';

import api from '../../services/api';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { UIButton, TextInput } from '../../components/ui';
import { colors, radius } from '../../styles/theme';
import { Overlay, CloseButton } from '../Dashboard/AppointmentDetails/styles';
import { DialogHeader, Main, Footer } from '../Dashboard/modalLayout';
import {
  CompactDialog,
  ModalSubtitle,
  ModalForm,
  ModalField,
  FieldError,
} from '../ManageServices/styles';

export interface RegisteredDevice {
  id: string;
  name: string;
  external_id: string;
  active: boolean;
}

interface TerminalDeviceModalProps {
  // Sem aparelho: cadastro de uma nova maquininha
  device: RegisteredDevice | null;
  providerLabel: string;
  deviceIdLabel: string;
  deviceIdHelp: string;
  onClose(): void;
  // Devolve a configuração atualizada (com a lista de maquininhas)
  onSaved(settings: unknown, name: string): void;
}

type Field = 'external_id' | 'name' | 'form';

interface FoundDevice {
  id: string;
  name: string;
}

// Tamanho fixo em cada modo: o cadastro tem a lista da conta, a edição não
const Dialog = styled(CompactDialog)<{ adding: boolean }>`
  height: min(${props => (props.adding ? 560 : 340)}px, 100%);
`;

// Aparelhos encontrados na conta da operadora: altura reservada, com rolagem
const Found = styled.div`
  height: 136px;
  margin-bottom: 18px;
  overflow-y: auto;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.sunken};

  > p {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 0 16px;
    font-size: 13px;
    text-align: center;
    color: ${colors.textMuted};
  }
`;

const FoundItem = styled.button<{ selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-bottom: 1px solid ${colors.border};
  background: transparent;
  color: ${colors.text};
  font: inherit;
  font-size: 14px;
  text-align: left;

  svg {
    width: 16px;
    height: 16px;
    color: ${colors.primary};
  }

  small {
    margin-left: auto;
    font-size: 12px;
    color: ${colors.textSubtle};
  }

  &:hover {
    background: ${colors.surfaceHover};
  }

  ${props =>
    props.selected &&
    css`
      &,
      &:hover {
        background: ${colors.primarySoft};
      }
    `}
`;

const SectionLabel = styled.span`
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: ${colors.textMuted};
`;

const Help = styled.small`
  font-size: 12px;
  color: ${colors.textSubtle};
`;

// Cadastrar uma maquininha da barbearia (ou trocar o nome dela)
const TerminalDeviceModal: React.FC<TerminalDeviceModalProps> = ({
  device,
  providerLabel,
  deviceIdLabel,
  deviceIdHelp,
  onClose,
  onSaved,
}) => {
  const adding = !device;

  const [externalId, setExternalId] = useState(device?.external_id || '');
  const [name, setName] = useState(device?.name || '');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [saving, setSaving] = useState(false);
  // null: ainda procurando na conta
  const [found, setFound] = useState<FoundDevice[] | null>(null);
  const [foundError, setFoundError] = useState('');

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !saving) onClose();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  useEffect(() => {
    if (!adding) return undefined;

    let active = true;

    api
      .get<FoundDevice[]>('/card-charges/devices/discover')
      .then(response => {
        if (active) setFound(response.data);
      })
      .catch(err => {
        if (!active) return;

        setFound([]);
        setFoundError(
          getApiErrorMessage(err, 'Não foi possível consultar a operadora.'),
        );
      });

    return () => {
      active = false;
    };
  }, [adding]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const next: Partial<Record<Field, string>> = {};

      if (adding && !externalId.trim()) {
        next.external_id = `Informe: ${deviceIdLabel.toLowerCase()}.`;
      }
      if (!name.trim()) next.name = 'Dê um nome, por exemplo "Balcão".';

      setErrors(next);

      if (Object.keys(next).length > 0) return;

      setSaving(true);

      try {
        const response = device
          ? await api.put(`/card-charges/devices/${device.id}`, {
              name: name.trim(),
            })
          : await api.post('/card-charges/devices', {
              external_id: externalId.trim(),
              name: name.trim(),
            });

        onSaved(response.data, name.trim());
      } catch (err) {
        setSaving(false);
        setErrors({
          form: getApiErrorMessage(
            err,
            'Não foi possível salvar, tente novamente.',
          ),
        });
      }
    },
    [adding, device, externalId, name, deviceIdLabel, onSaved],
  );

  let foundContent: React.ReactNode;

  if (found === null) {
    foundContent = <p>Procurando aparelhos na sua conta...</p>;
  } else if (foundError) {
    foundContent = <p>{foundError}</p>;
  } else if (found.length === 0) {
    foundContent = (
      <p>
        Nenhum aparelho novo na conta. Informe o identificador abaixo, como
        aparece na maquininha.
      </p>
    );
  } else {
    foundContent = found.map(item => (
      <FoundItem
        key={item.id}
        type="button"
        selected={externalId === item.id}
        onClick={() => {
          setExternalId(item.id);
          if (!name.trim()) setName(item.name);
          setErrors({});
        }}
      >
        <FiCreditCard />
        {item.name}
        <small>{item.id}</small>
      </FoundItem>
    ));
  }

  return (
    <Overlay
      onMouseDown={event => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <Dialog
        adding={adding}
        color={colors.primary}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terminal-device-title"
      >
        <DialogHeader>
          <div>
            <h2 id="terminal-device-title">
              {adding ? 'Adicionar maquininha' : 'Renomear maquininha'}
            </h2>
            <ModalSubtitle>
              {adding
                ? `Uma maquininha da barbearia na conta ${providerLabel}.`
                : `${deviceIdLabel}: ${device?.external_id}`}
            </ModalSubtitle>
          </div>
          <CloseButton
            type="button"
            aria-label="Fechar"
            title="Fechar (Esc)"
            onClick={onClose}
          >
            <FiX />
          </CloseButton>
        </DialogHeader>

        <ModalForm onSubmit={handleSubmit} noValidate>
          <Main>
            {adding && (
              <>
                <SectionLabel>Encontradas na sua conta</SectionLabel>
                <Found aria-live="polite">{foundContent}</Found>

                <ModalField hasError={!!errors.external_id}>
                  <span>{deviceIdLabel}</span>
                  <TextInput
                    value={externalId}
                    maxLength={100}
                    aria-invalid={!!errors.external_id}
                    onChange={event => {
                      setExternalId(event.target.value);
                      setErrors({});
                    }}
                  />
                  <Help>{deviceIdHelp}</Help>
                  <FieldError>{errors.external_id}</FieldError>
                </ModalField>
              </>
            )}

            <ModalField hasError={!!errors.name}>
              <span>Nome</span>
              <TextInput
                value={name}
                maxLength={60}
                autoFocus={!adding}
                placeholder="Ex: Balcão, Cadeira 2"
                aria-invalid={!!errors.name}
                onChange={event => {
                  setName(event.target.value);
                  setErrors({});
                }}
              />
              <FieldError>{errors.name}</FieldError>
            </ModalField>

            <FieldError role="alert">{errors.form}</FieldError>
          </Main>

          <Footer>
            <UIButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </UIButton>
            <UIButton type="submit" disabled={saving}>
              <FiCheck />
              {saving && 'Salvando...'}
              {!saving && (adding ? 'Adicionar' : 'Salvar')}
            </UIButton>
          </Footer>
        </ModalForm>
      </Dialog>
    </Overlay>
  );
};

export default TerminalDeviceModal;
