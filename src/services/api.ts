/**
 * API Service
 * Handles all communication with the Django backend
 */

import axios, { AxiosInstance } from 'axios';
import { User, UserInput, PaginatedResponse, ActionResponse } from '../types/User';

// Base URL for the API - change this if your backend runs on a different port
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/**
 * Create axios instance with default configuration
 */
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Add response interceptor for error handling
 */
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server responded with error
            console.error('API Error:', error.response.data);
        } else if (error.request) {
            // Request made but no response
            console.error('Network Error:', error.message);
        }
        return Promise.reject(error);
    }
);

/**
 * User API Service
 * All endpoints for user management
 */
export const userAPI = {
    /**
     * Get all users (with optional search and filtering)
     * @param params - Query parameters (search, is_active, page)
     */
    getAll: async (params?: {
        search?: string;
        is_active?: boolean;
        page?: number;
    }): Promise<PaginatedResponse<User>> => {
        const response = await apiClient.get<PaginatedResponse<User>>('/users/', { params });
        return response.data;
    },

    /**
     * Get a single user by ID
     * @param id - User ID
     */
    getById: async (id: number): Promise<User> => {
        const response = await apiClient.get<User>(`/users/${id}/`);
        return response.data;
    },

    /**
     * Create a new user
     * @param userData - User data (name, email, is_active)
     */
    create: async (userData: UserInput): Promise<User> => {
        const response = await apiClient.post<User>('/users/', userData);
        return response.data;
    },

    /**
     * Update a user (full update)
     * @param id - User ID
     * @param userData - Complete user data
     */
    update: async (id: number, userData: UserInput): Promise<User> => {
        const response = await apiClient.put<User>(`/users/${id}/`, userData);
        return response.data;
    },

    /**
     * Partial update a user
     * @param id - User ID
     * @param userData - Partial user data
     */
    partialUpdate: async (id: number, userData: Partial<UserInput>): Promise<User> => {
        const response = await apiClient.patch<User>(`/users/${id}/`, userData);
        return response.data;
    },

    /**
     * Delete a user
     * @param id - User ID
     */
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/users/${id}/`);
    },

    /**
     * Activate a user
     * @param id - User ID
     */
    activate: async (id: number): Promise<ActionResponse> => {
        const response = await apiClient.post<ActionResponse>(`/users/${id}/activate/`);
        return response.data;
    },

    /**
     * Deactivate a user
     * @param id - User ID
     */
    deactivate: async (id: number): Promise<ActionResponse> => {
        const response = await apiClient.post<ActionResponse>(`/users/${id}/deactivate/`);
        return response.data;
    },

    /**
     * Get all active users
     */
    getActiveUsers: async (): Promise<User[]> => {
        const response = await apiClient.get<User[]>('/users/active_users/');
        return response.data;
    },

    /**
     * Search users
     * @param query - Search query
     */
    search: async (query: string): Promise<PaginatedResponse<User>> => {
        const response = await apiClient.get<PaginatedResponse<User>>('/users/', {
            params: { search: query },
        });
        return response.data;
    },
};

export default apiClient;

