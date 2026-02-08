const api = require('../../utils/api');

Page({
  data: {
    games: [],
    playerCount: 0,
    loading: false
  },

  onLoad() {
    this.loadGames();
  },

  onShow() {
    // 每次显示页面时刷新列表
    this.loadGames();
  },

  // 加载游戏列表
  async loadGames() {
    try {
      this.setData({ loading: true });
      const games = await api.getGames(this.data.playerCount || null);
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

  // 人数筛选
  onPlayerCountChange(e) {
    const playerCount = parseInt(e.detail.value);
    this.setData({ playerCount });
    this.loadGames();
  },

  // 查看游戏详情
  viewDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  }
});
