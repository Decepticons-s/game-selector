const api = require('../../../utils/api');

Page({
  data: {
    loading: false
  },

  onLoad() {
    // 检查是否已登录
    const token = wx.getStorageSync('token');
    if (token) {
      this.checkAdminStatus();
    }
  },

  // 管理员登录
  async login() {
    this.setData({ loading: true });

    try {
      // 获取用户信息
      const { userInfo } = await wx.getUserProfile({
        desc: '用于管理员身份验证'
      });

      // 登录获取 openid（实际项目中需要调用后端接口获取）
      const loginRes = await wx.login();

      // 这里简化处理，实际需要后端接口将 code 换取 openid
      // 临时使用测试 openid
      const openid = 'test-admin-openid';

      // 调用管理员登录接口
      const result = await api.adminLogin(openid, userInfo.nickName);

      // 保存 token
      wx.setStorageSync('token', result.token);
      wx.setStorageSync('adminInfo', result.admin);

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      // 跳转到管理页面
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/admin/manage/manage'
        });
      }, 1500);

    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: error.error || '登录失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 检查管理员状态
  async checkAdminStatus() {
    try {
      await api.checkAdmin();
      // 已登录，跳转到管理页面
      wx.redirectTo({
        url: '/pages/admin/manage/manage'
      });
    } catch (error) {
      // token 失效，清除本地存储
      wx.removeStorageSync('token');
      wx.removeStorageSync('adminInfo');
    }
  }
});
