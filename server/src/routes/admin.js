const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const https = require('https');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

// 通过微信 code 换取 openid 登录
router.post('/login-by-code', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'code不能为空' });
    }

    let openid;
    const appid = process.env.WX_APPID;
    const secret = process.env.WX_SECRET;

    if (appid && secret) {
      // 调用微信 jscode2session 接口
      const wxRes = await new Promise((resolve, reject) => {
        const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
        https.get(url, (resp) => {
          let data = '';
          resp.on('data', chunk => data += chunk);
          resp.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });

      if (wxRes.errcode) {
        return res.status(400).json({ error: '微信登录失败', detail: wxRes.errmsg });
      }
      openid = wxRes.openid;
    } else {
      // 本地开发 fallback：没有配置微信 appid/secret 时使用测试 openid
      console.warn('未配置 WX_APPID/WX_SECRET，使用测试 openid');
      openid = 'test-admin-openid';
    }

    const admin = await Admin.findOne({ openid });
    if (!admin) {
      return res.status(403).json({ error: '无管理员权限' });
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
