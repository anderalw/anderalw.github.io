import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Redirect, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCheck,
  FiKey,
  FiPower,
  FiRotateCcw,
} from 'react-icons/fi';

import api from '../../services/api';
import { Permission, useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import avatarFallback from '../../utils/avatarFallback';

import AppLayout from '../../components/AppLayout';
import {
  Page,
  Card,
  CardHeader,
  CardBody,
  UIButton,
  Badge,
  Label,
  TextInput,
  Select,
} from '../../components/ui';

import { PermissionItem, RoleItem, StaffUser } from './types';
import ProfileExtraFields from '../../components/ProfileExtraFields';
import {
  ExtraValues,
  extraPayload,
  toAddress,
  useProfileFields,
} from '../../utils/profileFields';

import {
  Hint,
  FieldRow,
  PermissionGroups,
  PermissionGroup,
  Person,
  BackLink,
  PageTop,
  CardGrid,
  CardActions,
} from './styles';
import { useVocabulary } from '../../hooks/Vocabulary';

// Página de um usuário da equipe: os dados, o que ele pode fazer (perfil
// opcional + permissões dele), a senha e a situação da conta
const UserPage: React.FC = () => {
  const terms = useVocabulary();
  const { id } = useParams<{ id: string }>();
  const { user: me, can } = useAuth();
  const { addToast } = useToast();
  const allowed = can('team');
  const isYou = id === me.id;

  const [user, setUser] = useState<StaffUser | null>(null);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [catalog, setCatalog] = useState<PermissionItem[]>([]);
  const [notFound, setNotFound] = useState(false);

  // Dados
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // Telefone, CPF, nascimento e endereço (conforme as regras da barbearia)
  const staffRules = useProfileFields('staff');
  const [extras, setExtras] = useState<ExtraValues>({});
  const [savedExtras, setSavedExtras] = useState('');
  // Acesso ('' = sem perfil)
  const [roleId, setRoleId] = useState('');
  const [own, setOwn] = useState<Permission[]>([]);
  const [busy, setBusy] = useState<
    'data' | 'access' | 'password' | 'active' | null
  >(null);

  const receive = useCallback((data: StaffUser) => {
    setUser(data);
    setName(data.name);
    setEmail(data.email);

    const loaded: ExtraValues = {
      phone: data.phone || '',
      cpf: data.cpf || '',
      birth_date: data.birth_date?.slice(0, 10) || '',
      address: toAddress(data.address),
    };

    setExtras(loaded);
    setSavedExtras(JSON.stringify(loaded));
    setRoleId(data.role?.id || '');
    setOwn(data.own_permissions);
  }, []);

  useEffect(() => {
    if (!allowed) return;

    Promise.all([
      api.get<StaffUser>(`/users/${id}`),
      api.get<RoleItem[]>('/roles'),
      api.get<PermissionItem[]>('/roles/permissions'),
    ])
      .then(([userResponse, rolesResponse, catalogResponse]) => {
        receive(userResponse.data);
        setRoles(rolesResponse.data);
        setCatalog(catalogResponse.data);
      })
      .catch(() => setNotFound(true));
  }, [allowed, id, receive]);

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

  // O que mudou no acesso desde o último salvamento
  const accessChanged =
    !!user &&
    ((user.role?.id || '') !== roleId ||
      own
        .filter(item => !fromRole.includes(item))
        .sort()
        .join() !== user.own_permissions.slice().sort().join());
  const dataChanged =
    !!user &&
    (name.trim() !== user.name ||
      email.trim() !== user.email ||
      JSON.stringify(extras) !== savedExtras);

  // A API recebe tudo junto; cada cartão salva a sua parte
  const save = async (part: 'data' | 'access'): Promise<void> => {
    if (!user) return;

    setBusy(part);

    try {
      const response = await api.put<StaffUser>(`/users/${user.id}`, {
        name: part === 'data' ? name : user.name,
        email: part === 'data' ? email : user.email,
        role_id: (part === 'access' ? roleId : user.role?.id) || null,
        permissions:
          part === 'access'
            ? own.filter(item => !fromRole.includes(item))
            : user.own_permissions,
        ...(part === 'data' ? extraPayload(staffRules, extras) : {}),
      });

      receive(response.data);
      addToast({
        type: 'success',
        title: part === 'data' ? 'Dados salvos' : 'Acesso atualizado',
        description:
          part === 'access'
            ? `${response.data.name} já segue as novas permissões.`
            : undefined,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível salvar',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setBusy(null);
    }
  };

  const resetPassword = async (): Promise<void> => {
    if (!user) return;

    setBusy('password');

    try {
      const response = await api.post<StaffUser>(
        `/users/${user.id}/reset-password`,
      );

      receive(response.data);
      addToast({
        type: 'success',
        title: 'Senha redefinida',
        description: `${user.name} entra com o e-mail como senha e cria uma nova no próximo acesso.`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível redefinir a senha',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setBusy(null);
    }
  };

  const setActive = async (active: boolean): Promise<void> => {
    if (!user) return;

    setBusy('active');

    try {
      const response = await api.patch<StaffUser>(`/users/${user.id}/active`, {
        active,
      });

      receive(response.data);
      addToast({
        type: 'success',
        title: active ? 'Usuário reativado' : 'Usuário desativado',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: active
          ? 'Não foi possível reativar'
          : 'Não foi possível desativar',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setBusy(null);
    }
  };

  const toggle = (key: Permission): void => {
    setOwn(current =>
      current.includes(key)
        ? current.filter(item => item !== key)
        : [...current, key],
    );
  };

  if (!allowed) return <Redirect to="/dashboard" />;

  const onSubmitData = (event: FormEvent): void => {
    event.preventDefault();
    save('data');
  };

  return (
    <AppLayout>
      <Page>
        <BackLink to="/admin/usuarios">
          <FiArrowLeft />
          Usuários
        </BackLink>

        {notFound && <Hint>Usuário não encontrado.</Hint>}

        {user && (
          <>
            <PageTop>
              <Person>
                <img
                  src={user.avatar_url || avatarFallback(user.name)}
                  alt=""
                  onError={e => {
                    e.currentTarget.src = avatarFallback(user.name);
                  }}
                />
                <div>
                  <h1>
                    {user.name}
                    {isYou && <Badge tone="primary">Você</Badge>}
                    <Badge tone={user.active ? 'success' : 'neutral'}>
                      {user.active ? 'Ativo' : 'Desativado'}
                    </Badge>
                  </h1>
                  <small>
                    {user.is_barber ? terms.Professional : 'Não atende'}
                    {' · '}
                    {user.role ? `Perfil ${user.role.name}` : 'Sem perfil'}
                  </small>
                </div>
              </Person>
            </PageTop>

            <CardGrid>
              <Card as="form" onSubmit={onSubmitData}>
                <CardHeader>
                  <h2>Dados</h2>
                </CardHeader>
                <CardBody>
                  <FieldRow>
                    <Label>
                      Nome completo
                      <TextInput
                        value={name}
                        maxLength={100}
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
                  <div style={{ marginTop: 14 }}>
                    <ProfileExtraFields
                      rules={staffRules}
                      values={extras}
                      onChange={setExtras}
                    />
                  </div>
                  <CardActions>
                    <UIButton
                      type="submit"
                      variant="secondary"
                      disabled={!dataChanged || !!busy}
                    >
                      <FiCheck />
                      {busy === 'data' ? 'Salvando...' : 'Salvar dados'}
                    </UIButton>
                  </CardActions>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h2>Conta</h2>
                </CardHeader>
                <CardBody>
                  <Hint>
                    {user.must_change_password
                      ? 'Senha provisória (o e-mail): a pessoa cria a dela no próximo acesso.'
                      : 'A pessoa já criou a própria senha.'}
                  </Hint>
                  <CardActions>
                    <UIButton
                      type="button"
                      variant="secondary"
                      disabled={isYou || !!busy}
                      title={
                        isYou
                          ? 'Para trocar a sua senha, use Meu perfil'
                          : 'A senha volta a ser o e-mail, com troca no próximo acesso'
                      }
                      onClick={resetPassword}
                    >
                      <FiKey />
                      {busy === 'password'
                        ? 'Redefinindo...'
                        : 'Redefinir senha'}
                    </UIButton>
                    {user.active ? (
                      <UIButton
                        type="button"
                        variant="ghost"
                        disabled={isYou || !!busy}
                        title={
                          isYou
                            ? 'Você não pode desativar a sua própria conta'
                            : 'A pessoa não consegue mais entrar no sistema'
                        }
                        onClick={() => setActive(false)}
                      >
                        <FiPower />
                        Desativar
                      </UIButton>
                    ) : (
                      <UIButton
                        type="button"
                        variant="ghost"
                        disabled={!!busy}
                        onClick={() => setActive(true)}
                      >
                        <FiRotateCcw />
                        Reativar
                      </UIButton>
                    )}
                  </CardActions>
                </CardBody>
              </Card>
            </CardGrid>

            <Card>
              <CardHeader>
                <h2>Acesso</h2>
              </CardHeader>
              <CardBody>
                <FieldRow>
                  <Label>
                    Perfil (opcional)
                    <Select
                      value={roleId}
                      disabled={isYou}
                      title={
                        isYou ? 'Você não pode mudar o seu próprio acesso' : ''
                      }
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
                    {isYou
                      ? 'Você não pode mudar o seu próprio acesso: peça a outro administrador.'
                      : 'O perfil já marca um conjunto de permissões. Marque abaixo as que forem só desta pessoa. Sem nenhuma, ela vê e mexe só na própria agenda.'}
                  </Hint>
                </FieldRow>

                <PermissionGroups style={{ marginTop: 20 }}>
                  {groups.map(group => (
                    <PermissionGroup key={group.name}>
                      <legend>{group.name}</legend>
                      {group.items.map(item => {
                        const locked = fromRole.includes(item.key);

                        return (
                          <label
                            key={item.key}
                            htmlFor={`permission-${item.key}`}
                            title={locked ? `Vem do perfil ${role?.name}` : ''}
                          >
                            <input
                              id={`permission-${item.key}`}
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

                <CardActions>
                  <UIButton
                    type="button"
                    disabled={!accessChanged || isYou || !!busy}
                    onClick={() => save('access')}
                  >
                    <FiCheck />
                    {busy === 'access' ? 'Salvando...' : 'Salvar acesso'}
                  </UIButton>
                </CardActions>
              </CardBody>
            </Card>
          </>
        )}
      </Page>
    </AppLayout>
  );
};

export default UserPage;
