import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiSave } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import {
  FIELD_NAMES,
  ProfileContext,
  ProfileField,
  ProfileFieldRules,
  loadProfileFields,
} from '../../utils/profileFields';
import { colors } from '../../styles/theme';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  UIButton,
} from '../../components/ui';

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th,
  td {
    padding: 8px 6px;
    border-bottom: 1px solid ${colors.border};
    text-align: center;
  }

  th:first-child,
  td:first-child {
    text-align: left;
  }

  thead th {
    color: ${colors.textSubtle};
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  thead tr:last-child th {
    font-size: 11px;
    text-transform: none;
    letter-spacing: 0;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  input {
    accent-color: ${colors.primary};
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .fixed {
    color: ${colors.textSubtle};
    font-size: 12px;
  }
`;

const Note = styled.p`
  margin-bottom: 12px;
  color: ${colors.textMuted};
  font-size: 13px;
  line-height: 1.5;
`;

const ROWS: ProfileField[] = ['email', 'phone', 'cpf', 'birth_date', 'address'];

const COLUMNS: Array<{ context: ProfileContext; title: string }> = [
  { context: 'client_site', title: 'Cliente no site' },
  { context: 'client_counter', title: 'Cliente na barbearia' },
  { context: 'staff', title: 'Equipe' },
];

// O que não se escolhe: e-mail do site (é o login) e telefone do cliente
// (lembretes e WhatsApp)
const FIXED: Partial<
  Record<ProfileContext, Partial<Record<ProfileField, string>>>
> = {
  client_site: { email: 'Sempre (login)', phone: 'Sempre' },
  client_counter: { phone: 'Sempre' },
  staff: { email: 'Sempre (login)' },
};

// Quais campos aparecem em cada cadastro e quais são obrigatórios
const ProfileFieldsSettings: React.FC = () => {
  const { addToast } = useToast();
  const [rules, setRules] = useState<ProfileFieldRules | null>(null);
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfileFields(true)
      .then(data => {
        setRules(data);
        setSaved(JSON.stringify(data));
      })
      .catch(() => undefined);
  }, []);

  const toggle = (
    context: ProfileContext,
    field: ProfileField,
    key: 'show' | 'required',
  ): void => {
    setRules(current => {
      if (!current) return current;

      const rule = current[context][field] || { show: false, required: false };
      const next = { ...rule, [key]: !rule[key] };

      // Obrigatório só o que aparece; marcar obrigatório já mostra
      if (key === 'show' && !next.show) next.required = false;
      if (key === 'required' && next.required) next.show = true;

      return { ...current, [context]: { ...current[context], [field]: next } };
    });
  };

  const save = async (): Promise<void> => {
    if (!rules) return;

    setSaving(true);

    try {
      const response = await api.put<ProfileFieldRules>(
        '/settings/profile-fields',
        rules,
      );

      setRules(response.data);
      setSaved(JSON.stringify(response.data));
      // Os cadastros abertos daqui em diante já usam as novas regras
      loadProfileFields(true).catch(() => undefined);
      addToast({ type: 'success', title: 'Campos do cadastro salvos' });
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
    <Card>
      <CardHeader>
        <h2>Campos do cadastro</h2>
      </CardHeader>
      <CardBody>
        <Note>
          Escolha o que pedir no cadastro de clientes e da equipe. O cliente que
          se cadastra pelo site pode ter menos exigências; a barbearia completa
          o resto no balcão.
        </Note>
        <Table>
          <thead>
            <tr>
              <th rowSpan={2}>Campo</th>
              {COLUMNS.map(column => (
                <th key={column.context} colSpan={2}>
                  {column.title}
                </th>
              ))}
            </tr>
            <tr>
              {COLUMNS.map(column => (
                <React.Fragment key={column.context}>
                  <th>Mostrar</th>
                  <th>Obrigatório</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(field => (
              <tr key={field}>
                <td>{FIELD_NAMES[field]}</td>
                {COLUMNS.map(({ context }) => {
                  const fixed = FIXED[context]?.[field];
                  const rule = rules?.[context][field];

                  if (fixed) {
                    return (
                      <td key={context} colSpan={2} className="fixed">
                        {fixed}
                      </td>
                    );
                  }

                  if (!rule) {
                    return (
                      <td key={context} colSpan={2} className="fixed">
                        –
                      </td>
                    );
                  }

                  return (
                    <React.Fragment key={context}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Mostrar ${FIELD_NAMES[field]}`}
                          checked={rule.show}
                          onChange={() => toggle(context, field, 'show')}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`${FIELD_NAMES[field]} obrigatório`}
                          checked={rule.required}
                          onChange={() => toggle(context, field, 'required')}
                        />
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </CardBody>
      <CardFooter>
        <UIButton
          type="button"
          disabled={!rules || saving || JSON.stringify(rules) === saved}
          onClick={save}
        >
          <FiSave />
          {saving ? 'Salvando...' : 'Salvar campos'}
        </UIButton>
      </CardFooter>
    </Card>
  );
};

export default ProfileFieldsSettings;
