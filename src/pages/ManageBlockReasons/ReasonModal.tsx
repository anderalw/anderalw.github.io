import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiCheck, FiX } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

import { UIButton, TextInput } from '../../components/ui';
import { colors } from '../../styles/theme';
import { Overlay, CloseButton } from '../Dashboard/AppointmentDetails/styles';
import { DialogHeader, Main, Footer } from '../Dashboard/modalLayout';
import {
  CompactDialog,
  ModalSubtitle,
  ModalForm,
  ModalField,
  FieldError,
  Hint,
} from '../ManageServices/styles';

export interface BlockReason {
  id: string;
  name: string;
}

interface ReasonModalProps {
  // null = novo motivo
  reason: BlockReason | null;
  onClose(): void;
  onSaved(): void;
}

const MAX_LENGTH = 40;

// Só um campo: modal mais baixo que o de serviços
const ReasonDialog = styled(CompactDialog)`
  max-width: 480px;
  height: min(320px, 100%);
`;

// Cadastrar ou renomear um motivo de bloqueio
const ReasonModal: React.FC<ReasonModalProps> = ({
  reason,
  onClose,
  onSaved,
}) => {
  const { addToast } = useToast();
  const isNew = !reason;

  const [name, setName] = useState(reason?.name || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !saving) onClose();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const clean = name.trim();

      if (!clean) {
        setError('Informe o nome do motivo.');
        return;
      }

      setError('');
      setSaving(true);

      try {
        if (reason) {
          await api.put(`/block-reasons/${reason.id}`, { name: clean });
        } else {
          await api.post('/block-reasons', { name: clean });
        }

        addToast({
          type: 'success',
          title: isNew ? 'Motivo adicionado' : 'Motivo atualizado',
          description: clean,
        });

        onSaved();
      } catch (err) {
        setSaving(false);
        setError(
          getApiErrorMessage(err, 'Não foi possível salvar, tente novamente.'),
        );
      }
    },
    [name, reason, isNew, addToast, onSaved],
  );

  return (
    <Overlay
      onMouseDown={event => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <ReasonDialog
        color={colors.primary}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reason-modal-title"
      >
        <DialogHeader>
          <div>
            <h2 id="reason-modal-title">
              {isNew ? 'Novo motivo' : `Editar ${reason?.name}`}
            </h2>
            <ModalSubtitle>
              Aparece na lista ao bloquear um horário.
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
            <ModalField hasError={!!error}>
              <span>Nome</span>
              <TextInput
                value={name}
                onChange={event => {
                  setName(event.target.value);
                  setError('');
                }}
                placeholder="Ex: Curso"
                maxLength={MAX_LENGTH}
                autoFocus
                aria-invalid={!!error}
              />
              <FieldError>{error}</FieldError>
            </ModalField>

            {!isNew && (
              <Hint>Bloqueios já feitos continuam com o nome antigo.</Hint>
            )}
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
              {!saving && (isNew ? 'Adicionar motivo' : 'Salvar alterações')}
            </UIButton>
          </Footer>
        </ModalForm>
      </ReasonDialog>
    </Overlay>
  );
};

export default ReasonModal;
