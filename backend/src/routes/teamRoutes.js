const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { ensureAuthenticated } = require('../middleware/auth');
const { validateCreateTeam, validateAddMember } = require('../middleware/validation');

// Protect all team routes with ensureAuthenticated
router.use(ensureAuthenticated);

// POST /teams - Create new team
router.post('/', validateCreateTeam, teamController.createTeam);

// GET /teams - Get all teams current user belongs to
router.get('/', teamController.getTeams);

// POST /teams/:id/members - Add a member to a team
router.post('/:id/members', validateAddMember, teamController.addTeamMember);

// GET /teams/:id/members - Get all members of a team
router.get('/:id/members', teamController.getTeamMembers);

module.exports = router;
