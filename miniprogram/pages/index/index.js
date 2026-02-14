const api = require('../../utils/api');

Page({
  data: {
    games: [],              // 游戏列表
    playerCount: '',        // 用户输入的人数
    isAnimating: false,     // 是否正在播放动画
    loading: true,          // 是否正在加载
    canvasReady: false,     // Canvas 是否已初始化
    canvasWidth: 0,         // Canvas 宽度（px）
    canvasHeight: 0,        // Canvas 高度（px）
    dpr: 1,                 // 设备像素比
    buttonText: '开始抽取'  // 按钮文字
  },

  // Canvas 相关属性
  canvas: null,             // Canvas 节点
  ctx: null,                // Canvas 2D 上下文
  cardImages: [],           // 预加载的卡片图片
  animationId: null,        // requestAnimationFrame ID
  systemInfo: null,         // 系统信息

  /**
   * 隐藏管理员入口 - 长按标题触发
   */
  onTitleLongPress() {
    wx.login({
      success: (res) => {
        if (res.code) {
          api.adminLoginByCode(res.code).then(result => {
            wx.setStorageSync('token', result.token);
            wx.setStorageSync('adminInfo', result.admin);
            wx.navigateTo({ url: '/pages/admin/manage/manage' });
          }).catch(() => {
            // 验证失败，静默处理
          });
        }
      }
    });
  },

  /**
   * 页面加载
   */
  onLoad() {
    this.systemInfo = wx.getSystemInfoSync();
    this.loadGames();
  },

  /**
   * 页面渲染完成
   */
  onReady() {
    this.initCanvas();
  },

  /**
   * 页面卸载 - 清理资源
   */
  onUnload() {
    if (this.animationId) {
      this.canvas.cancelAnimationFrame(this.animationId);
    }
    this.cardImages = [];
    this.canvas = null;
    this.ctx = null;
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadGames().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载游戏列表
   */
  async loadGames() {
    this.setData({ loading: true });
    try {
      // 根据人数筛选游戏
      const playerCount = this.data.playerCount ? parseInt(this.data.playerCount) : null;
      const games = await api.getGames(playerCount);

      this.setData({
        games,
        loading: false,
        buttonText: games.length > 0 ? '开始抽取' : '暂无游戏'
      });

      // 如果 Canvas 已初始化，重新预加载图片并绘制
      if (this.canvas && games.length > 0) {
        await this.preloadImages();
        this.drawAllCards(0);  // 绘制初始状态
      }
    } catch (error) {
      console.error('加载游戏失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none',
        duration: 2000
      });
      this.setData({ loading: false });
    }
  },

  /**
   * 人数输入
   */
  onPlayerCountInput(e) {
    const value = e.detail.value;
    this.setData({ playerCount: value });

    // 延迟加载，避免频繁请求
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
    }
    this.loadTimer = setTimeout(() => {
      this.loadGames();
    }, 500);
  },

  /**
   * 初始化 Canvas 2D
   */
  initCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#gameCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) {
          console.error('Canvas 节点获取失败');
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        const dpr = this.systemInfo.pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);

        this.canvas = canvas;
        this.ctx = ctx;
        this.setData({
          canvasWidth: res[0].width,
          canvasHeight: res[0].height,
          dpr,
          canvasReady: true
        });

        // 预加载图片并绘制初始状态
        if (this.data.games.length > 0) {
          this.preloadImages().then(() => {
            // 绘制初始状态（显示第一张卡片在中心）
            this.drawAllCards(0);
          });
        }
      });
  },

  /**
   * 预加载所有游戏封面图片
   */
  async preloadImages() {
    const { games } = this.data;
    this.cardImages = [];

    const loadPromises = games.map((game, index) => {
      return new Promise((resolve) => {
        const img = this.canvas.createImage();

        img.onload = () => {
          this.cardImages[index] = img;
          resolve();
        };

        img.onerror = () => {
          console.error('图片加载失败:', game.coverImage);
          // 使用默认图片
          const defaultImg = this.canvas.createImage();
          defaultImg.src = '/images/default-cover.svg';
          defaultImg.onload = () => {
            this.cardImages[index] = defaultImg;
            resolve();
          };
          defaultImg.onerror = () => {
            // 如果默认图片也加载失败，使用空图片
            this.cardImages[index] = null;
            resolve();
          };
        };

        // 设置图片源
        if (game.coverImage) {
          img.src = api.getImageUrl(game.coverImage);
        } else {
          img.src = '/images/default-cover.svg';
        }
      });
    });

    await Promise.all(loadPromises);
  },

  /**
   * rpx 转 px
   */
  rpxToPx(rpx) {
    return rpx * this.systemInfo.windowWidth / 750;
  },

  /**
   * 绘制圆角矩形路径
   */
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  },

  /**
   * 绘制单张卡片
   */
  drawCard(img, game, x, y, width, height, scale, opacity) {
    const ctx = this.ctx;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const drawX = x - scaledWidth / 2;
    const drawY = y - scaledHeight / 2;

    ctx.save();
    ctx.globalAlpha = opacity;

    // 绘制卡片阴影（更柔和的阴影）
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 30 * scale;
    ctx.shadowOffsetY = 15 * scale;

    // 绘制圆角矩形背景（渐变背景）
    const gradient = ctx.createLinearGradient(drawX, drawY, drawX, drawY + scaledHeight);
    gradient.addColorStop(0, scale > 0.9 ? '#ffffff' : '#fafafa');
    gradient.addColorStop(1, scale > 0.9 ? '#f8f9fa' : '#f1f3f4');
    ctx.fillStyle = gradient;
    this.roundRect(ctx, drawX, drawY, scaledWidth, scaledHeight, 24 * scale);
    ctx.fill();

    // 添加边框
    ctx.strokeStyle = scale > 0.9 ? 'rgba(102, 126, 234, 0.2)' : 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 绘制图片（裁剪到圆角矩形内）
    ctx.save();
    this.roundRect(ctx, drawX + 8 * scale, drawY + 8 * scale, scaledWidth - 16 * scale, scaledHeight - 80 * scale, 20 * scale);
    ctx.clip();

    if (img) {
      ctx.drawImage(img, drawX + 8 * scale, drawY + 8 * scale, scaledWidth - 16 * scale, scaledHeight - 80 * scale);
    } else {
      // 如果没有图片，绘制占位符
      ctx.fillStyle = scale > 0.9 ? '#e2e8f0' : '#f1f5f9';
      ctx.fillRect(drawX + 8 * scale, drawY + 8 * scale, scaledWidth - 16 * scale, scaledHeight - 80 * scale);

      // 绘制游戏名称
      ctx.fillStyle = '#64748b';
      ctx.font = `${32 * scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(game.name || '未知游戏', x, y);
    }

    ctx.restore();

    // 绘制游戏名称标签（在卡片底部）
    if (scale > 0.8) {  // 只在中心卡片显示名称
      // 背景
      ctx.fillStyle = 'rgba(45, 55, 72, 0.9)';
      const labelHeight = 70 * scale;
      const labelY = drawY + scaledHeight - labelHeight - 8 * scale;
      const labelX = drawX + 8 * scale;
      const labelWidth = scaledWidth - 16 * scale;

      this.roundRect(ctx, labelX, labelY, labelWidth, labelHeight, 16 * scale);
      ctx.fill();

      // 文字
      ctx.fillStyle = '#ffffff';
      ctx.font = `${30 * scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(game.name || '未知游戏', x, labelY + labelHeight / 2);
    }

    ctx.restore();
  },

  /**
   * 绘制所有卡片
   * @param {number} offsetX - 水平偏移量（px）
   */
  drawAllCards(offsetX) {
    const { canvasWidth, canvasHeight, games } = this.data;

    if (games.length === 0) return;

    const ctx = this.ctx;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const cardWidth = this.rpxToPx(440);
    const cardHeight = this.rpxToPx(640);
    const cardSpacing = cardWidth * 0.6;  // 40% 重叠

    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 计算当前中心卡片索引
    const rawCenterIndex = -offsetX / cardSpacing;
    const centerIndex = Math.round(rawCenterIndex);

    // 只绘制可见范围内的卡片
    const visibleRange = 5;
    const cardsToRender = [];

    for (let i = -visibleRange; i <= visibleRange; i++) {
      let index = centerIndex + i;

      // 循环索引
      while (index < 0) index += games.length;
      index = index % games.length;

      const relativePos = rawCenterIndex - (centerIndex - i);
      const cardX = centerX - relativePos * cardSpacing;

      // 计算缩放和透明度
      const distanceFromCenter = Math.abs(cardX - centerX);
      const normalizedDistance = Math.min(distanceFromCenter / (cardSpacing * 2), 1);
      const scale = 1 - normalizedDistance * 0.3;  // 1.0 -> 0.7
      const opacity = Math.max(1 - normalizedDistance * 0.6, 0.1);  // 1.0 -> 0.4

      cardsToRender.push({
        index,
        x: cardX,
        scale,
        opacity,
        distanceFromCenter
      });
    }

    // 按距离中心的距离排序，先绘制远的，后绘制近的
    cardsToRender.sort((a, b) => b.distanceFromCenter - a.distanceFromCenter);

    // 绘制所有卡片
    cardsToRender.forEach(card => {
      const game = games[card.index];
      const img = this.cardImages[card.index];
      this.drawCard(
        img,
        game,
        card.x,
        centerY,
        cardWidth,
        cardHeight,
        card.scale,
        card.opacity
      );
    });
  },

  /**
   * 缓动函数 - easeOutCubic
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  },

  /**
   * 开始抽取
   */
  async startDraw() {
    // 检查是否可以开始抽取
    if (this.data.isAnimating || this.data.games.length === 0) {
      return;
    }

    // 检查 Canvas 是否已初始化
    if (!this.canvas || !this.ctx || !this.data.canvasReady) {
      wx.showToast({
        title: '正在初始化，请稍候',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    this.setData({ isAnimating: true });

    try {
      // 调用后端随机接口
      const playerCount = this.data.playerCount ? parseInt(this.data.playerCount) : null;
      const randomGame = await api.getRandomGame(playerCount);

      // 找到随机游戏在列表中的索引
      const targetIndex = this.data.games.findIndex(g => g._id === randomGame._id);

      if (targetIndex !== -1) {
        // 开始动画
        this.startAnimation(targetIndex);
      } else {
        wx.showToast({
          title: '抽取失败，请重试',
          icon: 'none',
          duration: 2000
        });
        this.setData({ isAnimating: false });
      }
    } catch (error) {
      console.error('抽取游戏失败:', error);
      wx.showToast({
        title: '抽取失败，请重试',
        icon: 'none',
        duration: 2000
      });
      this.setData({ isAnimating: false });
    }
  },

  /**
   * 开始抽取动画
   * @param {number} targetIndex - 目标游戏索引
   */
  startAnimation(targetIndex) {
    const startTime = Date.now();
    const duration = 3500;  // 3.5 秒
    const totalCards = this.data.games.length;
    const cardSpacing = this.rpxToPx(440) * 0.6;  // 与 drawAllCards 保持一致

    // 计算需要滚动的距离
    // 让卡片滚动��圈后停在目标位置
    const extraRounds = 3;  // 额外滚动 3 圈
    const totalDistance = (totalCards * extraRounds + targetIndex) * cardSpacing;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 应用缓动函数
      const easedProgress = this.easeOutCubic(progress);
      const currentOffset = -totalDistance * easedProgress;

      // 绘制当前帧
      this.drawAllCards(currentOffset);

      if (progress < 1) {
        this.animationId = this.canvas.requestAnimationFrame(animate);
      } else {
        // 动画结束
        this.onAnimationComplete(targetIndex);
      }
    };

    animate();
  },

  /**
   * 动画完成回调
   */
  onAnimationComplete(targetIndex) {
    const game = this.data.games[targetIndex];

    // 延迟 500ms 后跳转，让用户看清结果
    setTimeout(() => {
      this.setData({ isAnimating: false });
      this.navigateToDetail(game._id);
    }, 500);
  },

  /**
   * 跳转到游戏详情页
   */
  navigateToDetail(gameId) {
    wx.navigateTo({
      url: `/pages/detail/detail?id=${gameId}`
    });
  }
});
