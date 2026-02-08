const api = require('../../utils/api');

Page({
  data: {
    game: null,
    loading: true
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.loadGameDetail(id);
    }
  },

  // 加载游戏详情
  async loadGameDetail(id) {
    try {
      this.setData({ loading: true });
      const game = await api.getGameDetail(id);
      this.setData({ game });
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 预览图片
  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    const { images, coverImage } = this.data.game;
    const allImages = coverImage ? [coverImage, ...images] : images;

    wx.previewImage({
      current: url,
      urls: allImages
    });
  },

  // 再抽一次
  drawAgain() {
    wx.navigateBack();
  }
});
