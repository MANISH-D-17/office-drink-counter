
import { Order, OrderItem, User, OfficeSummary, DrinkType, SugarPreference, TimeSlot, AggregatedRow } from './types';

/**
 * PRODUCTION SETTING:
 * Set to false to use the MongoDB backend in server.js
 */
const USE_MOCK_API = false;

// The backend serves the frontend from the same origin in production
const API_BASE_URL = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('brewhub_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // --- AUTH ---
  register: async (name: string, email: string, pin: string): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, pin })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    localStorage.setItem('brewhub_token', data.token);
    localStorage.setItem('brewhub_current_user', JSON.stringify(data.user));
    return data.user;
  },

  login: async (email: string, pin: string): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pin })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Invalid credentials');
    localStorage.setItem('brewhub_token', data.token);
    localStorage.setItem('brewhub_current_user', JSON.stringify(data.user));
    return data.user;
  },

  updateUserProfile: async (userId: string, updates: { name: string, email: string, pin: string }): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Update failed');
    localStorage.setItem('brewhub_current_user', JSON.stringify(data.user));
    return data.user;
  },

  logout: () => {
    localStorage.removeItem('brewhub_token');
    localStorage.removeItem('brewhub_current_user');
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem('brewhub_current_user');
    return data ? JSON.parse(data) : null;
  },

  // --- ORDERS ---
  placeOrder: async (userId: string, userName: string, items: OrderItem[], slot: TimeSlot): Promise<Order> => {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ items, slot })
    });
    if (!res.ok) throw new Error('Failed to place order');
    return res.json();
  },

  updateOrder: async (orderId: string, updatedItems: OrderItem[]): Promise<Order> => {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ items: updatedItems })
    });
    if (!res.ok) throw new Error('Failed to update order');
    return res.json();
  },

  getMyOrders: async (userId: string): Promise<Order[]> => {
    const res = await fetch(`${API_BASE_URL}/orders/my`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  getOfficeSummary: async (): Promise<OfficeSummary> => {
    const res = await fetch(`${API_BASE_URL}/orders/summary`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
  },

  checkAndResetDailyOrders: () => false
};
