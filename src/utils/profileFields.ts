import { useEffect, useState } from 'react';

import api from '../services/api';

// Campos opcionais dos cadastros: a barbearia escolhe quais aparecem e
// quais são obrigatórios (Configurações → Campos do cadastro)

export type ProfileField = 'email' | 'phone' | 'cpf' | 'birth_date' | 'address';

// Cliente no site, cliente cadastrado pela barbearia (balcão) e a equipe
export type ProfileContext = 'client_site' | 'client_counter' | 'staff';

export interface FieldRule {
  show: boolean;
  required: boolean;
}

export type ProfileFieldRules = Record<
  ProfileContext,
  Partial<Record<ProfileField, FieldRule>>
>;

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
}

export interface ExtraValues {
  phone?: string;
  cpf?: string;
  birth_date?: string;
  address?: Address | null;
}

export const EMPTY_ADDRESS: Address = {
  cep: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
};

export const FIELD_NAMES: Record<ProfileField, string> = {
  email: 'E-mail',
  phone: 'Telefone',
  cpf: 'CPF',
  birth_date: 'Data de nascimento',
  address: 'Endereço',
};

export const onlyDigits = (value: string): string => value.replace(/\D/g, '');

// 529.982.247-25
export function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

// 01310-100
export function formatCep(value: string): string {
  return onlyDigits(value)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, '$1-$2');
}

// Endereço vindo da API (campos podem ser null) para o formulário
export function toAddress(value?: Partial<Address> | null): Address | null {
  if (!value) return null;

  return {
    ...EMPTY_ADDRESS,
    ...Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, item ?? '']),
    ),
    cep: formatCep(value.cep || ''),
  };
}

// O que vai para a API: só os campos que aparecem; endereço em branco vira null
export function extraPayload(
  rules: Partial<Record<ProfileField, FieldRule>> | undefined,
  values: ExtraValues,
): ExtraValues {
  const payload: ExtraValues = {};

  if (rules?.phone?.show) payload.phone = values.phone || '';
  if (rules?.cpf?.show) payload.cpf = onlyDigits(values.cpf || '');
  if (rules?.birth_date?.show) payload.birth_date = values.birth_date || '';

  if (rules?.address?.show) {
    const { address } = values;
    const filled =
      !!address && Object.values(address).some(item => item.trim() !== '');

    payload.address =
      filled && address ? { ...address, cep: onlyDigits(address.cep) } : null;
  }

  return payload;
}

let cache: Promise<ProfileFieldRules> | null = null;

// Regras da barbearia (guardadas enquanto a página está aberta)
export function loadProfileFields(fresh = false): Promise<ProfileFieldRules> {
  if (!cache || fresh) {
    cache = api
      .get<ProfileFieldRules>('/settings/profile-fields')
      .then(response => response.data)
      .catch(error => {
        cache = null;
        throw error;
      });
  }

  return cache;
}

export function useProfileFields(
  context: ProfileContext,
): Partial<Record<ProfileField, FieldRule>> | undefined {
  const [rules, setRules] = useState<
    Partial<Record<ProfileField, FieldRule>> | undefined
  >(undefined);

  useEffect(() => {
    let active = true;

    loadProfileFields()
      .then(all => {
        if (active) setRules(all[context]);
      })
      .catch(() => {
        // Sem as regras, o formulário fica só com os campos de sempre
        if (active) setRules({});
      });

    return () => {
      active = false;
    };
  }, [context]);

  return rules;
}
