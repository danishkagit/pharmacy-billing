const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const header = req.header('Authorization');
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('branch company');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'User not found or inactive' });
    }
    req.user = user;
    req.company = user.company;
    req.branch = user.branch;
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && !req.user.permissions.allBranches) {
      req.activeBranch = user.branch;
    }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

module.exports = auth;
