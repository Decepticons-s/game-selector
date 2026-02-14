const api = require('../../../utils/api');

Page({
  data: {
    status: 'checking' // checking | success | fail
  },

  onLoad() {
    // 检查是否已登录
    const token = wx.getStorageSync('token');
    if (token) {
      this.checkAdminStatus();
    } else {
      this.autoLogin();
    }
  },

  // 自动登录：wx.login 获取 code → 后端验证
  autoLogin() {
    this.setData({ status: 'checking' });
    wx.login({
      success: (res) => {
        if (!res.code) {
          this.setData({ status: 'fail' });
          return;
        }
        api.adminLoginByCode(res.code).then(result => {
          wx.setStorageSync('token', result.token);
          wx.setStorageSync('adminInfo', result.admin);
          this.setData({ status: 'success' });
          setTimeout(() => {
            wx.redirectTo({ url: '/pages/admin/manage/manage' });
          }, 500);
        }).catch(() => {
          this.setData({ status: 'fail' });
        });
      },
      fail: () => {
        this.setData({ status: 'fail' });
      }
    });
  },

  // 检查管理员状态
  async checkAdminStatus() {
    try {
      await api.checkAdmin();
      wx.redirectTo({ url: '/pages/admin/manage/manage' });
    } catch (error) {
      wx.removeStorageSync('token');
      wx.removeStorageSync('adminInfo');
      this.autoLogin();
    }
  }
});
