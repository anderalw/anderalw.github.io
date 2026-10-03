import React, { FormEvent, useEffect, useState } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { UIButton, Label, TextInput, Select } from '../../components/ui';
import { colors } from '../../styles/theme';
import { Overlay, CloseButton } from '../Dashboard/AppointmentDetails/styles';
import { DialogHeader, Footer } from '../Dashboard/modalLayout';

import { RoleItem, StaffUser } from './types';
import { FormDialog, DialogBody, Hint, ErrorText } from './styles';

interface UserModalProps {
  // null = novo usuário
  user: StaffUser | null;
  roles: RoleItem[];
  // Quem está logado não troca o próprio perfil
  isYou: boolean;
  onClose(): void;
  onSaved(): void;
}

// Cadastro e edição de um usuário da equipe: dados de acesso e o perfil
const UserModal: React.FC<UserModalProps> = ({
  user,
  roles,
  isYou,
  onClose,
  onSaved,
}) => {
  const { addToast } = useToast();
  const isNew = !user;

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  // Novo usuário começa no perfil Barbeiro (o mais restrito), se houver
  const [roleId, setRoleId] = useState(
    user?.role?.id ||
      roles.find(role => role.system_key === 'barber')?.id ||
      roles.find(role => !role.is_admin)?.id ||
      '',
  );
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

    if (isNew && password.length < 6) {
      setError('A senha provisória precisa de pelo menos 6 caracteres.');
      return;
    }

    if (!isNew && password && password.length < 6) {
      setError('A nova senha precisa de pelo menos 6 caracteres.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (user) {
        await api.put(`/users/${user.id}`, {
          name,
          email,
          role_id: roleId,
          password,
        });
      } else {
        await api.post('/users', { name, email, password, role_id: roleId });
      }

      addToast({
        type: 'success',
        title: isNew ? 'Usuário cadastrado!' : 'Alterações salvas',
        description: isNew
          ? `${name.trim()} já pode entrar com o e-mail e a senha provisória.`
          : `Dados de ${name.trim()} atualizados.`,
      });

      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Confira os dados e tente novamente.'));
    } finally {
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
      >
        <DialogHeader>
          <h2 id="user-modal-title">
            {isNew ? 'Novo usuário' : `Editar ${user?.name}`}
          </h2>
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
          <Label>
            {isNew ? 'Senha provisória' : 'Nova senha (opcional)'}
            <TextInput
              type="password"
              value={password}
              autoComplete="new-password"
              placeholder={isNew ? '' : 'Deixe em branco para manter'}
              onChange={event => setPassword(event.target.value)}
            />
          </Label>
          <Label>
            Perfil de acesso
            <Select
              value={roleId}
              disabled={isYou}
              title={isYou ? 'Você não pode trocar o seu próprio perfil' : ''}
              onChange={event => setRoleId(event.target.value)}
            >
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </Label>
          <Hint>
            O perfil define o que a pessoa pode fazer no sistema. Para ela
            atender clientes e ter agenda, adicione em Barbeiros.
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
            {saving && 'Salvando...'}
            {!saving && (isNew ? 'Cadastrar usuário' : 'Salvar alterações')}
          </UIButton>
        </Footer>
      </FormDialog>
    </Overlay>
  );
};

export default UserModal;
