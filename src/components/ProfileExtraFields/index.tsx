import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

import { Label, TextInput } from '../ui';
import { colors } from '../../styles/theme';
import {
  Address,
  EMPTY_ADDRESS,
  ExtraValues,
  FieldRule,
  ProfileField,
  formatCep,
  formatCpf,
  onlyDigits,
} from '../../utils/profileFields';
import { maskPhone } from '../../utils/phone';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px 12px;

  > .span-2 {
    grid-column: span 2;
  }

  > .span-3 {
    grid-column: span 3;
  }

  > .span-4 {
    grid-column: span 4;
  }

  > .span-6 {
    grid-column: span 6;
  }

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    > .span-3,
    > .span-4,
    > .span-6 {
      grid-column: span 2;
    }
  }
`;

const Title = styled.p`
  grid-column: 1 / -1;
  margin: 4px 0 -4px;
  color: ${colors.textSubtle};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const Optional = styled.span`
  color: ${colors.textSubtle};
  font-weight: 400;
`;

interface Props {
  rules: Partial<Record<ProfileField, FieldRule>> | undefined;
  values: ExtraValues;
  onChange(values: ExtraValues): void;
}

// Texto do rótulo numa linha só (o "(opcional)" junto)
const label = (text: string, rule?: FieldRule): React.ReactNode => (
  <span>
    {text}
    {!rule?.required && <Optional> (opcional)</Optional>}
  </span>
);

// Os campos extras que a barbearia escolheu mostrar (telefone da equipe,
// CPF, nascimento e endereço). O CEP preenche o resto do endereço
const ProfileExtraFields: React.FC<Props> = ({ rules, values, onChange }) => {
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const address = values.address || EMPTY_ADDRESS;
  const cepDigits = onlyDigits(address.cep);

  const setAddress = (patch: Partial<Address>): void => {
    onChange({
      ...valuesRef.current,
      address: { ...(valuesRef.current.address || EMPTY_ADDRESS), ...patch },
    });
  };

  // CEP completo: busca rua, bairro, cidade e UF (ViaCEP)
  useEffect(() => {
    if (!rules?.address?.show || cepDigits.length !== 8) return undefined;

    const controller = new AbortController();

    fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, {
      signal: controller.signal,
    })
      .then(response => response.json())
      .then(data => {
        if (data.erro) return;

        const current = valuesRef.current.address || EMPTY_ADDRESS;

        onChange({
          ...valuesRef.current,
          address: {
            ...current,
            street: current.street || data.logradouro || '',
            district: current.district || data.bairro || '',
            city: data.localidade || current.city,
            state: data.uf || current.state,
          },
        });
      })
      .catch(() => {
        // Sem a busca, a pessoa digita o endereço
      });

    return () => controller.abort();
    // Só quando o CEP muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cepDigits, rules?.address?.show]);

  if (!rules) return null;

  const show = (field: ProfileField): boolean => !!rules[field]?.show;

  if (
    !['phone', 'cpf', 'birth_date', 'address'].some(field =>
      show(field as ProfileField),
    )
  ) {
    return null;
  }

  return (
    <Grid>
      {show('phone') && (
        <Label className="span-3">
          {label('Telefone', rules.phone)}
          <TextInput
            type="tel"
            value={maskPhone(values.phone || '')}
            maxLength={30}
            onChange={event =>
              onChange({ ...values, phone: onlyDigits(event.target.value) })
            }
          />
        </Label>
      )}
      {show('cpf') && (
        <Label className="span-3">
          {label('CPF', rules.cpf)}
          <TextInput
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={formatCpf(values.cpf || '')}
            onChange={event =>
              onChange({ ...values, cpf: onlyDigits(event.target.value) })
            }
          />
        </Label>
      )}
      {show('birth_date') && (
        <Label className="span-3">
          {label('Data de nascimento', rules.birth_date)}
          <TextInput
            type="date"
            value={values.birth_date || ''}
            max={new Date().toISOString().slice(0, 10)}
            onChange={event =>
              onChange({ ...values, birth_date: event.target.value })
            }
          />
        </Label>
      )}

      {show('address') && (
        <>
          <Title>
            Endereço
            {!rules.address?.required && <Optional> (opcional)</Optional>}
          </Title>
          <Label className="span-2">
            CEP
            <TextInput
              inputMode="numeric"
              placeholder="00000-000"
              value={address.cep}
              onChange={event =>
                setAddress({ cep: formatCep(event.target.value) })
              }
            />
          </Label>
          <Label className="span-4">
            Rua
            <TextInput
              value={address.street}
              maxLength={120}
              onChange={event => setAddress({ street: event.target.value })}
            />
          </Label>
          <Label className="span-2">
            Número
            <TextInput
              value={address.number}
              maxLength={20}
              onChange={event => setAddress({ number: event.target.value })}
            />
          </Label>
          <Label className="span-4">
            Complemento
            <TextInput
              value={address.complement}
              maxLength={80}
              onChange={event => setAddress({ complement: event.target.value })}
            />
          </Label>
          <Label className="span-3">
            Bairro
            <TextInput
              value={address.district}
              maxLength={80}
              onChange={event => setAddress({ district: event.target.value })}
            />
          </Label>
          <Label className="span-2">
            Cidade
            <TextInput
              value={address.city}
              maxLength={80}
              onChange={event => setAddress({ city: event.target.value })}
            />
          </Label>
          <Label className="span-1">
            UF
            <TextInput
              value={address.state}
              maxLength={2}
              onChange={event =>
                setAddress({ state: event.target.value.toUpperCase() })
              }
            />
          </Label>
        </>
      )}
    </Grid>
  );
};

export default ProfileExtraFields;
