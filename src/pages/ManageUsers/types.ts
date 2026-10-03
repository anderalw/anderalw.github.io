import { Permission } from '../../hooks/Auth';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  active: boolean;
  is_barber: boolean;
  role: { id: string; name: string; is_admin: boolean } | null;
  // Dadas só a este usuário (somam às do perfil)
  own_permissions: Permission[];
  // Tudo o que pode
  permissions: Permission[];
  // Ainda com a senha provisória (o e-mail)
  must_change_password: boolean;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  address: import('../../utils/profileFields').Address | null;
}

export interface RoleItem {
  id: string;
  name: string;
  permissions: Permission[];
  is_admin: boolean;
  system_key: string | null;
  users: number;
}

export interface PermissionItem {
  key: Permission;
  group: string;
  label: string;
}
