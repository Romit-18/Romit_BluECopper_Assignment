import api from './api';

export const bugService = {
  // Get all bugs with filtering and pagination
  getBugs: async (params = {}) => {
    const response = await api.get('/bugs', { params });
    return response.data;
  },

  // Get a single bug by ID
  getBugById: async (id) => {
    const response = await api.get(`/bugs/${id}`);
    return response.data;
  },

  // Create a new bug
  createBug: async (bugData) => {
    const response = await api.post('/bugs', bugData);
    return response.data;
  },

  // Update a bug
  updateBug: async (id, bugData) => {
    const response = await api.put(`/bugs/${id}`, bugData);
    return response.data;
  },

  // Delete a bug
  deleteBug: async (id) => {
    const response = await api.delete(`/bugs/${id}`);
    return response.data;
  },

  // Add a comment to a bug
  addComment: async (bugId, commentData) => {
    const response = await api.post(`/bugs/${bugId}/comments`, commentData);
    return response.data;
  },

  // Get bug statistics
  getBugStats: async () => {
    const response = await api.get('/bugs/stats/overview');
    return response.data;
  }
};

export default bugService;
