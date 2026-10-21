const db = require('../config/db');

/**
 * Middleware to ensure the request is authenticated via session
 */
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Unauthorized. Please log in to access this resource.',
  });
}

/**
 * Middleware to check if current user is a member of the target team
 * @param {string} source - 'params' or 'body'
 * @param {string} field - parameter name ('id', 'team_id', etc.)
 */
function ensureTeamMember(source = 'params', field = 'id') {
  return async (req, res, next) => {
    try {
      const teamId = req[source]?.[field];
      if (!teamId) {
        return res.status(400).json({
          success: false,
          message: `Team identifier missing from ${source}.${field}`,
        });
      }

      const memberCheck = await db.query(
        'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
        [teamId, req.user.id]
      );

      if (memberCheck.rowCount === 0) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. You are not a member of this team.',
        });
      }

      req.teamId = parseInt(teamId, 10);
      next();
    } catch (err) {
      console.error('[ensureTeamMember Error]', err);
      return res.status(500).json({
        success: false,
        message: 'Server error verifying team membership.',
      });
    }
  };
}

module.exports = {
  ensureAuthenticated,
  ensureTeamMember,
};
