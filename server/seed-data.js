require('dotenv').config();
const mongoose = require('mongoose');

// 连接数据库
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB 已连接'))
  .catch(err => console.error('MongoDB 连接失败:', err));

// 游戏 Schema
const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  playerCount: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    optimal: [Number]
  },
  tags: [String],
  coverImage: String,
  images: [String],
  videos: [{
    url: String,
    title: String,
    duration: Number
  }],
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  duration: Number,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

const Game = mongoose.model('Game', gameSchema);

// 管理员 Schema
const adminSchema = new mongoose.Schema({
  openid: { type: String, required: true, unique: true },
  nickname: String,
  role: { type: String, default: 'admin' }
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

// 管理员数据（部署后将 openid 替换为真实微信 openid）
const testAdmins = [
  {
    openid: 'test-admin-openid',
    nickname: '管理员',
    role: 'admin'
  }
];

// 测试游戏数据
const testGames = [
  {
    name: "狼人杀",
    description: "经典的角色扮演推理游戏，玩家分为狼人和村民两大阵营，通过白天投票和夜晚行动来决定胜负。",
    playerCount: { min: 6, max: 18, optimal: [8, 9, 10, 11, 12] },
    tags: ["推理", "角色扮演", "语言"],
    difficulty: "medium",
    duration: 30,
    status: "active"
  },
  {
    name: "阿瓦隆",
    description: "一款隐藏身份的团队游戏，好人阵营需要完成任务，而坏人阵营则要破坏任务。",
    playerCount: { min: 5, max: 10, optimal: [7, 8, 9] },
    tags: ["推理", "团队", "策略"],
    difficulty: "medium",
    duration: 20,
    status: "active"
  },
  {
    name: "谁是卧底",
    description: "简单有趣的语言游戏，玩家通过描述自己的词语来找出卧底。",
    playerCount: { min: 4, max: 12, optimal: [6, 7, 8] },
    tags: ["语言", "推理", "休闲"],
    difficulty: "easy",
    duration: 15,
    status: "active"
  },
  {
    name: "三国杀",
    description: "基于三国历史的卡牌游戏，玩家扮演不同的武将，使用各种策略卡牌进行对战。",
    playerCount: { min: 2, max: 10, optimal: [5, 6, 7, 8] },
    tags: ["卡牌", "策略", "角色扮演"],
    difficulty: "medium",
    duration: 40,
    status: "active"
  },
  {
    name: "剧本杀",
    description: "沉浸式角色扮演推理游戏，玩家根据剧本扮演角色，通过搜证和推理找出真相。",
    playerCount: { min: 4, max: 8, optimal: [5, 6, 7] },
    tags: ["推理", "角色扮演", "剧情"],
    difficulty: "hard",
    duration: 180,
    status: "active"
  },
  {
    name: "UNO",
    description: "经典的快节奏卡牌游戏，玩家需要尽快出完手中的牌。",
    playerCount: { min: 2, max: 10, optimal: [4, 5, 6] },
    tags: ["卡牌", "休闲", "快节奏"],
    difficulty: "easy",
    duration: 20,
    status: "active"
  },
  {
    name: "德州扑克",
    description: "世界上最流行的扑克游戏之一，结合运气和策略。",
    playerCount: { min: 2, max: 10, optimal: [6, 7, 8, 9] },
    tags: ["卡牌", "策略", "博弈"],
    difficulty: "medium",
    duration: 60,
    status: "active"
  },
  {
    name: "卡坦岛",
    description: "经典的资源管理和建设游戏，玩家通过收集资源来建设自己的领地。",
    playerCount: { min: 3, max: 4, optimal: [3, 4] },
    tags: ["策略", "资源管理", "建设"],
    difficulty: "medium",
    duration: 90,
    status: "active"
  }
];

// 插入数据
async function seedData() {
  try {
    // 清空现有数据
    await Game.deleteMany({});
    console.log('已清空现有游戏数据');

    // 插入测试数据
    const result = await Game.insertMany(testGames);
    console.log(`成功添加 ${result.length} 个测试游戏`);

    // 显示添加的游戏
    result.forEach(game => {
      console.log(`- ${game.name} (${game.playerCount.min}-${game.playerCount.max}人)`);
    });

    // 添加管理员数据
    await Admin.deleteMany({});
    console.log('已清空现有管理员数据');
    const admins = await Admin.insertMany(testAdmins);
    console.log(`成功添加 ${admins.length} 个管理员`);
    admins.forEach(a => console.log(`- ${a.nickname} (${a.openid})`));

    process.exit(0);
  } catch (error) {
    console.error('添加数据失败:', error);
    process.exit(1);
  }
}

seedData();
