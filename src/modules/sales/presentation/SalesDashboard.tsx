import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useGetSales,
  useGetReservations,
  useCreateSale,
  useCreateReservation,
  usePickupReservation,
} from './useSales';
import { useGetVarieties, useGetInventory } from '../../inventory/presentation/useInventory';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../../shared/ui/Table';
import { Modal } from '../../../shared/ui/Modal';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';
import { HasPermission } from '../../../shared/ui/HasPermission';

// Zod validation schemas
const saleItemSchema = z.object({
  varietyId: z.string().min(1, 'Selecciona una variedad'),
  quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  pricePerUnit: z.number().optional(), // opcional, si no, se usa FIFO
});

const directSaleSchema = z.object({
  paymentMethod: z.enum(['CASH', 'QR', 'TRANSFER', 'MIXED']),
  cashAmount: z.number().min(0),
  qrAmount: z.number().min(0),
  transferAmount: z.number().min(0),
  items: z.array(saleItemSchema).min(1, 'Agrega al menos una variedad'),
});

const reservationSchema = z.object({
  customerName: z.string().min(1, 'El nombre del cliente es requerido'),
  customerPhone: z.string().optional(),
  downPayment: z.number().min(0, 'El adelanto debe ser mayor o igual a 0'),
  paymentMethod: z.enum(['CASH', 'QR', 'TRANSFER', 'MIXED']),
  cashAmount: z.number().min(0),
  qrAmount: z.number().min(0),
  transferAmount: z.number().min(0),
  items: z.array(saleItemSchema).min(1, 'Agrega al menos una variedad'),
});

const pickupSchema = z.object({
  paymentMethod: z.enum(['CASH', 'QR', 'TRANSFER', 'MIXED']),
  cashAmount: z.number().min(0),
  qrAmount: z.number().min(0),
  transferAmount: z.number().min(0),
});

