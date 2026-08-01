import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useGetSales, useCreateReturn } from './useSales';
import { useGetInventory } from '../../inventory/presentation/useInventory';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';

const returnItemSchema = z.object({
  varietyId: z.string().min(1, 'Selecciona una variedad'),
  lotItemId: z.string().min(1, 'Selecciona un lote-ítem'),
  quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  restock: z.boolean(),
});

const returnSchema = z.object({
  saleId: z.string().min(1, 'Selecciona una venta'),
  reason: z.string().min(5, 'Especifica una razón (mínimo 5 caracteres)'),
  items: z.array(returnItemSchema).min(1, 'Agrega al menos un ítem para devolver'),
});

export const ReturnsPage: React.FC = () => {
  const { data: sales = [], isLoading: isSalesLoading } = useGetSales();
  const { data: inventoryData } = useGetInventory();
  const createReturnMutation = useCreateReturn();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof returnSchema>>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      saleId: '',
      reason: '',
      items: [{ varietyId: '', lotItemId: '', quantity: 0, restock: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const onSubmit = async (data: z.infer<typeof returnSchema>) => {
    try {
      await createReturnMutation.mutateAsync(data);
      setSuccessMessage('Devolución registrada con éxito. El inventario se ha actualizado.');
      reset();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Error al procesar la devolución');
    }
  };

  const saleOptions = [
    { value: '', label: 'Selecciona una Venta Directa' },
    ...sales
      .filter((s) => s.status !== 'RETURNED')
      .map((s) => ({ value: s.id, label: `${s.saleNumber} ($${s.totalPrice.toFixed(2)})` })),
  ];

  // Listar todos los lotes de stock activos para mapear el lote-ítem
  const getLotItemsForVariety = (varietyId: string) => {
    if (!inventoryData) return [];
    return inventoryData.lots.flatMap((lot) =>
      lot.items
        .filter((item) => item.varietyId === varietyId)
        .map((item) => ({
          value: item.id,
          label: `${lot.lotNumber} (Disponible: ${item.quantityCurrent} qq)`,
        }))
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Card */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Registrar Devolución de Producto</h1>
          <p className="text-sm text-slate-400">Genera notas de crédito y reintegra stock de arroz merma o defectuoso</p>
        </div>

        {successMessage ? (
          <div className="bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 p-4 rounded-xl text-sm font-semibold flex gap-2 items-center animate-in fade-in">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {successMessage}
          </div>
        ) : null}

        <Card className="border border-slate-800/80 bg-slate-900/50">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Select
              label="Venta de Origen"
              options={saleOptions}
              error={errors.saleId?.message}
              {...register('saleId')}
            />

            <Input
              label="Motivo de la Devolución"
              placeholder="Ej. Sacos dañados por transporte, exceso de humedad"
              error={errors.reason?.message}
              {...register('reason')}
            />

            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Ítems a Devolver
              </label>

              {fields.map((field, index) => {
                const selectedVariety = watch(`items.${index}.varietyId`);
                const lotItemOptions = [
                  { value: '', label: 'Selecciona lote' },
                  ...getLotItemsForVariety(selectedVariety),
                ];

                return (
                  <div
                    key={field.id}
                    className="flex flex-col gap-3 p-4 rounded-xl bg-slate-950/40 border border-slate-800/40 relative"
                  >
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-12 md:col-span-6">
                        <Select
                          label="Variedad"
                          options={[
                            { value: '', label: 'Selecciona variedad' },
                            ...(inventoryData?.summary.map((s) => ({ value: s.varietyId, label: s.name })) || []),
                          ]}
                          error={errors.items?.[index]?.varietyId?.message}
                          {...register(`items.${index}.varietyId` as const)}
                        />
                      </div>
                      <div className="col-span-12 md:col-span-6">
                        <Select
                          label="Lote de Origen"
                          options={lotItemOptions}
                          disabled={!selectedVariety}
                          error={errors.items?.[index]?.lotItemId?.message}
                          {...register(`items.${index}.lotItemId` as const)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                      <div className="w-32">
                        <Input
                          label="Cant (qq)"
                          type="number"
                          placeholder="2"
                          error={errors.items?.[index]?.quantity?.message}
                          {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <input
                          type="checkbox"
                          id={`items.${index}.restock`}
                          className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          {...register(`items.${index}.restock` as const)}
                        />
                        <label
                          htmlFor={`items.${index}.restock`}
                          className="text-xs text-slate-400 font-semibold cursor-pointer"
                        >
                          Reingresar a Inventario (Restock)
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="text-rose-500 hover:text-rose-400 disabled:opacity-30 self-end p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
                      >
                        Eliminar Ítem
                      </button>
                    </div>
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ varietyId: '', lotItemId: '', quantity: 0, restock: true })}
                className="self-start mt-1"
              >
                Agregar Ítem a Devolver
              </Button>
            </div>

            <Button
              type="submit"
              isLoading={createReturnMutation.isPending}
              className="w-full mt-2"
            >
              Registrar Devolución
            </Button>
          </form>
        </Card>
      </div>

      {/* Sales List sidebar (Information) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Historial de Ventas Directas
          </h2>
          {isSalesLoading ? (
            <div className="text-slate-400 text-sm">Cargando ventas...</div>
          ) : (
            <div className="flex flex-col gap-4">
              {sales.length === 0 ? (
                <Card className="text-center py-6 text-slate-500 text-sm">No hay ventas registradas.</Card>
              ) : (
                sales.map((sale) => (
                  <Card key={sale.id} className="p-4 bg-slate-950/20 border border-slate-900/60 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-slate-200">{sale.saleNumber}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(sale.createdAt).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-sm font-bold text-slate-300">${sale.totalPrice.toFixed(2)}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          sale.status === 'COMPLETED'
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                            : 'bg-rose-950/40 text-rose-400 border border-rose-900/30'
                        }`}
                      >
                        {sale.status === 'COMPLETED' ? 'Completado' : 'Devuelto'}
                      </span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
