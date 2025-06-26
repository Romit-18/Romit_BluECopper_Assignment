import api from './api';

export const userService = {
  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Update current user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  // Get all users (Admin/Project Manager only)
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get user by ID (Admin/Project Manager only)
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Update user role (Admin only)
  updateUserRole: async (id, role) => {
    const response = await api.put(`/users/${id}/role`, { role });
    return response.data;
  },

  // Update user status (Admin only)
  updateUserStatus: async (id, isActive) => {
    const response = await api.put(`/users/${id}/status`, { isActive });
    return response.data;
  }
};

export default userService;
