import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../shared/services/api';
import type { InventoryReport, Variety } from '../domain/inventory.types';

export function useGetInventory() {
  return useQuery<InventoryReport>({
    queryKey: ['inventory'],
    queryFn: () => api.get('/inventory'),
  });
}

export function useGetVarieties() {
  return useQuery<Variety[]>({
    queryKey: ['varieties'],
    queryFn: () => api.get('/inventory/varieties'),
  });
}

export function useCreateVariety() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      api.post('/inventory/varieties', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['varieties'] });
    },
  });
}

export function useCreateLot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/inventory/lots', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useCreateMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/inventory/movements', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
