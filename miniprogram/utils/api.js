const BASE_URL = 'http://localhost:3000/api';

const request = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    
    wx.request({
      url: BASE_URL + url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(res.data);
        }
      },
      fail: reject
    });
  });
};

module.exports = {
  getGames: (playerCount) => {
    const query = playerCount ? `?playerCount=${playerCount}` : '';
    return request(`/games${query}`);
  },
  
  getGameDetail: (id) => {
    return request(`/games/${id}`);
  },
  
  getRandomGame: (playerCount) => {
    const query = playerCount ? `?playerCount=${playerCount}` : '';
    return request(`/games/random${query}`);
  },
  
  addGame: (data) => {
    return request('/games', { method: 'POST', data });
  },
  
  updateGame: (id, data) => {
    return request(`/games/${id}`, { method: 'PUT', data });
  },
  
  deleteGame: (id) => {
    return request(`/games/${id}`, { method: 'DELETE' });
  },
  
  adminLogin: (openid, nickname) => {
    return request('/admin/login', { method: 'POST', data: { openid, nickname } });
  },
  
  checkAdmin: () => {
    return request('/admin/check');
  },
  
  uploadImage: (filePath) => {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token');
      
      wx.uploadFile({
        url: BASE_URL + '/upload/image',
        filePath,
        name: 'file',
        header: { 'Authorization': token ? `Bearer ${token}` : '' },
        success: (res) => {
          const data = JSON.parse(res.data);
          resolve(data);
        },
        fail: reject
      });
    });
  },
  
  uploadVideo: (filePath) => {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token');
      
      wx.uploadFile({
        url: BASE_URL + '/upload/video',
        filePath,
        name: 'file',
        header: { 'Authorization': token ? `Bearer ${token}` : '' },
        success: (res) => {
          const data = JSON.parse(res.data);
          resolve(data);
        },
        fail: reject
      });
    });
  }
};
