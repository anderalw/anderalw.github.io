import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiCheck } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import { useBranding } from '../../hooks/Branding';
import { useFeatures } from '../../hooks/Vocabulary';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { colors, radius } from '../../styles/theme';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  UIButton,
} from '../../components/ui';

export const TextArea = styled.textarea<{ rows?: number }>`
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.sunken};
  color: ${colors.text};
  font: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: none;

  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }
`;

const Hint = styled.p`
  margin-top: 8px;
  font-size: 12px;
  color: ${colors.textMuted};
`;

interface ConsentTerm {
  text: string;
  version: string;
}

// Como o cliente paga o sinal (aparece no agendamento e em "Meus horários")
const DepositSettings: React.FC = () => {
  const { addToast } = useToast();
  const { branding, setBranding } = useBranding();
  const saved = branding.deposit_instructions || '';
  const [text, setText] = useState(saved);
  const [saving, setSaving] = useState(false);

  useEffect(() => setText(saved), [saved]);

  const save = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await api.put('/settings/deposit', {
        instructions: text,
      });

      setBranding({ deposit_instructions: response.data.deposit_instructions });
      addToast({ type: 'success', title: 'Orientação do sinal salva' });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível salvar',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card as="form" onSubmit={save} style={{ marginTop: 24 }}>
      <CardHeader>
        <div>
          <h2>Sinal</h2>
          <p>O valor é definido em cada serviço, em Serviços.</p>
        </div>
      </CardHeader>
      <CardBody>
        <TextArea
          aria-label="Como pagar o sinal"
          rows={3}
          style={{ height: 88 }}
          value={text}
          maxLength={500}
          placeholder="Ex: Pix para a chave estudio@email.com em até 24h. Envie o comprovante pelo WhatsApp."
          onChange={event => setText(event.target.value)}
        />
        <Hint>
          Aparece para o cliente ao agendar. Você registra o recebimento na
          agenda.
        </Hint>
      </CardBody>
      <CardFooter>
        <UIButton type="submit" disabled={saving || text.trim() === saved}>
          <FiCheck />
          {saving ? 'Salvando...' : 'Salvar'}
        </UIButton>
      </CardFooter>
    </Card>
  );
};

// Texto do termo de consentimento (começa com o modelo do ramo)
const ConsentSettings: React.FC = () => {
  const { addToast } = useToast();
  const [term, setTerm] = useState<ConsentTerm | null>(null);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<ConsentTerm>('/settings/consent')
      .then(response => {
        setTerm(response.data);
        setText(response.data.text);
      })
      .catch(() => setTerm({ text: '', version: '' }));
  }, []);

  const save = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (
      // eslint-disable-next-line no-alert
      !window.confirm(
        'Mudar o termo pede um novo aceite de todos os clientes no próximo agendamento. Salvar?',
      )
    ) {
      return;
    }

    setSaving(true);

    try {
      const response = await api.put<ConsentTerm>('/settings/consent', {
        text,
      });

      setTerm(response.data);
      setText(response.data.text);
      addToast({ type: 'success', title: 'Termo salvo' });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível salvar',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card as="form" onSubmit={save} style={{ marginTop: 24 }}>
      <CardHeader>
        <div>
          <h2>Termo de consentimento</h2>
          <p>O cliente lê e aceita antes do primeiro agendamento pelo site.</p>
        </div>
      </CardHeader>
      <CardBody>
        <TextArea
          aria-label="Texto do termo"
          style={{ height: 240 }}
          value={text}
          maxLength={5000}
          disabled={!term}
          placeholder={term ? '' : 'Carregando...'}
          onChange={event => setText(event.target.value)}
        />
        <Hint>
          É um modelo do ramo: revise com o seu responsável técnico ou jurídico.
          Em branco, volta ao modelo.
        </Hint>
      </CardBody>
      <CardFooter>
        <UIButton
          type="submit"
          disabled={!term || saving || text.trim() === term.text.trim()}
        >
          <FiCheck />
          {saving ? 'Salvando...' : 'Salvar termo'}
        </UIButton>
      </CardFooter>
    </Card>
  );
};

// Cartões dos recursos que precisam de ajuste (só quando ligados)
const ResourceSettings: React.FC = () => {
  const features = useFeatures();

  return (
    <>
      {features.deposit && <DepositSettings />}
      {features.consent && <ConsentSettings />}
    </>
  );
};

export default ResourceSettings;
