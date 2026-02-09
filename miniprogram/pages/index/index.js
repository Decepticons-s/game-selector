const api = require('../../utils/api');

Page({
  data: {
    playerCount: '',
    games: [],
    loading: false,
    isRevealed: false,
    selectedGame: null
  },

  onLoad() {
    this.loadGames();
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

  // 人数输入
  onPlayerCountInput(e) {
    this.setData({
      playerCount: e.detail.value
    });
  },

  // 点击卡片开始抽取
  handleCardClick() {
    const { playerCount, games, isRevealed } = this.data;

    // 如果已经翻转，不响应点击
    if (isRevealed) {
      return;
    }

    // 验证人数
    const count = parseInt(playerCount);
    if (!playerCount || isNaN(count) || count <= 0) {
      wx.showToast({
        title: '请输入有效人数',
        icon: 'none'
      });
      return;
    }

    // 筛选符合人数的游戏
    const suitableGames = games.filter(game => {
      return count >= game.playerCount.min && count <= game.playerCount.max;
    });

    if (suitableGames.length === 0) {
      wx.showToast({
        title: '没有适合该人数的游戏',
        icon: 'none'
      });
      return;
    }

    // 随机选择一个游戏
    const randomIndex = Math.floor(Math.random() * suitableGames.length);
    const selectedGame = suitableGames[randomIndex];

    // 延迟翻转，增加悬念
    setTimeout(() => {
      this.setData({
        selectedGame,
        isRevealed: true
      });
    }, 300);
  },

  // 重置
  handleReset() {
    this.setData({
      isRevealed: false,
      selectedGame: null
    });
  },

  // 查看所有游戏
  viewAllGames() {
    wx.navigateTo({
      url: '/pages/list/list'
    });
  },

  // 进入管理后台
  goToAdmin() {
    wx.navigateTo({
      url: '/pages/admin/login/login'
    });
  }
})
