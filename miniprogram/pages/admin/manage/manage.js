const api = require('../../../utils/api');

Page({
  data: {
    games: [],
    loading: false,
    isAdmin: false
  },

  onLoad() {
    this.checkAdminStatus();
    this.loadGames();
  },

  onShow() {
    this.loadGames();
  },

  // 检查管理员状态
  async checkAdminStatus() {
    try {
      await api.checkAdmin();
      this.setData({ isAdmin: true });
    } catch (error) {
      this.setData({ isAdmin: false });
      // Token 失效，跳转到登录页
      wx.redirectTo({
        url: '/pages/admin/login/login'
      });
    }
  },

  // 加载游戏列表
  async loadGames() {
    try {
      this.setData({ loading: true });
      const games = await api.getGames();
      this.setData({ games });
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 添加游戏
  addGame() {
    wx.navigateTo({
      url: '/pages/admin/edit/edit'
    });
  },

  // 编辑游戏
  editGame(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/admin/edit/edit?id=${id}`
    });
  },

  // 删除游戏
  deleteGame(e) {
    const { id, name } = e.currentTarget.dataset;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除游戏"${name}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.deleteGame(id);
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            this.loadGames();
          } catch (error) {
            wx.showToast({
              title: error.error || '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('adminInfo');
          wx.redirectTo({
            url: '/pages/admin/login/login'
          });
        }
      }
    });
  }
});
