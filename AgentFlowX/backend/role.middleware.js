function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: "unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "forbidden",
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
}

module.exports = { allowRoles };
