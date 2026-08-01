import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useGetInventory,
  useGetVarieties,
  useCreateVariety,
  useCreateLot,
  useCreateMovement,
} from './useInventory';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../../shared/ui/Table';
import { Modal } from '../../../shared/ui/Modal';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';
import { HasPermission } from '../../../shared/ui/HasPermission';

// Schemas
const varietySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
});

const lotItemSchema = z.object({
  varietyId: z.string().min(1, 'Selecciona una variedad'),
  quantityInitial: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  pricePerQuintal: z.number().min(0.01, 'El precio debe ser mayor a 0'),
});

const lotSchema = z.object({
  lotNumber: z.string().min(1, 'El número de lote es requerido'),
  items: z.array(lotItemSchema).min(1, 'Debe agregar al menos un ítem al lote'),
});

const movementSchema = z.object({
  lotItemId: z.string().min(1, 'Selecciona un lote-ítem'),
  type: z.enum(['INPUT', 'OUTPUT']),
  quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  reason: z.string().min(5, 'Especifica una razón detallada (mínimo 5 caracteres)'),
});

export const InventoryDashboard: React.FC = () => {
  const { data: inventoryData, isLoading: isInventoryLoading } = useGetInventory();
  const { data: varieties = [] } = useGetVarieties();

  const createVarietyMutation = useCreateVariety();
  const createLotMutation = useCreateLot();
  const createMovementMutation = useCreateMovement();

  // Modals state
  const [isVarietyModalOpen, setIsVarietyModalOpen] = useState(false);
  const [isLotModalOpen, setIsLotModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  // File states
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // Form setups
  const varietyForm = useForm<z.infer<typeof varietySchema>>({
    resolver: zodResolver(varietySchema),
    defaultValues: { name: '', description: '' },
  });

  const lotForm = useForm<z.infer<typeof lotSchema>>({
    resolver: zodResolver(lotSchema),
    defaultValues: { lotNumber: '', items: [{ varietyId: '', quantityInitial: 0, pricePerQuintal: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({
    control: lotForm.control,
    name: 'items',
  });

  const movementForm = useForm<z.infer<typeof movementSchema>>({
    resolver: zodResolver(movementSchema),
    defaultValues: { lotItemId: '', type: 'OUTPUT', quantity: 0, reason: '' },
  });

  // Submit handlers
  const onVarietySubmit = async (data: z.infer<typeof varietySchema>) => {
    try {
      await createVarietyMutation.mutateAsync(data);
      varietyForm.reset();
      setIsVarietyModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al guardar la variedad');
    }
  };

  const onLotSubmit = async (data: z.infer<typeof lotSchema>) => {
    try {
      const formData = new FormData();
      formData.append('lotNumber', data.lotNumber);
      formData.append('items', JSON.stringify(data.items));
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      } else {
        alert('Por favor, adjunta el comprobante/factura en PDF o Imagen');
        return;
      }

      await createLotMutation.mutateAsync(formData);
      lotForm.reset({ lotNumber: '', items: [{ varietyId: '', quantityInitial: 0, pricePerQuintal: 0 }] });
      setReceiptFile(null);
      setIsLotModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al registrar el lote');
    }
  };

  const onMovementSubmit = async (data: z.infer<typeof movementSchema>) => {
    try {
      const formData = new FormData();
      formData.append('lotItemId', data.lotItemId);
      formData.append('type', data.type);
      formData.append('quantity', data.quantity.toString());
      formData.append('reason', data.reason);
      if (attachmentFile) {
        formData.append('attachment', attachmentFile);
      }

      await createMovementMutation.mutateAsync(formData);
      movementForm.reset();
      setAttachmentFile(null);
      setIsMovementModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al registrar el ajuste');
    }
  };

  const varietyOptions = [
    { value: '', label: 'Selecciona variedad' },
    ...varieties.map((v) => ({ value: v.id, label: v.name })),
  ];

  // Recolectar todos los ítems de lotes disponibles para movimientos
  const lotItemOptions = [
    { value: '', label: 'Selecciona lote e ítem' },
    ...(inventoryData?.lots || []).flatMap((lot) =>
      lot.items.map((item) => ({
        value: item.id,
        label: `${lot.lotNumber} - ${item.varietyName} (Disp: ${item.quantityCurrent} qq)`,
      }))
    ),
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Panel de Control de Inventario</h1>
          <p className="text-sm text-slate-400">Supervisa las existencias y gestiona lotes de arroz</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <HasPermission permission="create:variety">
            <Button variant="outline" onClick={() => setIsVarietyModalOpen(true)}>
              Nueva Variedad
            </Button>
          </HasPermission>
          <HasPermission permission="create:lot">
            <Button variant="primary" onClick={() => setIsLotModalOpen(true)}>
              Registrar Lote
            </Button>
          </HasPermission>
          <HasPermission permission="register:movement">
            <Button variant="danger" onClick={() => setIsMovementModalOpen(true)}>
              Ajuste de Stock
            </Button>
          </HasPermission>
        </div>
      </div>

      {/* Stock Cards (Summary) */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Resumen de Variedades
        </h2>
        {isInventoryLoading ? (
          <div className="text-slate-400 text-sm">Cargando inventario...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {inventoryData?.summary.length === 0 ? (
              <Card className="col-span-full py-8 text-center text-slate-400 text-sm">
                No hay stock registrado actualmente.
              </Card>
            ) : (
              inventoryData?.summary.map((item) => (
                <Card key={item.varietyId} hoverEffect className="flex flex-col gap-3 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-sm font-bold text-slate-200">{item.name}</span>
                  <span className="text-xs text-slate-500 leading-relaxed truncate">{item.description}</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-black text-emerald-400 tracking-tight">
                      {item.totalStock}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">Quintales (qq)</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Lot Details Table */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Lotes de Entrada (Stock Detallado)
        </h2>
        {isInventoryLoading ? (
          <div className="text-slate-400 text-sm">Cargando lotes...</div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Nº Lote</Th>
                <Th>Variedad</Th>
                <Th>Stock Inicial</Th>
                <Th>Stock Actual</Th>
                <Th>Precio/Quintal</Th>
                <Th>Fecha Ingreso</Th>
                <Th>Comprobante</Th>
              </Tr>
            </Thead>
            <Tbody>
              {inventoryData?.lots.length === 0 ? (
                <Tr>
                  <Td colSpan={7} className="text-center text-slate-500 py-8">
                    No se han registrado lotes en el sistema.
                  </Td>
                </Tr>
              ) : (
                inventoryData?.lots.map((lot) =>
                  lot.items.map((item, idx) => (
                    <Tr key={`${lot.id}-${item.id}`}>
                      {idx === 0 ? (
                        <Td rowSpan={lot.items.length} className="font-bold text-slate-200">
                          {lot.lotNumber}
                        </Td>
                      ) : null}
                      <Td>{item.varietyName}</Td>
                      <Td>{item.quantityInitial} qq</Td>
                      <Td>
                        <span className={`font-semibold ${item.quantityCurrent === 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                          {item.quantityCurrent} qq
                        </span>
                      </Td>
                      <Td>${item.pricePerQuintal.toFixed(2)}</Td>
                      {idx === 0 ? (
                        <Td rowSpan={lot.items.length}>
                          {new Date(lot.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Td>
                      ) : null}
                      {idx === 0 ? (
                        <Td rowSpan={lot.items.length}>
                          {lot.receiptUrl ? (
                            <a
                              href={lot.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-1.5"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Factura
                            </a>
                          ) : (
                            <span className="text-slate-500 text-xs">Sin factura</span>
                          )}
                        </Td>
                      ) : null}
                    </Tr>
                  ))
                )
              )}
            </Tbody>
          </Table>
        )}
      </div>

      {/* 1. Registrar Variedad Modal */}
      <Modal isOpen={isVarietyModalOpen} onClose={() => setIsVarietyModalOpen(false)} title="Registrar Nueva Variedad">
        <form onSubmit={varietyForm.handleSubmit(onVarietySubmit)} className="flex flex-col gap-4">
          <Input
            label="Nombre de la Variedad"
            placeholder="Ej. Carolina, Tucán"
            error={varietyForm.formState.errors.name?.message}
            {...varietyForm.register('name')}
          />
          <Input
            label="Descripción"
            placeholder="Grano extra largo seleccionado, etc."
            error={varietyForm.formState.errors.description?.message}
            {...varietyForm.register('description')}
          />
          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsVarietyModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createVarietyMutation.isPending}>
              Guardar Variedad
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Registrar Lote Modal */}
      <Modal isOpen={isLotModalOpen} onClose={() => setIsLotModalOpen(false)} title="Registrar Lote (Entrada de Mercadería)">
        <form onSubmit={lotForm.handleSubmit(onLotSubmit)} className="flex flex-col gap-4">
          <Input
            label="Número de Lote"
            placeholder="Ej. LOTE-2026-001"
            error={lotForm.formState.errors.lotNumber?.message}
            {...lotForm.register('lotNumber')}
          />

          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Variedades y Stock del Lote
            </label>
            
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-slate-950/40 p-3 rounded-xl border border-slate-800/40 relative">
                <div className="col-span-12 md:col-span-5">
                  <Select
                    label="Variedad"
                    options={varietyOptions}
                    error={lotForm.formState.errors.items?.[index]?.varietyId?.message}
                    {...lotForm.register(`items.${index}.varietyId` as const)}
                  />
                </div>
                <div className="col-span-6 md:col-span-3">
                  <Input
                    label="Cant (qq)"
                    type="number"
                    placeholder="100"
                    error={lotForm.formState.errors.items?.[index]?.quantityInitial?.message}
                    {...lotForm.register(`items.${index}.quantityInitial` as const, { valueAsNumber: true })}
                  />
                </div>
                <div className="col-span-6 md:col-span-3">
                  <Input
                    label="Precio/qq ($)"
                    type="number"
                    step="0.01"
                    placeholder="25.50"
                    error={lotForm.formState.errors.items?.[index]?.pricePerQuintal?.message}
                    {...lotForm.register(`items.${index}.pricePerQuintal` as const, { valueAsNumber: true })}
                  />
                </div>
                <div className="col-span-12 md:col-span-1 flex justify-center pb-1">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="text-rose-500 hover:text-rose-400 disabled:opacity-30 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ varietyId: '', quantityInitial: 0, pricePerQuintal: 0 })}
              className="self-start mt-1"
            >
              Agregar Variedad
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Factura o Comprobante (PDF / Imagen)
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 cursor-pointer"
            />
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsLotModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createLotMutation.isPending}>
              Registrar Lote
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Registrar Movimiento / Ajuste Modal */}
      <Modal isOpen={isMovementModalOpen} onClose={() => setIsMovementModalOpen(false)} title="Registrar Ajuste / Merma de Stock">
        <form onSubmit={movementForm.handleSubmit(onMovementSubmit)} className="flex flex-col gap-4">
          <Select
            label="Lote e Ítem Objetivo"
            options={lotItemOptions}
            error={movementForm.formState.errors.lotItemId?.message}
            {...movementForm.register('lotItemId')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de Ajuste"
              options={[
                { value: 'OUTPUT', label: 'Salida (Merma / Ajuste negativo)' },
                { value: 'INPUT', label: 'Entrada (Ajuste positivo)' },
              ]}
              error={movementForm.formState.errors.type?.message}
              {...movementForm.register('type')}
            />
            <Input
              label="Cantidad (qq)"
              type="number"
              placeholder="10"
              error={movementForm.formState.errors.quantity?.message}
              {...movementForm.register('quantity', { valueAsNumber: true })}
            />
          </div>

          <Input
            label="Motivo del Ajuste"
            placeholder="Ej. Pérdida por humedad, ajuste de inventario físico"
            error={movementForm.formState.errors.reason?.message}
            {...movementForm.register('reason')}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Archivo Adjunto / Evidencia (Opcional)
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 cursor-pointer"
            />
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsMovementModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createMovementMutation.isPending} variant="danger">
              Registrar Ajuste
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
