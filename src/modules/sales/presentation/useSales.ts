import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../shared/services/api';
import type { Sale, Reservation } from '../domain/sales.types';

export function useGetSales() {
  return useQuery<Sale[]>({
    queryKey: ['sales'],
    queryFn: () => api.get('/sales'),
  });
}

export function useGetReservations() {
  return useQuery<Reservation[]>({
    queryKey: ['reservations'],
    queryFn: () => api.get('/sales/reservations'),
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/sales', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/sales/reservations', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function usePickupReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      api.post(`/sales/reservations/${id}/pickup`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      saleId: string;
      reason: string;
      items: Array<{
        varietyId: string;
        lotItemId: string;
        quantity: number;
        restock: boolean;
      }>;
    }) => api.post('/sales/returns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
