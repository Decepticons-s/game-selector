const api = require('../../utils/api');

Page({
  data: {
    playerCount: '',
    games: [],
    loading: false,
    spinning: false,
    selectedGame: null,
    rotation: 0
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

  // 开始抽取
  async startDraw() {
    const { playerCount, games, spinning } = this.data;

    if (spinning) {
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

    // 开始转盘动画
    this.setData({ spinning: true });

    // 随机选择一个游戏
    const randomIndex = Math.floor(Math.random() * suitableGames.length);
    const selectedGame = suitableGames[randomIndex];

    // 模拟转盘旋转
    const baseRotation = 360 * 5; // 转5圈
    const finalRotation = baseRotation + Math.random() * 360;

    this.setData({
      rotation: finalRotation
    });

    // 等待动画完成
    setTimeout(() => {
      this.setData({
        spinning: false,
        selectedGame
      });

      // 显示结果
      wx.showModal({
        title: '抽到了！',
        content: `今天玩《${selectedGame.name}》吧！`,
        confirmText: '查看详情',
        cancelText: '再抽一次',
        success: (res) => {
          if (res.confirm) {
            // 跳转到详情页
            wx.navigateTo({
              url: `/pages/detail/detail?id=${selectedGame._id}`
            });
          } else {
            // 重置转盘
            this.setData({
              rotation: 0,
              selectedGame: null
            });
          }
        }
      });
    }, 3000);
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
