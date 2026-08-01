import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useGetRoles,
  useGetPermissions,
  useCreateRole,
  useUpdateRole,
} from './useRoles';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Modal } from '../../../shared/ui/Modal';
import { Input } from '../../../shared/ui/Input';

const roleSchema = z.object({
  name: z.string().min(1, 'El nombre del rol es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  permissionIds: z.array(z.string()).min(1, 'Debes seleccionar al menos un permiso'),
});

type RoleFormData = z.infer<typeof roleSchema>;

export const RolesPage: React.FC = () => {
  const { data: roles = [], isLoading: isRolesLoading } = useGetRoles();
  const { data: allPermissions = [] } = useGetPermissions();

  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);

  // Forms setup
  const createForm = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: '', description: '', permissionIds: [] },
  });

  const editForm = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: '', description: '', permissionIds: [] },
  });

  // Handlers
  const onCreateSubmit = async (data: RoleFormData) => {
    try {
      await createRoleMutation.mutateAsync(data);
      createForm.reset();
      setIsCreateOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al crear el rol');
    }
  };

  const onEditSubmit = async (data: RoleFormData) => {
    try {
      if (!selectedRole) return;
      await updateRoleMutation.mutateAsync({
        id: selectedRole.id,
        payload: data,
      });
      setSelectedRole(null);
      setIsEditOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el rol');
    }
  };

  // Helper para manejar checkbox toggle
  const handlePermissionToggle = (
    form: typeof createForm | typeof editForm,
    permissionId: string,
    checked: boolean
  ) => {
    const current = form.getValues('permissionIds') || [];
    if (checked) {
      form.setValue('permissionIds', [...current, permissionId], { shouldValidate: true });
    } else {
      form.setValue(
        'permissionIds',
        current.filter((id) => id !== permissionId),
        { shouldValidate: true }
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Gestión de Roles y Permisos</h1>
          <p className="text-sm text-slate-400">Administra las políticas de autorización del sistema</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Nuevo Rol</Button>
      </div>

      {/* Grid of Roles */}
      {isRolesLoading ? (
        <div className="text-slate-400 text-sm">Cargando roles...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <Card
              key={role.id}
              className="flex flex-col gap-4 border border-slate-800/80 bg-slate-900/40 relative hover:border-emerald-800/20 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-md font-bold text-slate-200">{role.name}</h2>
                  <p className="text-xs text-slate-500">{role.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedRole(role);
                    editForm.reset({
                      name: role.name,
                      description: role.description,
                      permissionIds: role.permissions.map((p) => p.id),
                    });
                    setIsEditOpen(true);
                  }}
                >
                  Editar
                </Button>
              </div>

              {/* Permissions list */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Permisos Autorizados ({role.permissions.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.length === 0 ? (
                    <span className="text-xs text-slate-600 italic">Sin permisos asociados</span>
                  ) : (
                    role.permissions.map((p) => (
                      <span
                        key={p.id}
                        className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/20 text-emerald-400 border border-emerald-900/30"
                        title={p.description}
                      >
                        {p.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 1. Crear Rol Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Crear Nuevo Rol">
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="flex flex-col gap-4">
          <Input
            label="Nombre del Rol"
            placeholder="Ej. Auditor de Inventario"
            error={createForm.formState.errors.name?.message}
            {...createForm.register('name')}
          />

          <Input
            label="Descripción"
            placeholder="Maneja consultas y registros de mermas..."
            error={createForm.formState.errors.description?.message}
            {...createForm.register('description')}
          />

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Asignar Permisos
            </label>
            {createForm.formState.errors.permissionIds && (
              <span className="text-xs text-rose-500 font-medium">
                {createForm.formState.errors.permissionIds.message}
              </span>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40 max-h-48 overflow-y-auto">
              {allPermissions.map((p) => (
                <div key={p.id} className="flex items-start gap-2.5 py-1">
                  <input
                    type="checkbox"
                    id={`perm-create-${p.id}`}
                    onChange={(e) => handlePermissionToggle(createForm, p.id, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-600 focus:ring-emerald-500 cursor-pointer mt-0.5"
                  />
                  <label
                    htmlFor={`perm-create-${p.id}`}
                    className="text-xs text-slate-300 font-medium cursor-pointer"
                  >
                    <div className="font-bold">{p.name}</div>
                    <div className="text-[10px] text-slate-500 leading-normal">{p.description}</div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createRoleMutation.isPending}>
              Crear Rol
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Editar Rol Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Rol">
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="flex flex-col gap-4">
          <Input
            label="Nombre del Rol"
            placeholder="Ej. Auditor de Inventario"
            error={editForm.formState.errors.name?.message}
            {...editForm.register('name')}
          />

          <Input
            label="Descripción"
            placeholder="Maneja consultas y registros de mermas..."
            error={editForm.formState.errors.description?.message}
            {...editForm.register('description')}
          />

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Modificar Permisos
            </label>
            {editForm.formState.errors.permissionIds && (
              <span className="text-xs text-rose-500 font-medium">
                {editForm.formState.errors.permissionIds.message}
              </span>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40 max-h-48 overflow-y-auto">
              {allPermissions.map((p) => {
                const isChecked = editForm.watch('permissionIds')?.includes(p.id) || false;
                return (
                  <div key={p.id} className="flex items-start gap-2.5 py-1">
                    <input
                      type="checkbox"
                      id={`perm-edit-${p.id}`}
                      checked={isChecked}
                      onChange={(e) => handlePermissionToggle(editForm, p.id, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-600 focus:ring-emerald-500 cursor-pointer mt-0.5"
                    />
                    <label
                      htmlFor={`perm-edit-${p.id}`}
                      className="text-xs text-slate-300 font-medium cursor-pointer"
                    >
                      <div className="font-bold">{p.name}</div>
                      <div className="text-[10px] text-slate-500 leading-normal">{p.description}</div>
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
                setIsEditOpen(false);
                setSelectedRole(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={updateRoleMutation.isPending}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
