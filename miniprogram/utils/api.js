// 根据小程序环境自动切换服务器地址
// 开发版 → 本地开发服务器，体验版/正式版 → 云托管域名
function getBaseUrl() {
  const envVersion = __wxConfig.envVersion || 'develop';
  if (envVersion === 'develop') {
    return 'http://localhost:3000';
  }
  // 体验版和正式版使用云托管域名，部署时替换为实际域名
  return 'https://your-cloud-host.com';
}

const BASE_URL = getBaseUrl() + '/api';

/**
 * 将相对路径的图片 URL 转为完整地址
 * 已经是完整 URL 的直接返回
 */
function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return getBaseUrl() + path;
}

/**
 * 处理游戏对象中的图片 URL，将相对路径转为完整地址
 * 这样 wxml 模板可以直接使用 coverImage / images 渲染
 */
function processGameUrls(game) {
  if (!game) return game;
  if (game.coverImage) game.coverImage = getImageUrl(game.coverImage);
  if (game.images) game.images = game.images.map(getImageUrl);
  if (game.videos) {
    game.videos = game.videos.map(v => v.url ? { ...v, url: getImageUrl(v.url) } : v);
  }
  return game;
}

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
  getImageUrl,

  getGames: (playerCount) => {
    const query = playerCount ? `?playerCount=${playerCount}` : '';
    return request(`/games${query}`).then(games => games.map(processGameUrls));
  },

  getGameDetail: (id) => {
    return request(`/games/${id}`).then(processGameUrls);
  },

  getRandomGame: (playerCount) => {
    const query = playerCount ? `?playerCount=${playerCount}` : '';
    return request(`/games/random${query}`).then(processGameUrls);
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

  adminLoginByCode: (code) => {
    return request('/admin/login-by-code', { method: 'POST', data: { code } });
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