export const SalesDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'reservations'>('sales');

  const { data: sales = [], isLoading: isSalesLoading } = useGetSales();
  const { data: reservations = [], isLoading: isReservationsLoading } = useGetReservations();
  const { data: varieties = [] } = useGetVarieties();
  const { data: inventoryData } = useGetInventory();

  const createSaleMutation = useCreateSale();
  const createReservationMutation = useCreateReservation();
  const pickupReservationMutation = usePickupReservation();

  // Modals state
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  // File Upload states
  const [proofFile, setProofFile] = useState<File | null>(null);

  // Forms setup
  const saleForm = useForm<z.infer<typeof directSaleSchema>>({
    resolver: zodResolver(directSaleSchema),
    defaultValues: {
      paymentMethod: 'CASH',
      cashAmount: 0,
      qrAmount: 0,
      transferAmount: 0,
      items: [{ varietyId: '', quantity: 0 }],
    },
  });

  const saleFields = useFieldArray({ control: saleForm.control, name: 'items' });

  const resForm = useForm<z.infer<typeof reservationSchema>>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      downPayment: 0,
      paymentMethod: 'CASH',
      cashAmount: 0,
      qrAmount: 0,
      transferAmount: 0,
      items: [{ varietyId: '', quantity: 0 }],
    },
  });

  const resFields = useFieldArray({ control: resForm.control, name: 'items' });

  const pickupForm = useForm<z.infer<typeof pickupSchema>>({
    resolver: zodResolver(pickupSchema),
    defaultValues: {
      paymentMethod: 'CASH',
      cashAmount: 0,
      qrAmount: 0,
      transferAmount: 0,
    },
  });

  // Calculate prices based on varieties and stocks
  const getVarietyPrice = (varietyId: string): number => {
    const lotItem = inventoryData?.lots
      .flatMap((l) => l.items)
      .find((i) => i.varietyId === varietyId && i.quantityCurrent > 0);
    return lotItem ? lotItem.pricePerQuintal : 28.5; // fallback price
  };

  const getVarietyStock = (varietyId: string): number => {
    const summary = inventoryData?.summary.find((s) => s.varietyId === varietyId);
    return summary ? summary.totalStock : 0;
  };

  const calculateSaleTotal = (items: Array<{ varietyId: string; quantity: number }>) => {
    return items.reduce((acc, item) => {
      if (!item.varietyId) return acc;
      return acc + item.quantity * getVarietyPrice(item.varietyId);
    }, 0);
  };

  // Submit methods
  const onSaleSubmit = async (data: z.infer<typeof directSaleSchema>) => {
    try {
      const total = calculateSaleTotal(data.items);
      const isProofRequired =
        data.paymentMethod === 'QR' ||
        data.paymentMethod === 'TRANSFER' ||
        (data.paymentMethod === 'MIXED' && (data.qrAmount > 0 || data.transferAmount > 0));

      if (isProofRequired && !proofFile) {
        alert('Se requiere comprobante de pago para transacciones electrónicas (QR o Transferencia)');
        return;
      }

      // Validar montos para MIXED
      if (data.paymentMethod === 'MIXED') {
        const sum = data.cashAmount + data.qrAmount + data.transferAmount;
        if (Math.abs(sum - total) > 0.05) {
          alert(`El total pagado ($${sum}) debe ser igual al total de la venta ($${total})`);
          return;
        }
      }

      const itemsWithPrice = data.items.map((item) => ({
        ...item,
        pricePerUnit: getVarietyPrice(item.varietyId),
      }));

      const formData = new FormData();
      formData.append('items', JSON.stringify(itemsWithPrice));
      formData.append('paymentMethod', data.paymentMethod);
      formData.append('cashAmount', data.paymentMethod === 'CASH' ? total.toString() : data.cashAmount.toString());
      formData.append('qrAmount', data.paymentMethod === 'QR' ? total.toString() : data.qrAmount.toString());
      formData.append('transferAmount', data.paymentMethod === 'TRANSFER' ? total.toString() : data.transferAmount.toString());
      if (proofFile) {
        formData.append('proof', proofFile);
      }

      await createSaleMutation.mutateAsync(formData);
      saleForm.reset();
      setProofFile(null);
      setIsSaleModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al procesar la venta');
    }
  };

  const onReservationSubmit = async (data: z.infer<typeof reservationSchema>) => {
    try {
      const isProofRequired =
        data.paymentMethod === 'QR' ||
        data.paymentMethod === 'TRANSFER' ||
        (data.paymentMethod === 'MIXED' && (data.qrAmount > 0 || data.transferAmount > 0));

      if (isProofRequired && !proofFile && data.downPayment > 0) {
        alert('Se requiere comprobante de pago para el adelanto electrónico');
        return;
      }

      // Validar montos de adelanto
      if (data.paymentMethod === 'MIXED') {
        const sum = data.cashAmount + data.qrAmount + data.transferAmount;
        if (Math.abs(sum - data.downPayment) > 0.05) {
          alert(`El desglose de pagos ($${sum}) debe coincidir con el monto de adelanto ($${data.downPayment})`);
          return;
        }
      }

      const itemsWithPrice = data.items.map((item) => ({
        ...item,
        pricePerUnit: getVarietyPrice(item.varietyId),
      }));

      const formData = new FormData();
      formData.append('customerName', data.customerName);
      if (data.customerPhone) formData.append('customerPhone', data.customerPhone);
      formData.append('items', JSON.stringify(itemsWithPrice));
      formData.append('paymentMethod', data.paymentMethod);
      formData.append('downPayment', data.downPayment.toString());
      formData.append('cashAmount', data.paymentMethod === 'CASH' ? data.downPayment.toString() : data.cashAmount.toString());
      formData.append('qrAmount', data.paymentMethod === 'QR' ? data.downPayment.toString() : data.qrAmount.toString());
      formData.append('transferAmount', data.paymentMethod === 'TRANSFER' ? data.downPayment.toString() : data.transferAmount.toString());
      if (proofFile) {
        formData.append('proof', proofFile);
      }

      await createReservationMutation.mutateAsync(formData);
      resForm.reset();
      setProofFile(null);
      setIsReservationModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al crear la reserva');
    }
  };

  const onPickupSubmit = async (data: z.infer<typeof pickupSchema>) => {
    try {
      if (!selectedReservation) return;
      const outstandingBalance = selectedReservation.totalPrice - (selectedReservation.payments?.[0]?.totalPaid || 0);

      const isProofRequired =
        data.paymentMethod === 'QR' ||
        data.paymentMethod === 'TRANSFER' ||
        (data.paymentMethod === 'MIXED' && (data.qrAmount > 0 || data.transferAmount > 0));

      if (isProofRequired && !proofFile) {
        alert('Se requiere comprobante para liquidar la reserva');
        return;
      }

      if (data.paymentMethod === 'MIXED') {
        const sum = data.cashAmount + data.qrAmount + data.transferAmount;
        if (Math.abs(sum - outstandingBalance) > 0.05) {
          alert(`El pago de liquidación ($${sum}) debe ser igual al saldo restante ($${outstandingBalance})`);
          return;
        }
      }

      const formData = new FormData();
      formData.append('paymentMethod', data.paymentMethod);
      formData.append('cashAmount', data.paymentMethod === 'CASH' ? outstandingBalance.toString() : data.cashAmount.toString());
      formData.append('qrAmount', data.paymentMethod === 'QR' ? outstandingBalance.toString() : data.qrAmount.toString());
      formData.append('transferAmount', data.paymentMethod === 'TRANSFER' ? outstandingBalance.toString() : data.transferAmount.toString());
      if (proofFile) {
        formData.append('proof', proofFile);
      }

      await pickupReservationMutation.mutateAsync({ id: selectedReservation.id, formData });
      pickupForm.reset();
      setProofFile(null);
      setSelectedReservation(null);
      setIsPickupModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al completar la recogida');
    }
  };

  const varietyOptions = [
    { value: '', label: 'Selecciona Arroz' },
    ...varieties.map((v) => ({
      value: v.id,
      label: `${v.name} (Disp: ${getVarietyStock(v.id)} qq - $${getVarietyPrice(v.id)}/qq)`,
    })),
  ];

  const paymentOptions = [
    { value: 'CASH', label: 'Efectivo' },
    { value: 'QR', label: 'Código QR' },
    { value: 'TRANSFER', label: 'Transferencia Bancaria' },
    { value: 'MIXED', label: 'Pago Mixto' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Registro de Ventas e Ingresos</h1>
          <p className="text-sm text-slate-400">Emite boletas de venta y coordina reservas de clientes</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'sales' ? (
            <HasPermission permission="create:sale">
              <Button onClick={() => setIsSaleModalOpen(true)}>Venta Directa</Button>
            </HasPermission>
          ) : (
            <HasPermission permission="create:reservation">
              <Button onClick={() => setIsReservationModalOpen(true)}>Nueva Reserva</Button>
            </HasPermission>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-6 py-2.5 text-sm font-semibold transition-colors duration-200 border-b-2 ${
            activeTab === 'sales'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Ventas Directas
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-6 py-2.5 text-sm font-semibold transition-colors duration-200 border-b-2 ${
            activeTab === 'reservations'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Reservas
        </button>
      </div>

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div>
          {isSalesLoading ? (
            <div className="text-slate-400 text-sm">Cargando ventas...</div>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Nº Venta</Th>
                  <Th>Importe Total</Th>
                  <Th>Estado</Th>
                  <Th>Fecha Registro</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sales.length === 0 ? (
                  <Tr>
                    <Td colSpan={4} className="text-center text-slate-500 py-8">
                      No hay ventas directas registradas.
                    </Td>
                  </Tr>
                ) : (
                  sales.map((sale) => (
                    <Tr key={sale.id}>
                      <Td className="font-bold text-slate-200">{sale.saleNumber}</Td>
                      <Td className="font-semibold text-emerald-400">${sale.totalPrice.toFixed(2)}</Td>
                      <Td>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            sale.status === 'COMPLETED'
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                              : 'bg-rose-950/40 text-rose-400 border border-rose-900/30'
                          }`}
                        >
                          {sale.status === 'COMPLETED' ? 'Completado' : 'Devuelto'}
                        </span>
                      </Td>
                      <Td>
                        {new Date(sale.createdAt).toLocaleString('es-ES', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          )}
        </div>
      )}

      {/* Reservations Tab */}
      {activeTab === 'reservations' && (
        <div>
          {isReservationsLoading ? (
            <div className="text-slate-400 text-sm">Cargando reservas...</div>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Nº Reserva</Th>
                  <Th>Cliente</Th>
                  <Th>Teléfono</Th>
                  <Th>Total</Th>
                  <Th>Fecha Creación</Th>
                  <Th>Estado</Th>
                  <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {reservations.length === 0 ? (
                  <Tr>
                    <Td colSpan={7} className="text-center text-slate-500 py-8">
                      No hay reservas activas registradas.
                    </Td>
                  </Tr>
                ) : (
                  reservations.map((res) => (
                    <Tr key={res.id}>
                      <Td className="font-bold text-slate-200">{res.reservationNumber}</Td>
                      <Td>{res.customerName}</Td>
                      <Td>{res.customerPhone || <span className="text-slate-600">-</span>}</Td>
                      <Td className="font-semibold text-emerald-400">${res.totalPrice.toFixed(2)}</Td>
                      <Td>{new Date(res.createdAt).toLocaleDateString('es-ES')}</Td>
                      <Td>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            res.status === 'PICKED_UP'
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                              : res.status === 'PENDING'
                              ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30'
                              : 'bg-rose-950/40 text-rose-400 border border-rose-900/30'
                          }`}
                        >
                          {res.status === 'PICKED_UP' ? 'Entregado' : res.status === 'PENDING' ? 'Pendiente' : 'Cancelado'}
                        </span>
                      </Td>
                      <Td>
                        {res.status === 'PENDING' ? (
                          <HasPermission permission="pickup:reservation">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedReservation(res);
                                setIsPickupModalOpen(true);
                              }}
                            >
                              Entregar (Cobrar)
                            </Button>
                          </HasPermission>
                        ) : (
                          <span className="text-xs text-slate-500 font-semibold">Listo</span>
                        )}
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          )}
        </div>
      )}

      {/* 1. Registrar Venta Directa Modal */}
      <Modal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} title="Nueva Venta Directa">
        <form onSubmit={saleForm.handleSubmit(onSaleSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detalle del Pedido</label>
            {saleFields.fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                <div className="col-span-8">
                  <Select
                    label="Variedad de Arroz"
                    options={varietyOptions}
                    error={saleForm.formState.errors.items?.[index]?.varietyId?.message}
                    {...saleForm.register(`items.${index}.varietyId` as const)}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    label="Cant (qq)"
                    type="number"
                    placeholder="5"
                    error={saleForm.formState.errors.items?.[index]?.quantity?.message}
                    {...saleForm.register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                  />
                </div>
                <div className="col-span-1 flex justify-center pb-1">
                  <button
                    type="button"
                    onClick={() => saleFields.remove(index)}
                    disabled={saleFields.fields.length === 1}
                    className="text-rose-500 hover:text-rose-400 disabled:opacity-30 p-1.5"
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
              onClick={() => saleFields.append({ varietyId: '', quantity: 0 })}
              className="self-start"
            >
              Agregar Variedad
            </Button>
          </div>

          <div className="border-t border-slate-800/60 pt-3 flex justify-between items-baseline">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Subtotal Estimado</span>
            <span className="text-xl font-bold text-emerald-400">
              ${calculateSaleTotal(saleForm.watch('items')).toFixed(2)}
            </span>
          </div>

          <Select
            label="Método de Pago"
            options={paymentOptions}
            {...saleForm.register('paymentMethod')}
          />

          {saleForm.watch('paymentMethod') === 'MIXED' && (
            <div className="grid grid-cols-3 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 animate-in fade-in slide-in-from-top-1">
              <Input
                label="Efectivo"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={saleForm.formState.errors.cashAmount?.message}
                {...saleForm.register('cashAmount', { valueAsNumber: true })}
              />
              <Input
                label="QR"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={saleForm.formState.errors.qrAmount?.message}
                {...saleForm.register('qrAmount', { valueAsNumber: true })}
              />
              <Input
                label="Transfer."
                type="number"
                step="0.01"
                placeholder="0.00"
                error={saleForm.formState.errors.transferAmount?.message}
                {...saleForm.register('transferAmount', { valueAsNumber: true })}
              />
            </div>
          )}

          {saleForm.watch('paymentMethod') !== 'CASH' && (
            <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Comprobante de Pago (Archivo)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>
          )}

          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsSaleModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createSaleMutation.isPending}>
              Registrar Venta
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Registrar Nueva Reserva Modal */}
      <Modal isOpen={isReservationModalOpen} onClose={() => setIsReservationModalOpen(false)} title="Nueva Reserva de Cliente">
        <form onSubmit={resForm.handleSubmit(onReservationSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre del Cliente"
              placeholder="Ej. Carlos Rojas"
              error={resForm.formState.errors.customerName?.message}
              {...resForm.register('customerName')}
            />
            <Input
              label="Teléfono del Cliente"
              placeholder="Ej. 77112233"
              error={resForm.formState.errors.customerPhone?.message}
              {...resForm.register('customerPhone')}
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Productos Reservados</label>
            {resFields.fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                <div className="col-span-8">
                  <Select
                    label="Variedad"
                    options={varietyOptions}
                    error={resForm.formState.errors.items?.[index]?.varietyId?.message}
                    {...resForm.register(`items.${index}.varietyId` as const)}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    label="Cant (qq)"
                    type="number"
                    placeholder="10"
                    error={resForm.formState.errors.items?.[index]?.quantity?.message}
                    {...resForm.register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                  />
                </div>
                <div className="col-span-1 flex justify-center pb-1">
                  <button
                    type="button"
                    onClick={() => resFields.remove(index)}
                    disabled={resFields.fields.length === 1}
                    className="text-rose-500 hover:text-rose-400 disabled:opacity-30 p-1.5"
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
              onClick={() => resFields.append({ varietyId: '', quantity: 0 })}
              className="self-start"
            >
              Agregar Variedad
            </Button>
          </div>

          <div className="border-t border-slate-800/60 pt-3 flex justify-between items-baseline">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total de la Reserva</span>
            <span className="text-xl font-bold text-slate-200">
              ${calculateSaleTotal(resForm.watch('items')).toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Monto Adelantado ($)"
              type="number"
              placeholder="100.00"
              error={resForm.formState.errors.downPayment?.message}
              {...resForm.register('downPayment', { valueAsNumber: true })}
            />
            <Select
              label="Método Adelanto"
              options={paymentOptions}
              {...resForm.register('paymentMethod')}
            />
          </div>

          {resForm.watch('paymentMethod') === 'MIXED' && (
            <div className="grid grid-cols-3 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 animate-in fade-in slide-in-from-top-1">
              <Input
                label="Efectivo"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={resForm.formState.errors.cashAmount?.message}
                {...resForm.register('cashAmount', { valueAsNumber: true })}
              />
              <Input
                label="QR"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={resForm.formState.errors.qrAmount?.message}
                {...resForm.register('qrAmount', { valueAsNumber: true })}
              />
              <Input
                label="Transfer."
                type="number"
                step="0.01"
                placeholder="0.00"
                error={resForm.formState.errors.transferAmount?.message}
                {...resForm.register('transferAmount', { valueAsNumber: true })}
              />
            </div>
          )}

          {resForm.watch('paymentMethod') !== 'CASH' && resForm.watch('downPayment') > 0 && (
            <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Comprobante Adelanto (Archivo)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>
          )}

          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsReservationModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createReservationMutation.isPending}>
              Registrar Reserva
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Recogida / Entrega de Reserva Modal */}
      <Modal isOpen={isPickupModalOpen} onClose={() => setIsPickupModalOpen(false)} title="Completar y Entregar Reserva">
        {selectedReservation && (
          <form onSubmit={pickupForm.handleSubmit(onPickupSubmit)} className="flex flex-col gap-4">
            <Card className="p-4 bg-slate-950/40 border border-slate-800/80 flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Nº Reserva:</span>
                <span className="font-bold text-slate-200">{selectedReservation.reservationNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Cliente:</span>
                <span className="text-slate-200">{selectedReservation.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Venta:</span>
                <span className="text-slate-200 font-semibold">${selectedReservation.totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Adelantado:</span>
                <span className="text-emerald-400 font-semibold">
                  -${(selectedReservation.payments?.[0]?.totalPaid || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-md border-t border-slate-800/60 pt-2 font-bold">
                <span className="text-slate-300">Saldo Restante:</span>
                <span className="text-amber-400">
                  ${(selectedReservation.totalPrice - (selectedReservation.payments?.[0]?.totalPaid || 0)).toFixed(2)}
                </span>
              </div>
            </Card>

            <Select
              label="Método de Liquidación"
              options={paymentOptions}
              {...pickupForm.register('paymentMethod')}
            />

            {pickupForm.watch('paymentMethod') === 'MIXED' && (
              <div className="grid grid-cols-3 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 animate-in fade-in slide-in-from-top-1">
                <Input
                  label="Efectivo"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  error={pickupForm.formState.errors.cashAmount?.message}
                  {...pickupForm.register('cashAmount', { valueAsNumber: true })}
                />
                <Input
                  label="QR"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  error={pickupForm.formState.errors.qrAmount?.message}
                  {...pickupForm.register('qrAmount', { valueAsNumber: true })}
                />
                <Input
                  label="Transfer."
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  error={pickupForm.formState.errors.transferAmount?.message}
                  {...pickupForm.register('transferAmount', { valueAsNumber: true })}
                />
              </div>
            )}

            {pickupForm.watch('paymentMethod') !== 'CASH' && (
              <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Comprobante Liquidación (Archivo)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>
            )}

            <div className="flex gap-3 justify-end mt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsPickupModalOpen(false);
                  setSelectedReservation(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" isLoading={pickupReservationMutation.isPending} variant="primary">
                Entregar y Liquidar
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
