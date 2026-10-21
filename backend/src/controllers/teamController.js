const db = require('../config/db');

/**
 * Create a new team and automatically add creator to team_members
 * POST /teams
 */
async function createTeam(req, res) {
  const client = await db.pool.connect();
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    await client.query('BEGIN');

    // Insert team
    const teamResult = await client.query(
      `INSERT INTO teams (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, created_by, created_at`,
      [name.trim(), description ? description.trim() : null, userId]
    );

    const team = teamResult.rows[0];

    // Automatically add creator to team_members
    await client.query(
      `INSERT INTO team_members (team_id, user_id)
       VALUES ($1, $2)`,
      [team.id, userId]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Team created successfully.',
      team: {
        ...team,
        is_owner: true,
        member_count: 1,
        task_count: 0,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[createTeam Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Server error creating team.',
    });
  } finally {
    client.release();
  }
}

/**
 * Get all teams the logged-in user belongs to
 * GET /teams
 */
async function getTeams(req, res) {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        t.id, 
        t.name, 
        t.description, 
        t.created_by, 
        t.created_at,
        u.name as creator_name,
        (t.created_by = $1) as is_owner,
        COUNT(DISTINCT tm2.user_id)::int as member_count,
        COUNT(DISTINCT tk.id)::int as task_count
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      JOIN users u ON t.created_by = u.id
      LEFT JOIN team_members tm2 ON t.id = tm2.team_id
      LEFT JOIN tasks tk ON t.id = tk.team_id
      WHERE tm.user_id = $1
      GROUP BY t.id, u.name
      ORDER BY t.created_at DESC
    `;

    const result = await db.query(query, [userId]);

    return res.status(200).json({
      success: true,
      teams: result.rows,
    });
  } catch (err) {
    console.error('[getTeams Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving teams.',
    });
  }
}

/**
 * Add member to team by user email or ID
 * POST /teams/:id/members
 */
async function addTeamMember(req, res) {
  try {
    const teamId = parseInt(req.params.id, 10);
    const { email, userId } = req.body;
    const currentUserId = req.user.id;

    // 1. Verify team exists
    const teamRes = await db.query('SELECT id, name FROM teams WHERE id = $1', [teamId]);
    if (teamRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    // 2. Verify current user is a member of this team
    const authCheck = await db.query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, currentUserId]
    );
    if (authCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not a member of this team.',
      });
    }

    // 3. Locate target user
    let targetUser;
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const userRes = await db.query(
        'SELECT id, name, email FROM users WHERE LOWER(email) = $1',
        [normalizedEmail]
      );
      if (userRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `User with email "${email}" was not found. Please ask them to register first.`,
        });
      }
      targetUser = userRes.rows[0];
    } else if (userId) {
      const userRes = await db.query(
        'SELECT id, name, email FROM users WHERE id = $1',
        [parseInt(userId, 10)]
      );
      if (userRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${userId} was not found.`,
        });
      }
      targetUser = userRes.rows[0];
    }

    // 4. Check if target user is already in the team
    const existingMember = await db.query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, targetUser.id]
    );

    if (existingMember.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `User "${targetUser.name}" (${targetUser.email}) is already a member of this team.`,
      });
    }

    // 5. Insert member
    const insertRes = await db.query(
      `INSERT INTO team_members (team_id, user_id)
       VALUES ($1, $2)
       RETURNING id, team_id, user_id, created_at`,
      [teamId, targetUser.id]
    );

    return res.status(201).json({
      success: true,
      message: `User ${targetUser.name} added to team successfully.`,
      member: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        joined_at: insertRes.rows[0].created_at,
      },
    });
  } catch (err) {
    console.error('[addTeamMember Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Server error adding member to team.',
    });
  }
}

/**
 * Get all members of a specific team
 * GET /teams/:id/members
 */
async function getTeamMembers(req, res) {
  try {
    const teamId = parseInt(req.params.id, 10);
    const currentUserId = req.user.id;

    // Verify current user belongs to the team
    const memberCheck = await db.query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, currentUserId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You must be a member of this team to view its members.',
      });
    }

    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        tm.created_at as joined_at,
        (t.created_by = u.id) as is_owner
      FROM users u
      JOIN team_members tm ON u.id = tm.user_id
      JOIN teams t ON t.id = tm.team_id
      WHERE tm.team_id = $1
      ORDER BY is_owner DESC, u.name ASC
    `;

    const result = await db.query(query, [teamId]);

    return res.status(200).json({
      success: true,
      team_id: teamId,
      members: result.rows,
    });
  } catch (err) {
    console.error('[getTeamMembers Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving team members.',
    });
  }
}

module.exports = {
  createTeam,
  getTeams,
  addTeamMember,
  getTeamMembers,
};
