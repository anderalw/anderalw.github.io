import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  FiCheck,
  FiExternalLink,
  FiImage,
  FiTrash2,
  FiUpload,
} from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { maskPhone } from '../../utils/phone';
import { colors, radius } from '../../styles/theme';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  UIButton,
  TextInput,
  Badge,
} from '../../components/ui';
import defaultCover from '../../assets/sign-in-background.png';
import { Field, FieldLabel, LogoActions, SaveError } from './styles';
import { useVocabulary, useSegmentExamples } from '../../hooks/Vocabulary';

interface SiteContent {
  tagline: string;
  about: string;
  address: string;
  whatsapp: string;
  instagram: string;
  cover_url: string | null;
}

type Form = Omit<SiteContent, 'cover_url'>;

const EMPTY: Form = {
  tagline: '',
  about: '',
  address: '',
  whatsapp: '',
  instagram: '',
};

const TwoColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }

  /* Lado a lado: sem o espaço de campos empilhados (o && vence a regra
     do Field) */
  && > div + div {
    margin-top: 0;
  }
`;

const TextArea = styled.textarea`
  display: block;
  width: 100%;
  height: 120px;
  padding: 10px 12px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.sunken};
  color: ${colors.text};
  font: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: none;

  &::placeholder {
    color: ${colors.textSubtle};
  }

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px ${colors.primarySoft};
  }
`;

const CoverRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const CoverBox = styled.div<{ image: string }>`
  width: 176px;
  height: 99px;
  flex-shrink: 0;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: #16151a url(${props => props.image}) center / cover no-repeat;
`;

const Counter = styled.small`
  float: right;
  margin-top: 6px;
  font-size: 12px;
  color: ${colors.textSubtle};
