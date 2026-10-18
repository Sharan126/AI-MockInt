// ============================================
// historyService.js - Interview History Service
// ============================================

import API from './api.js';

export const getHistory = async (page = 1, limit = 10) => {
  try {
    const response = await API.get(`/history?page=${page}&limit=${limit}`);
    return response.data.data;
  } catch (error) {
    return { interviews: [], totalPages: 1 };
  }
};

export const deleteHistoryItem = async (id) => {
  try {
    const response = await API.delete(`/history/${id}`);
    return response.data;
  } catch (error) {
    return { success: false };
  }
};

export const clearHistory = async () => {
  try {
    const response = await API.delete('/history');
    return response.data;
  } catch (error) {
    return { success: false };
  }
};

export default { getHistory, deleteHistoryItem, clearHistory };
