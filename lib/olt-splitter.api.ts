import { apiRequest } from "@/lib/api"
import { OLT, OLTStats, OLTPort, CreateOLTDTO, UpdateOLTDTO } from "@/types/index"
import { Splitter, SplitterStats, CreateSplitterDTO, UpdateSplitterDTO } from "@/types/index"

// OLT specific API functions
export const oltApi = {
  getAll: () => apiRequest<OLT[]>('/olt'),
  getById: (id: string) => apiRequest<OLT>(`/olt/${id}`),
  getStats: () => apiRequest<OLTStats>('/olt/stats'),
  getPorts: (id: string) => apiRequest<OLTPort[]>(`/olt/${id}/ports`),
  create: (data: CreateOLTDTO) => apiRequest<OLT>('/olt', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: UpdateOLTDTO) => apiRequest<OLT>(`/olt/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest<{ success: boolean }>(`/olt/${id}`, {
    method: 'DELETE',
  }),
};

// Splitter specific API functions
export const splitterApi = {
  getAll: () => apiRequest<Splitter[]>('/splitter'),
  getById: (id: string) => apiRequest<Splitter>(`/splitter/${id}`),
  getStats: () => apiRequest<SplitterStats>('/splitter/stats'),
  getAvailableOlts: () => apiRequest<OLT[]>('/splitter/available-olts'),
  create: (data: CreateSplitterDTO) => apiRequest<Splitter>('/splitter', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: UpdateSplitterDTO) => apiRequest<Splitter>(`/splitter/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest<{ success: boolean }>(`/splitter/${id}`, {
    method: 'DELETE',
  }),
};