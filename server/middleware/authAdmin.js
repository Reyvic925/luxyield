const jwt = require('jsonwebtoken');

// Admin authentication middleware. This middleware is also used by routers
// mounted outside /api/admin, so it must decode the token itself.
module.exports = (req, res, next) => {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(authorization.slice(7), process.env.JWT_SECRET);
    const user = decoded.user || decoded;
    req.user = {
      ...user,
      id: user.id || user._id,
      role: user.role
    };
    req.admin = req.user;
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
  next();
};
