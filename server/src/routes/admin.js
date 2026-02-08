const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

router.post('/login', async (req, res) => {
  try {
    const { openid, nickname } = req.body;
    
    if (!openid) {
      return res.status(400).json({ error: 'openid不能为空' });
    }
    
    let admin = await Admin.findOne({ openid });
    if (!admin) {
      return res.status(403).json({ error: '无管理员权限' });
    }
    
    if (nickname && admin.nickname !== nickname) {
      admin.nickname = nickname;
      await admin.save();
    }
    
    const token = jwt.sign({ id: admin._id, openid: admin.openid }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      admin: { id: admin._id, openid: admin.openid, nickname: admin.nickname, role: admin.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/check', auth, async (req, res) => {
  res.json({
    admin: { id: req.admin._id, openid: req.admin.openid, nickname: req.admin.nickname, role: req.admin.role }
  });
});

module.exports = router;
