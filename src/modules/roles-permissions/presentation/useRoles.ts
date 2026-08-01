import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../shared/services/api';
import type { RoleDetail, Permission, CreateRolePayload, UpdateRolePayload } from '../domain/roles.types';

export function useGetRoles() {
  return useQuery<RoleDetail[]>({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles'),
  });
}

export function useGetPermissions() {
  return useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: () => api.get('/roles/permissions'),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => 
      api.post('/roles', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRolePayload }) => 
      api.put(`/roles/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
