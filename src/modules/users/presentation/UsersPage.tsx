import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useGetUsers, useCreateUser, useAssignRoles } from './useUsers';
import { useGetRoles } from '../../roles-permissions/presentation/useRoles';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../../shared/ui/Table';
import { Modal } from '../../../shared/ui/Modal';
import { Input } from '../../../shared/ui/Input';

const createUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().min(1, 'El correo electrónico es requerido').email('Formato de correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  roles: z.array(z.string()),
});

const assignRolesSchema = z.object({
  roleIds: z.array(z.string()).min(1, 'Selecciona al menos un rol'),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type AssignRolesFormData = z.infer<typeof assignRolesSchema>;

export const UsersPage: React.FC = () => {
  const { data: users = [], isLoading: isUsersLoading } = useGetUsers();
  const { data: roles = [] } = useGetRoles();

  const createUserMutation = useCreateUser();
  const assignRolesMutation = useAssignRoles();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRolesOpen, setIsRolesOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Forms setup
  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', password: '', roles: [] },
  });

  const rolesForm = useForm<AssignRolesFormData>({
    resolver: zodResolver(assignRolesSchema),
    defaultValues: { roleIds: [] },
  });

  // Submit handlers
  const onCreateSubmit = async (data: CreateUserFormData) => {
    try {
      await createUserMutation.mutateAsync(data);
      createForm.reset();
      setIsCreateOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al registrar el usuario');
    }
  };

  const onRolesSubmit = async (data: AssignRolesFormData) => {
    try {
      if (!selectedUser) return;
      await assignRolesMutation.mutateAsync({
        id: selectedUser.id,
        payload: data,
      });
      setSelectedUser(null);
      setIsRolesOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar los roles');
    }
  };

  // Helper toggle roles
  const handleRoleToggle = (
    form: any,
    fieldName: string,
    roleId: string,
    checked: boolean
  ) => {
    const current = (form.getValues(fieldName) || []) as string[];
    if (checked) {
      form.setValue(fieldName, [...current, roleId], { shouldValidate: true });
    } else {
      form.setValue(
        fieldName,
        current.filter((id) => id !== roleId),
        { shouldValidate: true }
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Gestión de Usuarios</h1>
          <p className="text-sm text-slate-400">Controla el acceso y asigna roles a los miembros del equipo</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Nuevo Usuario</Button>
      </div>

      {/* Users Table */}
      {isUsersLoading ? (
        <div className="text-slate-400 text-sm">Cargando usuarios...</div>
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Nombre</Th>
              <Th>Correo Electrónico</Th>
              <Th>Estado</Th>
              <Th>Roles</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.length === 0 ? (
              <Tr>
                <Td colSpan={5} className="text-center text-slate-500 py-8">
                  No hay usuarios registrados en el sistema.
                </Td>
              </Tr>
            ) : (
              users.map((user) => (
                <Tr key={user.id}>
                  <Td className="font-bold text-slate-200">{user.name}</Td>
                  <Td>{user.email}</Td>
                  <Td>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        user.isActive
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                          : 'bg-rose-950/40 text-rose-400 border border-rose-900/30'
                      }`}
                    >
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {user.roles.length === 0 ? (
                        <span className="text-xs text-slate-500">Sin roles</span>
                      ) : (
                        user.roles.map((role) => (
                          <span
                            key={role.id}
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/30 text-indigo-300 border border-indigo-900/30"
                          >
                            {role.name}
                          </span>
                        ))
                      )}
                    </div>
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(user);
                        rolesForm.reset({
                          roleIds: user.roles.map((r) => r.id),
                        });
                        setIsRolesOpen(true);
                      }}
                    >
                      Editar Roles
                    </Button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      )}

      {/* 1. Registrar Nuevo Usuario Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Registrar Nuevo Usuario">
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="flex flex-col gap-4">
          <Input
            label="Nombre Completo"
            placeholder="Ej. Roberto Gómez"
            error={createForm.formState.errors.name?.message}
            {...createForm.register('name')}
          />

          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="roberto@agroptima.com"
            error={createForm.formState.errors.email?.message}
            {...createForm.register('email')}
          />

          <Input
            label="Contraseña Temporal"
            type="password"
            placeholder="••••••••"
            error={createForm.formState.errors.password?.message}
            {...createForm.register('password')}
          />

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Asignar Roles Iniciales
            </label>
            <div className="flex flex-wrap gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
              {roles.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`role-create-${r.id}`}
                    onChange={(e) => handleRoleToggle(createForm, 'roles', r.id, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label
                    htmlFor={`role-create-${r.id}`}
                    className="text-xs text-slate-300 font-bold cursor-pointer"
                  >
                    {r.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createUserMutation.isPending}>
              Registrar Usuario
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Editar / Asignar Roles Modal */}
      <Modal isOpen={isRolesOpen} onClose={() => setIsRolesOpen(false)} title="Gestionar Roles del Usuario">
        {selectedUser && (
          <form onSubmit={rolesForm.handleSubmit(onRolesSubmit)} className="flex flex-col gap-4">
            <Card className="p-4 bg-slate-950/40 border border-slate-800/80 flex flex-col gap-1 text-sm">
              <div>
                <span className="text-slate-400">Usuario:</span>{' '}
                <span className="font-bold text-slate-200">{selectedUser.name}</span>
              </div>
              <div>
                <span className="text-slate-400">Correo:</span>{' '}
                <span className="text-slate-200">{selectedUser.email}</span>
              </div>
            </Card>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                Selecciona Roles
              </label>
              {rolesForm.formState.errors.roleIds && (
                <span className="text-xs text-rose-500 font-medium">
                  {rolesForm.formState.errors.roleIds.message}
                </span>
              )}
              <div className="flex flex-wrap gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                {roles.map((r) => {
                  const isChecked = rolesForm.watch('roleIds')?.includes(r.id) || false;
                  return (
                    <div key={r.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`role-edit-${r.id}`}
                        checked={isChecked}
                        onChange={(e) => handleRoleToggle(rolesForm, 'roleIds', r.id, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <label
                        htmlFor={`role-edit-${r.id}`}
                        className="text-xs text-slate-300 font-bold cursor-pointer"
                      >
                        {r.name}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsRolesOpen(false);
                  setSelectedUser(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" isLoading={assignRolesMutation.isPending}>
                Guardar Roles
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
