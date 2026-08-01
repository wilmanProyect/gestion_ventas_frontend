import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthToken = (): string | null => {
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.state?.token || null;
  } catch {
    return null;
  }
};

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Interceptor para inyectar token Bearer de forma dinámica
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejo de errores consistente
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let errorMessage = 'Ocurrió un error inesperado';
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      errorMessage = error.response.data?.message || errorMessage;
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta (ej. CORS o Servidor caído)
      errorMessage = 'No se pudo conectar con el servidor backend';
    }
    return Promise.reject(new Error(errorMessage));
  }
);

export const api = {
  get: <T = any>(endpoint: string, config?: any): Promise<T> => 
    axiosInstance.get(endpoint, config) as any,
    
  post: <T = any>(endpoint: string, data?: any, config?: any): Promise<T> => 
    axiosInstance.post(endpoint, data, config) as any,
    
  put: <T = any>(endpoint: string, data?: any, config?: any): Promise<T> => 
    axiosInstance.put(endpoint, data, config) as any,
    
  delete: <T = any>(endpoint: string, config?: any): Promise<T> => 
    axiosInstance.delete(endpoint, config) as any,
};
