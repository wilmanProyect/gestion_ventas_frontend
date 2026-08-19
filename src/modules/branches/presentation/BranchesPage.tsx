import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useGetBranches,
  useCreateBranch,
  useUpdateBranch,
  useToggleBranchStatus,
  useDeleteBranch,
} from './useBranches';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Modal } from '../../../shared/ui/Modal';
import { Input } from '../../../shared/ui/Input';
import { HasPermission } from '../../../shared/ui/HasPermission';

const branchSchema = z.object({
  name: z.string().min(1, 'El nombre de la sucursal es requerido'),
  address: z.string().min(1, 'La dirección es requerida'),
});

type BranchFormData = z.infer<typeof branchSchema>;

export const BranchesPage: React.FC = () => {
  const { data: branches = [], isLoading: isBranchesLoading } = useGetBranches();

  const createBranchMutation = useCreateBranch();
  const updateBranchMutation = useUpdateBranch();
  const toggleBranchStatusMutation = useToggleBranchStatus();
  const deleteBranchMutation = useDeleteBranch();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);

  // Warning Modal for active stock
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  // Forms setup
  const createForm = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: '', address: '' },
  });

  const editForm = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: '', address: '' },
  });

  // Handlers
  const onCreateSubmit = async (data: BranchFormData) => {
    try {
      await createBranchMutation.mutateAsync(data);
      createForm.reset();
      setIsCreateOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al crear la sucursal');
    }
  };

  const onEditSubmit = async (data: BranchFormData) => {
    try {
      if (!selectedBranch) return;
      await updateBranchMutation.mutateAsync({
        id: selectedBranch.id,
        payload: data,
      });
      setSelectedBranch(null);
      setIsEditOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar la sucursal');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean, name: string) => {
    const action = currentStatus ? 'desactivar' : 'activar';
    if (confirm(`¿Estás seguro de que deseas ${action} la sucursal "${name}"?`)) {
      try {
        await toggleBranchStatusMutation.mutateAsync({
          id,
          activate: !currentStatus,
        });
      } catch (err: any) {
        alert(err.message || `Error al ${action} la sucursal`);
      }
    }
  };

  const handleDeleteBranch = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la sucursal "${name}" de forma permanente?`)) {
      try {
        await deleteBranchMutation.mutateAsync(id);
      } catch (err: any) {
        // Capture 400 Bad Request and display custom warning modal
        if (err.message && err.message.includes('stock')) {
          setWarningMessage(err.message);
          setIsWarningOpen(true);
        } else {
          alert(err.message || 'Error al eliminar la sucursal');
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Gestión de Sucursales</h1>
          <p className="text-sm text-slate-400">Administra las sucursales del sistema y sus asociaciones</p>
        </div>
        <HasPermission permission="branches:create">
          <Button onClick={() => setIsCreateOpen(true)}>Nueva Sucursal</Button>
        </HasPermission>
      </div>

      {/* Grid of Branches */}
      {isBranchesLoading ? (
        <div className="text-slate-400 text-sm">Cargando sucursales...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.length === 0 ? (
            <Card className="col-span-full py-8 text-center text-slate-400 text-sm">
              No hay sucursales registradas actualmente.
            </Card>
          ) : (
            branches.map((branch) => (
              <Card
                key={branch.id}
                className="flex flex-col gap-4 border border-slate-800/80 bg-slate-900/40 relative hover:border-emerald-800/20 transition-all duration-300 group"
              >
                {/* Visual Glow Header */}
                <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />

                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1 min-w-0">
                    <h2 className="text-md font-bold text-slate-200 truncate">{branch.name}</h2>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{branch.address}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold border ${
                      branch.isActive
                        ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30'
                        : 'bg-rose-950/20 text-rose-400 border-rose-900/30'
                    }`}
                  >
                    {branch.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end mt-auto pt-2 border-t border-slate-800/40">
                  <HasPermission permission="branches:update">
                    <Button
                      size="sm"
                      variant="outline"
                      className={`text-xs ${
                        branch.isActive
                          ? 'hover:bg-rose-950/20 hover:text-rose-400'
                          : 'hover:bg-emerald-950/20 hover:text-emerald-400'
                      }`}
                      onClick={() => handleToggleStatus(branch.id, branch.isActive, branch.name)}
                      isLoading={toggleBranchStatusMutation.isPending && toggleBranchStatusMutation.variables?.id === branch.id}
                    >
                      {branch.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  </HasPermission>
                  <HasPermission permission="branches:update">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        setSelectedBranch(branch);
                        editForm.reset({
                          name: branch.name,
                          address: branch.address,
                        });
                        setIsEditOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                  </HasPermission>
                  <HasPermission permission="branches:delete">
                    <Button
                      size="sm"
                      variant="danger"
                      className="text-xs"
                      onClick={() => handleDeleteBranch(branch.id, branch.name)}
                      isLoading={deleteBranchMutation.isPending && deleteBranchMutation.variables === branch.id}
                    >
                      Eliminar
                    </Button>
                  </HasPermission>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* 1. Crear Sucursal Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Crear Nueva Sucursal">
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="flex flex-col gap-4">
          <Input
            label="Nombre de la Sucursal"
            placeholder="Ej. Sucursal Central, Bodega Sur"
            error={createForm.formState.errors.name?.message}
            {...createForm.register('name')}
          />

          <Input
            label="Dirección"
            placeholder="Ej. Av. Principal #123, Guayaquil"
            error={createForm.formState.errors.address?.message}
            {...createForm.register('address')}
          />

          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createBranchMutation.isPending}>
              Crear Sucursal
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Editar Sucursal Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Sucursal">
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="flex flex-col gap-4">
          <Input
            label="Nombre de la Sucursal"
            placeholder="Ej. Sucursal Central, Bodega Sur"
            error={editForm.formState.errors.name?.message}
            {...editForm.register('name')}
          />

          <Input
            label="Dirección"
            placeholder="Ej. Av. Principal #123, Guayaquil"
            error={editForm.formState.errors.address?.message}
            {...editForm.register('address')}
          />

          <div className="flex gap-3 justify-end mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsEditOpen(false);
                setSelectedBranch(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={updateBranchMutation.isPending}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Error Warning Modal (Stock activo) */}
      <Modal isOpen={isWarningOpen} onClose={() => setIsWarningOpen(false)} title="Advertencia de Inventario">
        <div className="flex flex-col gap-4 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start text-rose-500">
            <svg className="h-10 w-10 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-bold text-slate-100">Operación Denegada</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {warningMessage || 'La sucursal no puede eliminarse porque aún tiene lotes con stock disponible en el inventario.'}
          </p>
          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="primary" onClick={() => setIsWarningOpen(false)}>
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
