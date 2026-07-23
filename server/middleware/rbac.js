const rbac = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: `Access denied. Required role: ${roles.join(', ')}` });
    }
    next();
  };
};

const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (req.user.role === 'owner' || req.user.role === 'admin') {
      return next();
    }
    if (req.user.permissions && req.user.permissions[permission]) {
      return next();
    }
    return res.status(403).json({ success: false, error: `Access denied. Missing permission: ${permission}` });
  };
};

module.exports = { rbac, hasPermission };
