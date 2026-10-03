import { Permission } from '../../hooks/Auth';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  active: boolean;
  is_barber: boolean;
  role: { id: string; name: string; is_admin: boolean } | null;
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
