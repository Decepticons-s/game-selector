const api = require('../../../utils/api');

Page({
  data: {
    gameId: null,
    isEdit: false,
    form: {
      name: '',
      description: '',
      playerCount: {
        min: 2,
        max: 10,
        optimal: []
      },
      tags: [],
      coverImage: '',
      images: [],
      videos: [],
      difficulty: 'medium',
      duration: 30,
      status: 'active'
    },
    tagInput: '',
    difficulties: [
      { label: '简单', value: 'easy' },
      { label: '中等', value: 'medium' },
      { label: '困难', value: 'hard' }
    ],
    uploading: false,
    submitting: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        gameId: options.id,
        isEdit: true
      });
      this.loadGameDetail(options.id);
    }
  },

  // 加载游戏详情
  async loadGameDetail(id) {
    try {
      wx.showLoading({ title: '加载中...' });
      const game = await api.getGameDetail(id);
      this.setData({
        form: {
          name: game.name,
          description: game.description,
          playerCount: game.playerCount,
          tags: game.tags || [],
          coverImage: game.coverImage || '',
          images: game.images || [],
          videos: game.videos || [],
          difficulty: game.difficulty,
          duration: game.duration,
          status: game.status
        }
      });
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 输入处理
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`form.${field}`]: value
    });
  },

  onPlayerCountChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`form.playerCount.${field}`]: parseInt(value)
    });
  },

  onDifficultyChange(e) {
    this.setData({
      'form.difficulty': this.data.difficulties[e.detail.value].value
    });
  },

  // 标签处理
  onTagInput(e) {
    this.setData({
      tagInput: e.detail.value
    });
  },

  addTag() {
    const { tagInput, form } = this.data;
    if (!tagInput.trim()) return;

    if (!form.tags.includes(tagInput.trim())) {
      this.setData({
        'form.tags': [...form.tags, tagInput.trim()],
        tagInput: ''
      });
    }
  },

  removeTag(e) {
    const { index } = e.currentTarget.dataset;
    const tags = this.data.form.tags.filter((_, i) => i !== index);
    this.setData({
      'form.tags': tags
    });
  },

  // 上传封面图
  async uploadCover() {
    try {
      const { tempFilePaths } = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      this.setData({ uploading: true });
      const result = await api.uploadImage(tempFilePaths[0]);

      this.setData({
        'form.coverImage': result.url,
        uploading: false
      });

      wx.showToast({
        title: '上传成功',
        icon: 'success'
      });
    } catch (error) {
      this.setData({ uploading: false });
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    }
  },

  // 上传详情图片
  async uploadImages() {
    try {
      const { tempFilePaths } = await wx.chooseImage({
        count: 9 - this.data.form.images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      this.setData({ uploading: true });

      for (let filePath of tempFilePaths) {
        const result = await api.uploadImage(filePath);
        this.setData({
          'form.images': [...this.data.form.images, result.url]
        });
      }

      this.setData({ uploading: false });
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      });
    } catch (error) {
      this.setData({ uploading: false });
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    }
  },

  removeImage(e) {
    const { index } = e.currentTarget.dataset;
    const images = this.data.form.images.filter((_, i) => i !== index);
    this.setData({
      'form.images': images
    });
  },

  // 提交表单
  async submit() {
    const { form, isEdit, gameId } = this.data;

    // 验证
    if (!form.name.trim()) {
      wx.showToast({ title: '请输入游戏名称', icon: 'none' });
      return;
    }
    if (!form.description.trim()) {
      wx.showToast({ title: '请输入游戏描述', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    try {
      if (isEdit) {
        await api.updateGame(gameId, form);
        wx.showToast({ title: '更新成功', icon: 'success' });
      } else {
        await api.addGame(form);
        wx.showToast({ title: '添加成功', icon: 'success' });
      }

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      wx.showToast({
        title: error.error || '操作失败',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
