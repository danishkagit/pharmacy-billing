const branchFilter = (req, res, next) => {
  if (req.user && req.user.role !== 'owner' && !req.user.permissions?.allBranches) {
    req.activeBranch = req.user.branch?._id || req.user.branch;
  }
  if (req.query.branch) {
    req.activeBranch = req.query.branch;
  }
  next();
};

const branchQuery = (field = 'branch') => {
  return (req, res, next) => {
    if (req.activeBranch) {
      if (!req.query) req.query = {};
      if (!req.query[field]) {
        const queryField = {};
        queryField[field] = req.activeBranch.toString();
        res.locals.branchFilter = queryField;
      }
    }
    next();
  };
};

module.exports = { branchFilter, branchQuery };
