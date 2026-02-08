const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '未授权访问' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findOne({ _id: decoded.id });

    if (!admin) {
      return res.status(401).json({ error: '管理员不存在' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ error: '认证失败' });
  }
};

module.exports = auth;
