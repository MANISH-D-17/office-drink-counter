import { Order, OrderItem, User, OfficeSummary, DrinkType, SugarPreference, TimeSlot, AggregatedRow, BroadcastMessage } from './types';

const API_BASE_URL = '/api';

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    localStorage.removeItem('brewhub_token');
    localStorage.removeItem('brewhub_current_user');
    window.location.reload(); 
    throw new Error('Session expired. Please log in again.');
  }
  
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API request failed');
    return data;
  } else {
    // Non-JSON response (likely an HTML 404/500 from the server)
    const text = await res.text();
    console.error('Server returned non-JSON response:', text);
    throw new Error(`Server Error: Expected JSON but received ${res.status} ${res.statusText}. Please contact Admin.`);
  }
};

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
      body: JSON.stringify({ name, email: email.toLowerCase(), pin })
    });
    const data = await handleResponse(res);
    localStorage.setItem('brewhub_token', data.token);
    localStorage.setItem('brewhub_current_user', JSON.stringify(data.user));
    return data.user;
  },

  login: async (email: string, pin: string): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase(), pin })
    });
    const data = await handleResponse(res);
    localStorage.setItem('brewhub_token', data.token);
    localStorage.setItem('brewhub_current_user', JSON.stringify(data.user));
    return data.user;
  },

  updateUserProfile: async (userId: string, updates: { name: string, email: string, pin: string }): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ ...updates, email: updates.email.toLowerCase() })
    });
    const data = await handleResponse(res);
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
    return handleResponse(res);
  },

  updateOrder: async (orderId: string, updatedItems: OrderItem[]): Promise<Order> => {
    if (!orderId) throw new Error("Order ID is required for update");
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ items: updatedItems })
    });
    return handleResponse(res);
  },

  deleteOrder: async (orderId: string): Promise<void> => {
    if (!orderId) throw new Error("Order ID is required for deletion");
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    await handleResponse(res);
  },

  clearAllOrders: async (): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/orders/all`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    await handleResponse(res);
  },

  getMyOrders: async (userId: string): Promise<Order[]> => {
    const res = await fetch(`${API_BASE_URL}/orders/my`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getOfficeSummary: async (): Promise<OfficeSummary> => {
    const res = await fetch(`${API_BASE_URL}/orders/summary`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // --- BROADCASTS ---
  sendBroadcast: async (message: string, type: string): Promise<BroadcastMessage> => {
    const res = await fetch(`${API_BASE_URL}/broadcasts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, type })
    });
    return handleResponse(res);
  },

  sendEmailBlast: async (subject: string, message: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/admin/email-blast`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ subject, message })
    });
    await handleResponse(res);
  },

  getLatestBroadcast: async (): Promise<BroadcastMessage | null> => {
    const res = await fetch(`${API_BASE_URL}/broadcasts/latest`, { headers: getHeaders() });
    if (res.status === 401) return null;
    return handleResponse(res);
  }
};