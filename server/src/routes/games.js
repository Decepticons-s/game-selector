const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { playerCount, status = 'active' } = req.query;
    let query = { status };
    
    if (playerCount) {
      const count = parseInt(playerCount);
      query['playerCount.min'] = { $lte: count };
      query['playerCount.max'] = { $gte: count };
    }
    
    const games = await Game.find(query);
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/random', async (req, res) => {
  try {
    const { playerCount } = req.query;
    let query = { status: 'active' };
    
    if (playerCount) {
      const count = parseInt(playerCount);
      query['playerCount.min'] = { $lte: count };
      query['playerCount.max'] = { $gte: count };
    }
    
    const games = await Game.find(query);
    if (games.length === 0) {
      return res.status(404).json({ error: '没有符合条件的游戏' });
    }
    
    const randomGame = games[Math.floor(Math.random() * games.length)];
    res.json(randomGame);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: '游戏不存在' });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const game = new Game(req.body);
    await game.save();
    res.status(201).json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const game = await Game.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!game) {
      return res.status(404).json({ error: '游戏不存在' });
    }
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);
    if (!game) {
      return res.status(404).json({ error: '游戏不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
