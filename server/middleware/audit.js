const AuditLog = require('../models/AuditLog');

const audit = (model) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300 && body.success !== false) {
        const action = req.method === 'POST' ? 'create' : req.method === 'PUT' || req.method === 'PATCH' ? 'update' : 'delete';
        if (action !== 'delete' || (body.data && body.data._id)) {
          try {
            await AuditLog.create({
              action,
              model,
              recordId: body.data?._id || body._id,
              description: `${action} ${model}`,
              after: action === 'create' ? body.data || body : undefined,
              userId: req.user?._id,
              userName: req.user?.name,
              userRole: req.user?.role,
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              branch: req.activeBranch || req.branch?._id,
              companyRef: req.company?._id
            });
          } catch (err) {
            console.error('Audit log error:', err.message);
          }
        }
      }
      return originalJson(body);
    };
    if (req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
      const Model = require(`../models/${model}`);
      if (Model) {
        try {
          req._auditBefore = await Model.findById(req.params.id).lean();
        } catch (e) { }
      }
    }
    next();
  };
};

module.exports = { audit };
