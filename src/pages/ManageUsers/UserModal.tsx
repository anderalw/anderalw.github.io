import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { FiCheck, FiKey, FiX } from 'react-icons/fi';

import api from '../../services/api';
import { Permission } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { UIButton, Label, TextInput, Select } from '../../components/ui';
import { colors } from '../../styles/theme';
import { Overlay, CloseButton } from '../Dashboard/AppointmentDetails/styles';
import { DialogHeader, Footer } from '../Dashboard/modalLayout';

import { PermissionItem, RoleItem, StaffUser } from './types';
import {
  FormDialog,
  DialogBody,
  Hint,
  ErrorText,
  FieldRow,
  PermissionGroups,
  PermissionGroup,
} from './styles';

interface UserModalProps {
  // null = novo usuário
  user: StaffUser | null;
  roles: RoleItem[];
  catalog: PermissionItem[];
  // Quem está logado não mexe no próprio acesso
  isYou: boolean;
  onClose(): void;
  onSaved(): void;
}

// Cadastro e edição de um usuário da equipe: dados, perfil (opcional) e as
// permissões dele. As do perfil aparecem marcadas e travadas; as outras
// valem só para este usuário. A senha provisória é o próprio e-mail
const UserModal: React.FC<UserModalProps> = ({
  user,
  roles,
  catalog,
  isYou,
  onClose,
  onSaved,
}) => {
  const { addToast } = useToast();
  const isNew = !user;

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  // '' = sem perfil
  const [roleId, setRoleId] = useState(user?.role?.id || '');
  const [own, setOwn] = useState<Permission[]>(user?.own_permissions || []);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const role = roles.find(item => item.id === roleId) || null;
  const fromRole = useMemo(() => role?.permissions || [], [role]);

  const groups = useMemo(
    () =>
      catalog.reduce<Array<{ name: string; items: PermissionItem[] }>>(
        (list, item) => {
          const group = list.find(entry => entry.name === item.group);

          if (group) group.items.push(item);
          else list.push({ name: item.group, items: [item] });

          return list;
        },
        [],
      ),
    [catalog],
  );

  // Esc fecha (a não ser no meio do salvamento)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !saving) onClose();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  const toggle = (key: Permission): void => {
    setOwn(current =>
      current.includes(key)
        ? current.filter(item => item !== key)
        : [...current, key],
    );
  };

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();

    if (!name.trim() || !email.trim()) {
      setError('Informe o nome e o e-mail.');
      return;
    }

    setSaving(true);
    setError('');

    // As que o perfil já dá não precisam ficar no usuário
    const permissions = own.filter(item => !fromRole.includes(item));
    const body = { name, email, role_id: roleId || null, permissions };

    try {
      if (user) {
        await api.put(`/users/${user.id}`, body);
      } else {
        await api.post('/users', body);
      }

      addToast({
        type: 'success',
        title: isNew ? 'Usuário cadastrado!' : 'Alterações salvas',
        description: isNew
          ? `${name.trim()} entra com o e-mail como senha e cria a dele no primeiro acesso.`
          : `Dados de ${name.trim()} atualizados.`,
      });

      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Confira os dados e tente novamente.'));
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async (): Promise<void> => {
    if (!user) return;

    setResetting(true);
    setError('');

    try {
      await api.post(`/users/${user.id}/reset-password`);

      addToast({
        type: 'success',
        title: 'Senha redefinida',
        description: `${user.name} entra com o e-mail como senha e cria uma nova no próximo acesso.`,
      });

      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível redefinir a senha.'));
    } finally {
      setResetting(false);
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
        wide
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
          <FieldRow>
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
          </FieldRow>

          <FieldRow>
            <Label>
              Perfil (opcional)
              <Select
                value={roleId}
                disabled={isYou}
                title={isYou ? 'Você não pode mudar o seu próprio acesso' : ''}
                onChange={event => setRoleId(event.target.value)}
              >
                <option value="">Sem perfil</option>
                {roles.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Label>
            <Hint>
              {isNew
                ? 'Senha provisória: o próprio e-mail. A pessoa cria a dela no primeiro acesso.'
                : 'Para a pessoa atender e ter agenda, adicione em Barbeiros.'}
            </Hint>
          </FieldRow>

          <PermissionGroups>
            {groups.map(group => (
              <PermissionGroup key={group.name}>
                <legend>{group.name}</legend>
                {group.items.map(item => {
                  const locked = fromRole.includes(item.key);

                  return (
                    <label
                      key={item.key}
                      htmlFor={`user-permission-${item.key}`}
                      title={locked ? `Vem do perfil ${role?.name}` : ''}
                    >
                      <input
                        id={`user-permission-${item.key}`}
                        type="checkbox"
                        checked={locked || own.includes(item.key)}
                        disabled={locked || isYou}
                        onChange={() => toggle(item.key)}
                      />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </PermissionGroup>
            ))}
          </PermissionGroups>

          <ErrorText role="alert">{error}</ErrorText>
        </DialogBody>

        <Footer>
          {user && !isYou && (
            <UIButton
              type="button"
              variant="ghost"
              disabled={saving || resetting}
              title="A senha volta a ser o e-mail, com troca no próximo acesso"
              onClick={resetPassword}
              style={{ marginRight: 'auto' }}
            >
              <FiKey />
              {resetting ? 'Redefinindo...' : 'Redefinir senha'}
            </UIButton>
          )}
          <UIButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </UIButton>
          <UIButton type="submit" disabled={saving || resetting}>
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
