import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Redirect, useLocation } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheck,
  FiClock,
  FiImage,
  FiScissors,
  FiSlash,
  FiTrash2,
  FiUpload,
  FiUsers,
} from 'react-icons/fi';

import api from '../../services/api';
import { colors } from '../../styles/theme';
import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import { Branding, colorVariables, useBranding } from '../../hooks/Branding';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

import AppLayout from '../../components/AppLayout';
import SiteSettings from './SiteSettings';
import TerminalSettings from './TerminalSettings';
import WhatsAppSettings from './WhatsAppSettings';
import ProfileFieldsSettings from './ProfileFieldsSettings';
import {
  Page,
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  UIButton,
  TextInput,
  Badge,
} from '../../components/ui';
import {
  SectionTabs,
  SectionTab,
  SubTabs,
  SubTab,
  SectionColumn,
  Layout,
  Field,
  NameInput,
  Swatches,
  Swatch,
  CustomColor,
  LogoRow,
  LogoBox,
  LogoActions,
  SaveError,
  Preview,
  PreviewSidebar,
  PreviewButtons,
  PreviewIcon,
  Links,
  FieldLabel,
} from './styles';

// Sugestões de cor (a primeira é o laranja original)
const PALETTE = [
  { value: '#ff9000', label: 'Laranja' },
  { value: '#e03131', label: 'Vermelho' },
  { value: '#d6336c', label: 'Rosa' },
  { value: '#7048e8', label: 'Roxo' },
  { value: '#1c7ed6', label: 'Azul' },
  { value: '#1098ad', label: 'Ciano' },
  { value: '#2f9e44', label: 'Verde' },
  { value: '#e0a800', label: 'Dourado' },
];

const HEX = /^#[0-9a-f]{6}$/i;

// Configurações da barbearia (admin): nome, cor e logo, com prévia antes
// de salvar, e atalhos para as outras configurações
// Abas das configurações; a chave é o fim do endereço
const SECTIONS = [
  { key: '', label: 'Barbearia' },
  { key: 'site', label: 'Site' },
  { key: 'cadastros', label: 'Cadastros' },
  { key: 'integracoes', label: 'Integrações' },
];

// Subabas de Integrações
const INTEGRATIONS = [
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'maquininha', label: 'Maquininha' },
];

