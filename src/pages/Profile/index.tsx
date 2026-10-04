import React, { useCallback, useRef, useState, ChangeEvent } from 'react';
import { FiCamera, FiCheck } from 'react-icons/fi';
import { FormHandles } from '@unform/core';
import { Form } from '@unform/web';
import * as Yup from 'yup';
import api from '../../services/api';

import { useToast } from '../../hooks/Toast';

import getValidationErrors from '../../utils/getValidationErros';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import avatarFallback from '../../utils/avatarFallback';

import AppLayout from '../../components/AppLayout';
import FormField from '../../components/FormField';
import {
  Page,
  PageHeader,
  Card,
  CardBody,
  CardFooter,
  FieldGrid,
  UIButton,
} from '../../components/ui';

import { Columns, AvatarCard, SectionTitle } from './styles';
import { useAuth } from '../../hooks/Auth';
import ProfileExtraFields from '../../components/ProfileExtraFields';
import {
  ExtraValues,
  extraPayload,
  toAddress,
  useProfileFields,
} from '../../utils/profileFields';

interface ProfileFormData {
  name: string;
  email: string;
  old_password: string;
  password: string;
  password_confirmation: string;
}

const Profile: React.FC = () => {
  const formRef = useRef<FormHandles>(null);
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { user, updateUser } = useAuth();

  // Telefone, CPF, nascimento e endereço: aparecem conforme as regras da
  // barbearia para a equipe
  const staffRules = useProfileFields('staff');
  const [extras, setExtras] = useState<ExtraValues>(() => ({
    phone: user.phone || '',
    cpf: user.cpf || '',
    birth_date: user.birth_date?.slice(0, 10) || '',
    address: toAddress(user.address),
  }));
  const hasExtras =
    !!staffRules && Object.values(staffRules).some(rule => rule?.show);

  const handleSubmit = useCallback(
    async (data: ProfileFormData) => {
      try {
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          name: Yup.string().required('Nome obrigatório'),
          email: Yup.string()
            .required('E-mail obrigatório')
            .email('Digite um e-mail válido'),
          old_password: Yup.string(),
          password: Yup.string().when('old_password', {
            is: (val: string) => !!val.length,
            then: Yup.string().required('Campo obrigatório'),
            otherwise: Yup.string(),
          }),
          password_confirmation: Yup.string()
            .when('old_password', {
              is: (val: string) => !!val.length,
              then: Yup.string().required('Campo obrigatório'),
              otherwise: Yup.string(),
            })
            .oneOf([Yup.ref('password'), null], 'Confirmação incorreta'),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        const { name, email, old_password, password, password_confirmation } =
          data;

        const formData = {
          name,
          email,
          ...extraPayload(staffRules, extras),
          ...(old_password
            ? {
                old_password,
                password,
                password_confirmation,
              }
            : {}),
        };

        setSaving(true);

        const response = await api.put('/profile', formData);

        updateUser(response.data);

        // Continua na tela, com os campos de senha limpos
        formRef.current?.setData({
          name: response.data.name,
          email: response.data.email,
          old_password: '',
          password: '',
          password_confirmation: '',
        });

        addToast({
          type: 'success',
          title: 'Perfil atualizado!',
          description: 'Suas informações foram atualizadas com sucesso!',
        });
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);

          return;
        }
        addToast({
          type: 'error',
          title: 'Erro na atualização',
          description: getApiErrorMessage(
            err,
            'Ocorreu um erro ao tentar atualizar o perfil, tente novamente!',
          ),
        });
      } finally {
        setSaving(false);
      }
    },
    [addToast, updateUser, staffRules, extras],
  );

  const handleAvatarChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      // O React 16 recicla o evento depois do await; guarda o campo antes
      const input = e.target;
      const file = input.files?.[0];

      // Nenhum arquivo quando a janela de seleção é cancelada
      if (!file) return;

      const data = new FormData();
      data.append('avatar', file);

      setUploading(true);

      try {
        const response = await api.patch('/users/avatar', data);

        updateUser(response.data);

        addToast({
          type: 'success',
          title: 'Foto atualizada!',
        });
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Erro ao enviar a foto',
          description: getApiErrorMessage(
            err,
            'Não foi possível enviar a foto, tente novamente.',
          ),
        });
      } finally {
        // Permite escolher o mesmo arquivo de novo depois de um erro
        input.value = '';
        setUploading(false);
      }
    },
    [addToast, updateUser],
  );

  return (
    <AppLayout>
      <Page narrow>
        <PageHeader>
          <div>
            <h1>Meu perfil</h1>
            <p>Seus dados, o acesso e a foto que aparece na agenda.</p>
          </div>
        </PageHeader>

        <Columns>
          <Card>
            <AvatarCard>
              <img
                src={user.avatar_url || avatarFallback(user.name)}
                alt={user.name}
                onError={e => {
                  e.currentTarget.src = avatarFallback(user.name);
                }}
              />
              <strong>{user.name}</strong>
              <small>{user.email}</small>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              <UIButton
                type="button"
                variant="secondary"
                size="sm"
                style={{ marginTop: 20 }}
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <FiCamera />
                {uploading ? 'Enviando...' : 'Alterar foto'}
              </UIButton>
            </AvatarCard>
          </Card>

          <Card>
            <Form
              ref={formRef}
              initialData={{
                name: user.name,
                email: user.email,
              }}
              onSubmit={handleSubmit}
            >
              <CardBody>
                <SectionTitle>Dados pessoais</SectionTitle>
                <FieldGrid>
                  <FormField name="name" label="Nome" />
                  <FormField name="email" type="email" label="E-mail" />
                </FieldGrid>

                {hasExtras && (
                  <div>
                    <ProfileExtraFields
                      rules={staffRules}
                      values={extras}
                      onChange={setExtras}
                    />
                  </div>
                )}

                <SectionTitle>Alterar senha</SectionTitle>
                <FormField
                  name="old_password"
                  type="password"
                  label="Senha atual"
                  hint="Deixe em branco para manter a senha."
                  autoComplete="current-password"
                />
                <FieldGrid>
                  <FormField
                    name="password"
                    type="password"
                    label="Nova senha"
                    autoComplete="new-password"
                  />
                  <FormField
                    name="password_confirmation"
                    type="password"
                    label="Confirmar nova senha"
                    autoComplete="new-password"
                  />
                </FieldGrid>
              </CardBody>

              <CardFooter>
                <UIButton type="submit" disabled={saving}>
                  <FiCheck />
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </UIButton>
              </CardFooter>
            </Form>
          </Card>
        </Columns>
      </Page>
    </AppLayout>
  );
};

export default Profile;
