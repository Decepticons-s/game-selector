# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
- 始终使用中文
## Project Overview

**今天玩什么** (What to Play Today) - A WeChat Mini Program for randomly selecting board games based on player count. The project consists of:
- **WeChat Mini Program frontend** (`miniprogram/`) - Native WeChat Mini Program
- **Local Node.js backend** (`server/`) - Express + MongoDB for local development
- **Future migration path** to WeChat Cloud Development (CloudBase) for production

## Development Commands

### Server (Node.js Backend)

```bash
cd server
npm install              # Install dependencies
npm run dev             # Start development server with hot reload (nodemon)
npm start               # Start production server
```

The server runs on `http://localhost:3000` by default.

### Database (MongoDB)

```bash
# Start MongoDB service (macOS)
brew services start mongodb-community

# Stop MongoDB service
brew services stop mongodb-community

# Connect to MongoDB shell
mongosh

# In mongosh, use the game-picker database
use game-picker
```

### WeChat Mini Program

Open the project in **WeChat Developer Tools**:
1. Set `miniprogramRoot` to `miniprogram/`
2. Enable "不校验合法域名" (Don't verify domain) in settings for local API testing
3. The mini program will connect to `http://localhost:3000/api`

## Architecture

### Two-Tier Architecture

**Local Development Environment:**
```
WeChat Mini Program → Local Express Server → MongoDB
                                           → Local File Storage (uploads/)
```

**Production Environment (Future):**
```
WeChat Mini Program → Cloud Functions → Cloud Database
                                     → Cloud Storage
```

### Key Architectural Patterns

1. **API Layer Abstraction**: `miniprogram/utils/api.js` wraps all HTTP requests with token management, making it easy to switch between local and cloud APIs later.

2. **JWT Authentication**: Admin routes use JWT tokens stored in WeChat's local storage. The `auth` middleware validates tokens on protected endpoints.

3. **Mongoose Models**: Data models in `server/src/models/` define the schema for games and admins. These models will inform the cloud database schema during migration.

4. **File Upload Strategy**:
   - Local: Multer middleware saves to `server/uploads/` and returns local URLs
   - Future cloud: Will use `wx.cloud.uploadFile()` to cloud storage

## Data Models

### Game Schema (`server/src/models/Game.js`)

```javascript
{
  name: String,              // Game name
  description: String,       // Game description
  playerCount: {
    min: Number,            // Minimum players
    max: Number,            // Maximum players
    optimal: [Number]       // Optimal player counts
  },
  tags: [String],           // Game tags (e.g., "推理", "角色扮演")
  coverImage: String,       // Cover image URL
  images: [String],         // Detail images
  videos: [{               // Tutorial videos
    url: String,
    title: String,
    duration: Number
  }],
  difficulty: String,       // "easy" | "medium" | "hard"
  duration: Number,         // Game duration in minutes
  status: String,          // "active" | "inactive"
  timestamps: true         // createdAt, updatedAt
}
```

### Admin Schema (`server/src/models/Admin.js`)

```javascript
{
  openid: String,          // WeChat openid (unique)
  nickname: String,        // Admin nickname
  role: String,           // "admin"
  timestamps: true        // createdAt, updatedAt
}
```

## API Endpoints

All endpoints are prefixed with `/api`.

### Public Endpoints

- `GET /games` - Get game list (optional query: `?playerCount=8`)
- `GET /games/:id` - Get game details
- `GET /games/random` - Get random game (optional query: `?playerCount=8`)
- `GET /health` - Health check
- `POST /admin/login` - Admin login (body: `{openid, nickname}`)

### Protected Endpoints (Require JWT Token)

- `POST /games` - Add new game
- `PUT /games/:id` - Update game
- `DELETE /games/:id` - Delete game
- `GET /admin/check` - Verify admin status
- `POST /upload/image` - Upload image (multipart/form-data)
- `POST /upload/video` - Upload video (multipart/form-data)

## Mini Program Structure

### Pages

- `pages/index/` - Main page with spinning wheel for game selection
- `pages/detail/` - Game detail page with images and videos
- `pages/list/` - Game list with filtering by player count
- `pages/admin/login/` - Admin login page
- `pages/admin/manage/` - Admin game management list
- `pages/admin/edit/` - Add/edit game form

### Key Files

- `miniprogram/utils/api.js` - Centralized API client with token management
- `miniprogram/app.json` - App configuration with pages and tabBar
- `project.config.json` - WeChat Mini Program project settings

## Environment Configuration

The server uses environment variables from `server/.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/game-picker
JWT_SECRET=your-secret-key-change-in-production
UPLOAD_PATH=./uploads
```

**Important**: Never commit `.env` to version control. The JWT_SECRET should be changed in production.

## Common Development Workflows

### Adding a New Game API Endpoint

1. Add route handler in `server/src/routes/games.js`
2. Add corresponding method in `miniprogram/utils/api.js`
3. If admin-only, add `auth` middleware to the route

### Testing the API

```bash
# Health check
curl http://localhost:3000/health

# Get all games
curl http://localhost:3000/api/games

# Get games for 8 players
curl http://localhost:3000/api/games?playerCount=8

# Get random game
curl http://localhost:3000/api/games/random?playerCount=8
```

### Adding Test Data to MongoDB

```javascript
// In mongosh
use game-picker

db.games.insertOne({
  name: "狼人杀",
  description: "经典的角色扮演推理游戏",
  playerCount: { min: 6, max: 18, optimal: [8, 9, 10, 11, 12] },
  tags: ["推理", "角色扮演", "语言"],
  coverImage: "",
  images: [],
  videos: [],
  difficulty: "medium",
  duration: 30,
  status: "active"
})
```

## Migration to Cloud Development

When ready to migrate to WeChat Cloud Development:

1. **Enable Cloud Development** in WeChat Mini Program console
2. **Create Cloud Functions** in `cloudfunctions/` directory (getGames, addGame, updateGame, deleteGame, checkAdmin)
3. **Migrate Data**: Export MongoDB data and import to cloud database
4. **Upload Files**: Move files from `server/uploads/` to cloud storage
5. **Update API Client**: Modify `miniprogram/utils/api.js` to use `wx.cloud.callFunction()` instead of `wx.request()`
6. **Update File URLs**: Replace local URLs with cloud file IDs (`cloud://...`)

## Important Notes

- The mini program uses **native WeChat syntax**, not frameworks like Taro or uni-app
- Admin access is controlled by **openid whitelist** in the database - manually add admin openids to the `admins` collection
- File uploads are limited to **50MB** per file
- The spinning wheel algorithm filters games by player count before random selection
- All timestamps use MongoDB's automatic `createdAt` and `updatedAt` fields

## Project Planning Documents

Detailed architecture and implementation plans are in the `plans/` directory:
- `plans/游戏抽取小程序架构方案.md` - Overall architecture design
- `plans/阶段一-本地环境搭建.md` - Phase 1 implementation guide
