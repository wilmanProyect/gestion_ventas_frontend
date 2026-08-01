export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface RoleDetail {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface CreateRolePayload {
  name: string;
  description: string;
  permissionIds: string[];
}

export interface UpdateRolePayload {
  name: string;
  description: string;
  permissionIds: string[];
}
