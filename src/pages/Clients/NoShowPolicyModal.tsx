import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiCheck, FiX } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

import { UIButton, Select } from '../../components/ui';
import { colors } from '../../styles/theme';
import { Overlay, CloseButton } from '../Dashboard/AppointmentDetails/styles';
import { DialogHeader, Main, Footer } from '../Dashboard/modalLayout';
import { WholeDay } from '../Dashboard/BlockModal/styles';
import {
  CompactDialog,
  ModalSubtitle,
  ModalForm,
  ModalField,
  FieldError,
  Hint,
} from '../ManageServices/styles';
import { NoShowPolicy, RECENT_APPOINTMENTS } from './types';
import { useVocabulary } from '../../hooks/Vocabulary';

interface NoShowPolicyModalProps {
  policy: NoShowPolicy;
  onClose(): void;
  onSaved(policy: NoShowPolicy): void;
}

const PolicyDialog = styled(CompactDialog)`
  max-width: 520px;
  height: min(390px, 100%);
`;

// Opção "Bloquear o site": desativada (e com o texto apagado) sem alerta
const BlockOption = styled(WholeDay)<{ disabled: boolean }>`
  align-items: flex-start;
  margin-top: 8px;
  line-height: 20px;
  opacity: ${props => (props.disabled ? 0.45 : 1)};
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};

  input {
    margin-top: 2px;
    flex-shrink: 0;
  }

  small {
    display: block;
    color: ${colors.textMuted};
    font-size: 13px;
  }
`;

// Limites oferecidos (0 desliga o alerta)
const THRESHOLDS = [0, 1, 2, 3, 4, 5];

// Admin define a partir de quantas faltas o cliente fica com alerta e se
// ele ainda pode agendar pelo site
const NoShowPolicyModal: React.FC<NoShowPolicyModalProps> = ({
  policy,
  onClose,
  onSaved,
}) => {
  const terms = useVocabulary();
  const { addToast } = useToast();

  const [threshold, setThreshold] = useState(policy.alert_threshold);
  const [blockOnline, setBlockOnline] = useState(policy.block_online);
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
      setSaving(true);
      setError('');

      try {
        const response = await api.put<NoShowPolicy>('/settings/no-show', {
          alert_threshold: threshold,
          block_online: threshold > 0 && blockOnline,
        });

        addToast({
          type: 'success',
          title: 'Política de faltas salva',
          description:
            response.data.alert_threshold === 0
              ? 'O alerta de faltas foi desligado.'
              : `Alerta a partir de ${response.data.alert_threshold} ${
                  response.data.alert_threshold === 1 ? 'falta' : 'faltas'
                }.`,
        });

        onSaved(response.data);
      } catch (err) {
        setSaving(false);
        setError(
          getApiErrorMessage(err, 'Não foi possível salvar, tente novamente.'),
        );
      }
    },
    [threshold, blockOnline, addToast, onSaved],
  );

  return (
    <Overlay
      onMouseDown={event => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <PolicyDialog
        color={colors.primary}
        role="dialog"
        aria-modal="true"
        aria-labelledby="no-show-policy-title"
      >
        <DialogHeader>
          <div>
            <h2 id="no-show-policy-title">Política de faltas</h2>
            <ModalSubtitle>
              Clientes que faltam aparecem com alerta na agenda e na ficha.
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
            <ModalField hasError={false}>
              <span>
                Alertar quando o cliente faltou, nos últimos{' '}
                {RECENT_APPOINTMENTS} agendamentos
              </span>
              <Select
                value={threshold}
                onChange={event => setThreshold(Number(event.target.value))}
                autoFocus
              >
                {THRESHOLDS.map(value => (
                  <option key={value} value={value}>
                    {value === 0 && 'Nunca (alerta desligado)'}
                    {value === 1 && '1 vez ou mais'}
                    {value > 1 && `${value} vezes ou mais`}
                  </option>
                ))}
              </Select>
            </ModalField>

            <Hint>
              Só contam os últimos {RECENT_APPOINTMENTS} agendamentos: quem
              volta a comparecer sai do alerta, e o cliente fiel que falta de
              vez em quando não é marcado.
            </Hint>

            <BlockOption disabled={threshold === 0}>
              <input
                type="checkbox"
                checked={threshold > 0 && blockOnline}
                disabled={threshold === 0}
                onChange={event => setBlockOnline(event.target.checked)}
              />
              <span>
                {`${terms.Clients} com alerta só agendam ${terms.byPlace}`}
                <small>
                  No site, eles veem um aviso para entrar em contato. A equipe
                  continua marcando normalmente pela agenda.
                </small>
              </span>
            </BlockOption>

            <FieldError role="alert">{error}</FieldError>
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
              {saving ? 'Salvando...' : 'Salvar'}
            </UIButton>
          </Footer>
        </ModalForm>
      </PolicyDialog>
    </Overlay>
  );
};

export default NoShowPolicyModal;