`;

// Conteúdo da página inicial (o site da barbearia): frase da capa, texto
// "sobre", contatos e a foto da capa
const SiteSettings: React.FC = () => {
  const examples = useSegmentExamples();
  const terms = useVocabulary();
  const { addToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [saved, setSaved] = useState<SiteContent | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fill = useCallback((content: SiteContent) => {
    setSaved(content);
    setForm({
      tagline: content.tagline,
      about: content.about,
      address: content.address,
      whatsapp: content.whatsapp ? maskPhone(content.whatsapp) : '',
      instagram: content.instagram ? `@${content.instagram}` : '',
    });
  }, []);

  useEffect(() => {
    api
      .get<SiteContent>('/site')
      .then(response => fill(response.data))
      .catch(() => setError('Não foi possível carregar o conteúdo da página.'));
  }, [fill]);

  const change =
    (key: keyof Form) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ): void => {
      const { value } = event.target;

      setForm(current => ({
        ...current,
        [key]: key === 'whatsapp' ? maskPhone(value) : value,
      }));
      setError('');
    };

  const changed =
    !!saved &&
    (form.tagline.trim() !== saved.tagline ||
      form.about.trim() !== saved.about ||
      form.address.trim() !== saved.address ||
      form.whatsapp.replace(/\D/g, '') !== saved.whatsapp ||
      form.instagram.replace(/^@/, '').trim() !== saved.instagram);

  const handleSave = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setSaving(true);

      try {
        const response = await api.put<SiteContent>('/site', form);

        fill(response.data);
        addToast({
          type: 'success',
          title: 'Página atualizada',
          description: 'As mudanças já aparecem na página inicial.',
        });
      } catch (err) {
        setError(getApiErrorMessage(err, 'Não foi possível salvar.'));
      } finally {
        setSaving(false);
      }
    },
    [form, fill, addToast],
  );

  const handleCover = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const file = input.files?.[0];

      Object.assign(input, { value: '' });

      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        addToast({
          type: 'error',
          title: 'Imagem muito grande',
          description: 'A foto da capa pode ter no máximo 5 MB.',
        });
        return;
      }

      const data = new FormData();
      data.append('cover', file);

      setUploading(true);

      try {
        const response = await api.patch<SiteContent>('/site/cover', data);

        setSaved(current =>
          current
            ? { ...current, cover_url: response.data.cover_url }
            : current,
        );
        addToast({ type: 'success', title: 'Foto da capa atualizada' });
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Não foi possível enviar a foto',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      } finally {
        setUploading(false);
      }
    },
    [addToast],
  );

  const removeCover = useCallback(async () => {
    setUploading(true);

    try {
      const response = await api.delete<SiteContent>('/site/cover');

      setSaved(current =>
        current ? { ...current, cover_url: response.data.cover_url } : current,
      );
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível remover a foto',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setUploading(false);
    }
  }, [addToast]);

  return (
    <Card as="form" onSubmit={handleSave}>
      <CardHeader>
        <div>
          <h2>{`Página ${terms.ofPlace}`}</h2>
          <p>
            O site que os clientes veem ao abrir o endereço. Serviços, equipe e
            horários vêm do sistema.
          </p>
        </div>
        <UIButton
          as="a"
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
          size="sm"
          style={{ marginLeft: 'auto' }}
        >
          <FiExternalLink />
          Ver página
        </UIButton>
      </CardHeader>
      <CardBody>
        <Field>
          <span>Foto da capa</span>
          <CoverRow>
            <CoverBox image={saved?.cover_url || defaultCover} />
            <LogoActions>
              <div>
                <UIButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={uploading || !saved}
                  onClick={() => fileRef.current?.click()}
                >
                  {saved?.cover_url ? <FiUpload /> : <FiImage />}
                  {uploading ? 'Enviando...' : 'Trocar foto'}
                </UIButton>
                {saved?.cover_url && (
                  <UIButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={uploading}
                    onClick={removeCover}
                  >
                    <FiTrash2 />
                    Usar a padrão
                  </UIButton>
                )}
              </div>
              <small>
                {`Foto horizontal, de preferência ${examples.coverHint}. Até 5 MB. O texto fica sobre a parte esquerda.`}
              </small>
            </LogoActions>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={handleCover}
            />
          </CoverRow>
        </Field>

        <Field>
          <FieldLabel htmlFor="site-tagline">Frase de destaque</FieldLabel>
          <TextInput
            id="site-tagline"
            value={form.tagline}
            maxLength={120}
            placeholder="Ex: Atendimento com hora marcada, sem espera."
            onChange={change('tagline')}
          />
          <small>Aparece na capa, abaixo do nome.</small>
        </Field>

        <Field>
          <FieldLabel htmlFor="site-about">{`Sobre ${terms.thePlace}`}</FieldLabel>
          <TextArea
            id="site-about"
            value={form.about}
            maxLength={1000}
            placeholder={`Conte a história ${terms.ofPlace}, o estilo, o que faz o lugar especial... (vazio: a seção não aparece)`}
            onChange={change('about')}
          />
          <Counter>{`${form.about.length}/1000`}</Counter>
        </Field>

        <Field>
          <FieldLabel htmlFor="site-address">Endereço</FieldLabel>
          <TextInput
            id="site-address"
            value={form.address}
            maxLength={200}
            placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo - SP"
            onChange={change('address')}
          />
          <small>
            Com ele, a página mostra o link &quot;Ver no mapa&quot;.
          </small>
        </Field>

        <TwoColumns>
          <Field>
            <FieldLabel htmlFor="site-whatsapp">WhatsApp</FieldLabel>
            <TextInput
              id="site-whatsapp"
              value={form.whatsapp}
              inputMode="tel"
              placeholder="(11) 99999-0000"
              onChange={change('whatsapp')}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="site-instagram">Instagram</FieldLabel>
            <TextInput
              id="site-instagram"
              value={form.instagram}
              placeholder="@seunegocio"
              onChange={change('instagram')}
            />
          </Field>
        </TwoColumns>

        <SaveError role="alert">{error}</SaveError>
      </CardBody>
      <CardFooter>
        {changed && <Badge tone="primary">Alterações não salvas</Badge>}
        <UIButton
          type="button"
          variant="ghost"
          disabled={!changed || saving}
          onClick={() => saved && fill(saved)}
        >
          Desfazer
        </UIButton>
        <UIButton type="submit" disabled={!changed || saving}>
          <FiCheck />
          {saving ? 'Salvando...' : 'Salvar'}
        </UIButton>
      </CardFooter>
    </Card>
  );
};

export default SiteSettings;
