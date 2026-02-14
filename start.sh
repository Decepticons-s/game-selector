#!/bin/bash

# 游戏抽取小程序 - 快速启动脚本

echo "🎲 今天玩什么 - 启动脚本"
echo "================================"

# 检查 MongoDB 是否运行
echo ""
echo "📊 检查 MongoDB 状态..."
if brew services list | grep mongodb-community | grep started > /dev/null; then
    echo "✓ MongoDB 已运行"
else
    echo "⚠️  MongoDB 未运行，正在启动..."
    brew services start mongodb-community
    sleep 2
    echo "✓ MongoDB 已启动"
fi

# 检查后端服务是否运行
echo ""
echo "🔧 检查后端服务..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✓ 后端服务已运行在 http://localhost:3000"
else
    echo "⚠️  后端服务未运行"
    echo ""
    echo "请在新终端窗口中运行以下命令启动后端："
    echo "  cd server && npm run dev"
    echo ""
    read -p "按回车键继续..."
fi

# 检查游戏数据
echo ""
echo "🎮 检查游戏数据..."
GAME_COUNT=$(curl -s http://localhost:3000/api/games | grep -o '"_id"' | wc -l | tr -d ' ')
if [ "$GAME_COUNT" -gt 0 ]; then
    echo "✓ 找到 $GAME_COUNT 个游戏"
else
    echo "⚠️  没有游戏数据"
    echo ""
    echo "如需添加测试数据，请运行："
    echo "  cd server && node seed-data.js"
fi

# 显示下一步操作
echo "================================"
echo "✅ 准备就绪！"
echo "================================"
