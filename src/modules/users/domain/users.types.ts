export interface UserRoleSummary {
  id: string;
  name: string;
  permissions?: string[];
}

export interface UserDetail {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  roles: UserRoleSummary[];
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string;
  roleIds?: string[]; // Array de IDs de roles
}

export interface AssignRolesPayload {
  roleIds: string[]; // Array de IDs de roles
}
