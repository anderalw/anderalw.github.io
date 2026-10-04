import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiCheck, FiX } from 'react-icons/fi';

import { UIButton } from '../../components/ui';
import { colors, radius } from '../../styles/theme';
import { Overlay, CloseButton } from '../Dashboard/AppointmentDetails/styles';
import { DialogHeader, Main, Footer } from '../Dashboard/modalLayout';
import { CompactDialog, ModalSubtitle } from '../ManageServices/styles';

interface ConsentModalProps {
  text: string;
  placeName: string;
  saving: boolean;
  onClose(): void;
  onAccept(): void;
}

const Dialog = styled(CompactDialog)`
  height: min(560px, 100%);
`;

// O texto rola dentro do modal (o tamanho do modal não muda)
const Text = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 16px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.sunken};
  font-size: 14px;
  line-height: 1.6;
  color: ${colors.text};
  white-space: pre-line;
`;

const Body = styled(Main)`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
`;

const Check = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: ${colors.text};
  cursor: pointer;

  input {
    width: 18px;
    height: 18px;
    accent-color: ${colors.primary};
  }
`;

// Termo de consentimento antes do agendamento pelo site
const ConsentModal: React.FC<ConsentModalProps> = ({
  text,
  placeName,
  saving,
  onClose,
  onAccept,
}) => {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !saving) onClose();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  return (
    <Overlay
      onMouseDown={event => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <Dialog
        color={colors.primary}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
      >
        <DialogHeader>
          <div>
            <h2 id="consent-title">Termo de consentimento</h2>
            <ModalSubtitle>{`Antes de agendar com ${placeName}`}</ModalSubtitle>
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

        <Body>
          <Text tabIndex={0}>{text}</Text>
          <Check htmlFor="consent-check">
            <input
              id="consent-check"
              type="checkbox"
              checked={checked}
              onChange={event => setChecked(event.target.checked)}
            />
            Li e aceito o termo
          </Check>
        </Body>

        <Footer>
          <UIButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Agora não
          </UIButton>
          <UIButton
            type="button"
            disabled={!checked || saving}
            onClick={onAccept}
          >
            <FiCheck />
            {saving ? 'Agendando...' : 'Aceitar e agendar'}
          </UIButton>
        </Footer>
      </Dialog>
    </Overlay>
  );
};

export default ConsentModal;