const Settings: React.FC = () => {
  const { can } = useAuth();
  const { addToast } = useToast();
  const { branding, setBranding } = useBranding();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(branding.name);
  const [color, setColor] = useState(branding.primary_color);
  const [hexText, setHexText] = useState(branding.primary_color);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Enquanto não houver edição, o formulário acompanha a identidade salva
  // (ela chega da API depois que a tela abre)
  const editedRef = useRef(false);

  useEffect(() => {
    if (editedRef.current) return;

    setName(branding.name);
    setColor(branding.primary_color);
    setHexText(branding.primary_color);
  }, [branding]);

  const chooseColor = useCallback((value: string) => {
    editedRef.current = true;
    setColor(value.toLowerCase());
    setHexText(value.toLowerCase());
    setError('');
  }, []);

  const changed =
    name.trim() !== branding.name || color !== branding.primary_color;

  const handleSave = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (name.trim().length < 2) {
        setError('O nome deve ter pelo menos 2 caracteres.');
        return;
      }

      setSaving(true);

      try {
        const response = await api.put<Branding>('/settings/branding', {
          name: name.trim(),
          primary_color: color,
        });

        editedRef.current = false;
        setBranding(response.data);
        setName(response.data.name);
        addToast({
          type: 'success',
          title: 'Configurações salvas',
          description: 'O nome e a cor já valem para todo o sistema.',
        });
      } catch (err) {
        setError(getApiErrorMessage(err, 'Não foi possível salvar.'));
      } finally {
        setSaving(false);
      }
    },
    [name, color, setBranding, addToast],
  );

  const handleLogo = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const file = input.files?.[0];

      // Permite escolher o mesmo arquivo de novo depois
      Object.assign(input, { value: '' });

      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        addToast({
          type: 'error',
          title: 'Imagem muito grande',
          description: 'O logo pode ter no máximo 2 MB.',
        });
        return;
      }

      const data = new FormData();
      data.append('logo', file);

      setUploading(true);

      try {
        const response = await api.patch<Branding>(
          '/settings/branding/logo',
          data,
        );

        setBranding(response.data);
        addToast({
          type: 'success',
          title: 'Logo atualizado',
          description: 'Aparece no menu, nas telas de entrada e na aba.',
        });
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Não foi possível enviar o logo',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      } finally {
        setUploading(false);
      }
    },
    [setBranding, addToast],
  );

  const removeLogo = useCallback(async () => {
    setUploading(true);

    try {
      const response = await api.delete<Branding>('/settings/branding/logo');

      setBranding(response.data);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível remover o logo',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setUploading(false);
    }
  }, [setBranding, addToast]);

  const location = useLocation();
  // /admin/configuracoes/<aba>
  const section = location.pathname.split('/')[3] || '';
  // Integrações: /integracoes/whatsapp ou /integracoes/maquininha
  const integration = location.pathname.split('/')[4] || 'whatsapp';

  if (!can('settings')) {
    return <Redirect to="/dashboard" />;
  }

  if (!SECTIONS.some(item => item.key === section)) {
    return <Redirect to="/admin/configuracoes" />;
  }

  if (
    section === 'integracoes' &&
    !INTEGRATIONS.some(item => item.key === integration)
  ) {
    return <Redirect to="/admin/configuracoes/integracoes" />;
  }

  const previewName = name.trim() || branding.name;

  return (
    <AppLayout>
      <Page>
        <PageHeader>
          <div>
            <h1>Configurações</h1>
            <p>A identidade da barbearia e as regras do sistema.</p>
          </div>
        </PageHeader>

        <SectionTabs aria-label="Seções das configurações">
          {SECTIONS.map(item => (
            <SectionTab
              key={item.key}
              to={`/admin/configuracoes${item.key ? `/${item.key}` : ''}`}
              isActive={() => section === item.key}
            >
              {item.label}
            </SectionTab>
          ))}
        </SectionTabs>

        {section === 'site' && (
          <SectionColumn>
            <SiteSettings />
          </SectionColumn>
        )}

        {section === 'cadastros' && (
          <SectionColumn>
            <ProfileFieldsSettings />
          </SectionColumn>
        )}

        {section === 'integracoes' && (
          <SectionColumn>
            <div>
              <SubTabs aria-label="Integrações">
                {INTEGRATIONS.map(item => (
                  <SubTab
                    key={item.key}
                    to={`/admin/configuracoes/integracoes/${item.key}`}
                    isActive={() => integration === item.key}
                  >
                    {item.label}
                  </SubTab>
                ))}
              </SubTabs>
              {integration === 'whatsapp' && <WhatsAppSettings />}
              {integration === 'maquininha' && <TerminalSettings />}
            </div>
          </SectionColumn>
        )}

        {section === '' && (
          <Layout>
            <div>
              <Card as="form" onSubmit={handleSave}>
                <CardHeader>
                  <div>
                    <h2>Identidade da barbearia</h2>
                    <p>
                      Vale para o painel, o site de agendamento e os e-mails aos
                      clientes.
                    </p>
                  </div>
                </CardHeader>
                <CardBody>
                  <Field>
                    <FieldLabel htmlFor="shop-name">
                      Nome da barbearia
                    </FieldLabel>
                    <NameInput>
                      <TextInput
                        id="shop-name"
                        value={name}
                        maxLength={40}
                        placeholder="Ex: Barbearia do Zé"
                        onChange={event => {
                          editedRef.current = true;
                          setName(event.target.value);
                          setError('');
                        }}
                      />
                    </NameInput>
                    <small>
                      Aparece no menu, nas telas de entrada, na aba do navegador
                      e na assinatura dos e-mails.
                    </small>
                  </Field>

                  <Field>
                    <span>Cor principal</span>
                    <Swatches role="radiogroup" aria-label="Cor principal">
                      {PALETTE.map(option => (
                        <Swatch
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={color === option.value}
                          aria-label={option.label}
                          title={option.label}
                          color={option.value}
                          selected={color === option.value}
                          onClick={() => chooseColor(option.value)}
                        />
                      ))}
                      <CustomColor>
                        <input
                          type="color"
                          aria-label="Escolher outra cor"
                          title="Escolher outra cor"
                          value={color}
                          onChange={event => chooseColor(event.target.value)}
                        />
                        <TextInput
                          type="text"
                          aria-label="Código da cor"
                          value={hexText}
                          maxLength={7}
                          onChange={event => {
                            const value = event.target.value.trim();

                            setHexText(value);
                            if (HEX.test(value)) chooseColor(value);
                          }}
                        />
                      </CustomColor>
                    </Swatches>
                    <small>
                      Botões, destaques e o menu. O texto sobre a cor fica
                      escuro ou branco automaticamente, para ser legível.
                    </small>
                  </Field>

                  <Field>
                    <span>Logo</span>
                    <LogoRow>
                      <LogoBox>
                        {branding.logo_url ? (
                          <img src={branding.logo_url} alt="Logo atual" />
                        ) : (
                          <FiImage size={28} color={colors.textSubtle} />
                        )}
                      </LogoBox>
                      <LogoActions>
                        <div>
                          <UIButton
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={uploading}
                            onClick={() => fileRef.current?.click()}
                          >
                            <FiUpload />
                            {uploading ? 'Enviando...' : 'Enviar imagem'}
                          </UIButton>
                          {branding.logo_url && (
                            <UIButton
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={uploading}
                              onClick={removeLogo}
                            >
                              <FiTrash2 />
                              Remover
                            </UIButton>
                          )}
                        </div>
                        <small>
                          PNG, JPG, WEBP ou SVG, até 2 MB. De preferência
                          quadrada e com fundo transparente. Sem logo, aparece a
                          tesoura.
                        </small>
                      </LogoActions>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        hidden
                        onChange={handleLogo}
                      />
                    </LogoRow>
                  </Field>

                  <SaveError role="alert">{error}</SaveError>
                </CardBody>
                <CardFooter>
                  {changed && (
                    <Badge tone="primary">Alterações não salvas</Badge>
                  )}
                  <UIButton
                    type="button"
                    variant="ghost"
                    disabled={!changed || saving}
                    onClick={() => {
                      setName(branding.name);
                      chooseColor(branding.primary_color);
                      editedRef.current = false;
                    }}
                  >
                    Desfazer
                  </UIButton>
                  <UIButton type="submit" disabled={!changed || saving}>
                    <FiCheck />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </UIButton>
                </CardFooter>
              </Card>
            </div>

            <div>
              <Card
                style={
                  {
                    ...colorVariables(color),
                    marginBottom: 24,
                  } as React.CSSProperties
                }
              >
                <CardHeader>
                  <h2>Prévia</h2>
                </CardHeader>
                <Preview>
                  <p>Menu</p>
                  <PreviewSidebar>
                    <header>
                      {branding.logo_url ? (
                        <img
                          src={branding.logo_url}
                          alt=""
                          style={{
                            height: 30,
                            maxWidth: 60,
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <PreviewIcon>
                          <FiScissors />
                        </PreviewIcon>
                      )}
                      <strong>{previewName}</strong>
                    </header>
                    <nav>
                      <span className="active">
                        <FiCalendar />
                        Agenda
                      </span>
                      <span>
                        <FiUsers />
                        Clientes
                      </span>
                    </nav>
                  </PreviewSidebar>

                  <PreviewButtons>
                    <UIButton type="button" size="sm" tabIndex={-1}>
                      <FiCheck />
                      Confirmar agendamento
                    </UIButton>
                    <Badge tone="primary">Agendado</Badge>
                  </PreviewButtons>
                </Preview>
              </Card>

              <Card>
                <CardHeader>
                  <h2>Outras configurações</h2>
                </CardHeader>
                <Links>
                  <li>
                    <Link to="/admin/servicos">
                      <FiClock />
                      <span>
                        Serviços e intervalo entre atendimentos
                        <small>
                          Preços, duração e o tempo livre entre clientes
                        </small>
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/clientes">
                      <FiAlertTriangle />
                      <span>
                        Política de faltas
                        <small>Alerta e bloqueio do site para quem falta</small>
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin/barbeiros">
                      <FiUsers />
                      <span>
                        Barbeiros e horários
                        <small>Equipe, expediente e quem é administrador</small>
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin/motivos-bloqueio">
                      <FiSlash />
                      <span>
                        Motivos de bloqueio
                        <small>Opções ao bloquear um horário na agenda</small>
                      </span>
                    </Link>
                  </li>
                </Links>
              </Card>
            </div>
          </Layout>
        )}
      </Page>
    </AppLayout>
  );
};

export default Settings;
