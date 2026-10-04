import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';

import api from '../../services/api';
import { Permission } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { UIButton, Label, TextInput } from '../../components/ui';
import { colors } from '../../styles/theme';
import { Overlay, CloseButton } from '../Dashboard/AppointmentDetails/styles';
import { DialogHeader, Footer } from '../Dashboard/modalLayout';

import { PermissionItem, RoleItem } from './types';
import {
  FormDialog,
  DialogBody,
  Hint,
  ErrorText,
  PermissionGroups,
  PermissionGroup,
} from './styles';
import { useVocabulary } from '../../hooks/Vocabulary';

interface RoleModalProps {
  // null = novo perfil
  role: RoleItem | null;
  catalog: PermissionItem[];
  onClose(): void;
  onSaved(): void;
}

// Perfil de acesso: o nome e as permissões, agrupadas por assunto. O
// Administrador só é mostrado (pode tudo e não muda)
const RoleModal: React.FC<RoleModalProps> = ({
  role,
  catalog,
  onClose,
  onSaved,
}) => {
  const terms = useVocabulary();
  const { addToast } = useToast();
  const isNew = !role;
  const locked = !!role?.is_admin;

  const [name, setName] = useState(role?.name || '');
  const [selected, setSelected] = useState<Permission[]>(
    role?.permissions || [],
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !saving) onClose();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  const toggle = (key: Permission): void => {
    setSelected(current =>
      current.includes(key)
        ? current.filter(item => item !== key)
        : [...current, key],
    );
  };

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();

    if (!name.trim()) {
      setError('Informe o nome do perfil.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (role) {
        await api.put(`/roles/${role.id}`, { name, permissions: selected });
      } else {
        await api.post('/roles', { name, permissions: selected });
      }

      addToast({
        type: 'success',
        title: isNew ? 'Perfil criado!' : 'Perfil atualizado',
        description: isNew
          ? `${name.trim()} já pode ser escolhido para os usuários.`
          : `Quem tem o perfil ${name.trim()} já segue as novas permissões.`,
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
        wide
        color={colors.primary}
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-modal-title"
        onSubmit={handleSubmit}
      >
        <DialogHeader>
          <h2 id="role-modal-title">
            {isNew ? 'Novo perfil' : `Perfil ${role?.name}`}
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
            Nome do perfil
            <TextInput
              value={name}
              maxLength={60}
              autoFocus={!locked}
              disabled={locked}
              placeholder="Ex.: Financeiro"
              onChange={event => setName(event.target.value)}
            />
          </Label>

          <Hint>
            {locked
              ? 'O Administrador pode tudo, inclusive o que surgir em versões novas, e não pode ser alterado.'
              : `Sem nenhuma permissão, a pessoa vê e mexe só na própria agenda (se for ${terms.professional}).`}
          </Hint>

          <PermissionGroups>
            {groups.map(group => (
              <PermissionGroup key={group.name}>
                <legend>{group.name}</legend>
                {group.items.map(item => (
                  <label key={item.key} htmlFor={`permission-${item.key}`}>
                    <input
                      id={`permission-${item.key}`}
                      type="checkbox"
                      checked={locked || selected.includes(item.key)}
                      disabled={locked}
                      onChange={() => toggle(item.key)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </PermissionGroup>
            ))}
          </PermissionGroups>

          <ErrorText role="alert">{error}</ErrorText>
        </DialogBody>

        <Footer>
          <UIButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            {locked ? 'Fechar' : 'Cancelar'}
          </UIButton>
          {!locked && (
            <UIButton type="submit" disabled={saving}>
              <FiCheck />
              {saving && 'Salvando...'}
              {!saving && (isNew ? 'Criar perfil' : 'Salvar perfil')}
            </UIButton>
          )}
        </Footer>
      </FormDialog>
    </Overlay>
  );
};

export default RoleModal;
