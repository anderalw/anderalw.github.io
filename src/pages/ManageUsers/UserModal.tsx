import React, { FormEvent, useEffect, useState } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { UIButton, Label, TextInput } from '../../components/ui';
import { colors } from '../../styles/theme';
import { Overlay, CloseButton } from '../Dashboard/AppointmentDetails/styles';
import { DialogHeader, Footer } from '../Dashboard/modalLayout';

import { StaffUser } from './types';
import { FormDialog, DialogBody, Hint, ErrorText } from './styles';

interface UserModalProps {
  onClose(): void;
  // O usuário criado (a tela abre a página dele para dar as permissões)
  onCreated(user: StaffUser): void;
}

// Cadastro de um usuário da equipe: só nome e e-mail. O perfil e as
// permissões ficam na página dele, depois de criado
const UserModal: React.FC<UserModalProps> = ({ onClose, onCreated }) => {
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Esc fecha (a não ser no meio do salvamento)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !saving) onClose();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();

    if (!name.trim() || !email.trim()) {
      setError('Informe o nome e o e-mail.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await api.post<StaffUser>('/users', { name, email });

      addToast({
        type: 'success',
        title: 'Usuário cadastrado!',
        description: 'Agora escolha o que ele pode fazer no sistema.',
      });

      onCreated(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Confira os dados e tente novamente.'));
      setSaving(false);
    }
  };

  return (
    <Overlay
      onMouseDown={event => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <FormDialog
        as="form"
        color={colors.primary}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-modal-title"
        onSubmit={handleSubmit}
        style={{ height: 'min(400px, 100%)' }}
      >
        <DialogHeader>
          <h2 id="user-modal-title">Novo usuário</h2>
          <CloseButton
            type="button"
            aria-label="Fechar"
            title="Fechar (Esc)"
            onClick={onClose}
          >
            <FiX />
          </CloseButton>
        </DialogHeader>

        <DialogBody>
          <Label>
            Nome completo
            <TextInput
              value={name}
              maxLength={100}
              autoFocus
              onChange={event => setName(event.target.value)}
            />
          </Label>
          <Label>
            E-mail
            <TextInput
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
          </Label>
          <Hint>
            A senha provisória é o próprio e-mail: a pessoa cria a dela no
            primeiro acesso. Depois de cadastrar, você escolhe o que ela pode
            fazer.
          </Hint>

          <ErrorText role="alert">{error}</ErrorText>
        </DialogBody>

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
            {saving ? 'Cadastrando...' : 'Cadastrar usuário'}
          </UIButton>
        </Footer>
      </FormDialog>
    </Overlay>
  );
};

export default UserModal;
