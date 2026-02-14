# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- 始终使用中文
- 每次任务完成后，给我一个关于此次任务的简报，并加上时间，这些简报只在我要求时才读取，平时不要读取它们。

## 项目概述

**今天玩什么** — 根据玩家人数随机抽取桌游的微信小程序。

- 前端：`miniprogram/` — 原生微信小程序（非 Taro/uni-app）
- 后端：`server/` — Express + MongoDB（本地开发用）

## 开发命令

```bash
# 后端
cd server && npm install && npm run dev    # nodemon 热重载，端口 3000

# 数据库
brew services start mongodb-community     # 启动 MongoDB
node server/seed-data.js                  # 导入测试数据（会清空现有数据）

# API 测试
curl http://localhost:3000/api/games
curl http://localhost:3000/api/games?playerCount=8
curl http://localhost:3000/api/games/random?playerCount=8
```

小程序在微信开发者工具中打开，`miniprogramRoot` 设为 `miniprogram/`，需启用"不校验合法域名"。

## 架构

```
微信小程序 → localhost:3000 Express API → MongoDB (game-picker)
                                        → 本地文件存储 (server/uploads/)
```

### 关键模式

- **API 层抽象**：`miniprogram/utils/api.js` 封装所有 HTTP 请求，统一管理 JWT token（存在微信本地存储中）
- **认证**：`server/src/middleware/auth.js` 验证 JWT，管理员通过 openid 白名单控制（手动添加到 `admins` 集合）
- **主页动画**：`pages/index/index.js` 使用 Canvas 2D API 实现卡片轮转抽取动画，卡片从右向左滑动，中心卡片最大，两侧缩小重叠，easeOutCubic 缓动，持续 3.5 秒
- **玩家人数筛选**：通过 `playerCount.min <= N <= playerCount.max` 的 MongoDB 查询过滤游戏

### 添加新 API 端点

1. `server/src/routes/games.js` 添加路由（管理员路由加 `auth` 中间件）
2. `miniprogram/utils/api.js` 添加对应方法

## 环境变量

`server/.env`（不要提交）：
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/game-picker
JWT_SECRET=your-secret-key-change-in-production
UPLOAD_PATH=./uploads
```
