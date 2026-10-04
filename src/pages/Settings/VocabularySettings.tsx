import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { FiCheck, FiRotateCcw } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import { useBranding } from '../../hooks/Branding';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import {
  DEFAULT_VOCABULARY,
  Vocabulary,
  buildTerms,
} from '../../utils/vocabulary';
import { colors } from '../../styles/theme';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  TextInput,
  Select,
  UIButton,
  Badge,
} from '../../components/ui';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 16px;

  label > span,
  div > span {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 500;
    color: ${colors.textMuted};
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const Preview = styled.p`
  margin-top: 16px;
  font-size: 13px;
  color: ${colors.textMuted};

  strong {
    color: ${colors.text};
    font-weight: 500;
  }
`;

const FIELDS: Array<{ key: keyof Vocabulary; label: string }> = [
  { key: 'professional', label: 'Quem atende' },
  { key: 'professionals', label: 'Quem atende (plural)' },
  { key: 'client', label: 'Quem é atendido' },
  { key: 'clients', label: 'Quem é atendido (plural)' },
  { key: 'place', label: 'O negócio' },
];

// Termos das telas: o padrão vem do ramo do negócio, escolhido na criação;
// aqui dá para ajustar (ex: "Dr(a)." em vez de "Profissional")
const VocabularySettings: React.FC = () => {
  const { addToast } = useToast();
  const { branding, setBranding } = useBranding();

  const saved = branding.vocabulary || DEFAULT_VOCABULARY;
  const defaults = branding.defaults || saved;
  const [form, setForm] = useState<Vocabulary>(saved);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(saved), [saved]);

  const changed = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(saved),
    [form, saved],
  );
  const isDefault = JSON.stringify(form) === JSON.stringify(defaults);
  const terms = buildTerms(form);

  const save = useCallback(
    async (data: Vocabulary) => {
      setSaving(true);

      try {
        const response = await api.put('/settings/vocabulary', data);

        setBranding({
          vocabulary: response.data.vocabulary,
          defaults: response.data.defaults,
        });
        addToast({ type: 'success', title: 'Termos salvos' });
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Não foi possível salvar',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      } finally {
        setSaving(false);
      }
    },
    [addToast, setBranding],
  );

  return (
    <Card
      as="form"
      style={{ marginTop: 24 }}
      onSubmit={(event: React.FormEvent) => {
        event.preventDefault();
        save(form);
      }}
    >
      <CardHeader>
        <div>
          <h2>Termos usados</h2>
          <p>Como o sistema chama a equipe, quem é atendido e o negócio.</p>
        </div>
        {branding.segment_name && (
          <Badge tone="neutral">{branding.segment_name}</Badge>
        )}
      </CardHeader>
      <CardBody>
        <Grid>
          {FIELDS.map(field => (
            <label key={field.key} htmlFor={`term-${field.key}`}>
              <span>{field.label}</span>
              <TextInput
                id={`term-${field.key}`}
                value={form[field.key]}
                maxLength={40}
                placeholder={defaults[field.key]}
                onChange={event =>
                  setForm({ ...form, [field.key]: event.target.value })
                }
              />
            </label>
          ))}
          <div>
            <span id="term-gender-label">Artigo do negócio</span>
            <Select
              id="term-gender"
              aria-labelledby="term-gender-label"
              value={form.place_gender}
              onChange={event =>
                setForm({
                  ...form,
                  place_gender: event.target.value as 'f' | 'm',
                })
              }
            >
              <option value="f">{`a ${terms.place}`}</option>
              <option value="m">{`o ${terms.place}`}</option>
            </Select>
          </div>
          <div>
            <span id="term-club-label">Assinatura mensal</span>
            <TextInput
              id="term-club"
              aria-labelledby="term-club-label"
              value={form.club}
              maxLength={40}
              placeholder={defaults.club}
              onChange={event => setForm({ ...form, club: event.target.value })}
            />
          </div>
        </Grid>
        <Preview>
          {'Exemplo: '}
          <strong>{`"Escolha ${terms.theProfessional}"`}</strong>
          {', '}
          <strong>{`"Sobre ${terms.thePlace}"`}</strong>
          {', '}
          <strong>{`"${terms.Clients}"`}</strong>
          {', '}
          <strong>{`"${terms.Club} de assinatura"`}</strong>
        </Preview>
      </CardBody>
      <CardFooter>
        <UIButton
          type="button"
          variant="ghost"
          disabled={saving || isDefault}
          title="Volta aos termos do ramo do negócio"
          onClick={() => {
            setForm(defaults);
            save(defaults);
          }}
        >
          <FiRotateCcw />
          Voltar ao padrão
        </UIButton>
        <UIButton type="submit" disabled={!changed || saving}>
          <FiCheck />
          {saving ? 'Salvando...' : 'Salvar'}
        </UIButton>
      </CardFooter>
    </Card>
  );
};

export default VocabularySettings;
