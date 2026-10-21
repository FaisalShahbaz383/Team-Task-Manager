const db = require('../config/db');

/**
 * Create a new task under a team
 * POST /tasks
 */
async function createTask(req, res) {
  try {
    const { title, description, status = 'Pending', due_date, team_id, assigned_to } = req.body;
    const userId = req.user.id;
    const teamIdNum = parseInt(team_id, 10);

    // 1. Ensure current user is a member of the target team
    const membershipCheck = await db.query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamIdNum, userId]
    );

    if (membershipCheck.rowCount === 0) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not a member of this team.',
      });
    }

    // 2. If assigned_to is specified, ensure assignee is also a member of this team
    let assignedUserId = assigned_to ? parseInt(assigned_to, 10) : null;
    if (assignedUserId) {
      const assigneeCheck = await db.query(
        'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
        [teamIdNum, assignedUserId]
      );

      if (assigneeCheck.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'The assigned user must be a member of this team.',
        });
      }
    }

    // 3. Insert task
    const insertQuery = `
      INSERT INTO tasks (title, description, status, due_date, team_id, assigned_to, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, description, status, due_date, team_id, assigned_to, created_by, created_at
    `;

    const result = await db.query(insertQuery, [
      title.trim(),
      description ? description.trim() : null,
      status,
      due_date ? new Date(due_date) : null,
      teamIdNum,
      assignedUserId,
      userId,
    ]);

    const createdTask = result.rows[0];

    // 4. Retrieve complete task with joined user names for immediate client rendering
    const fullTaskQuery = `
      SELECT 
        tk.id,
        tk.title,
        tk.description,
        tk.status,
        tk.due_date,
        tk.team_id,
        t.name as team_name,
        tk.assigned_to,
        u_assigned.name as assignee_name,
        u_assigned.email as assignee_email,
        tk.created_by,
        u_creator.name as creator_name,
        tk.created_at
      FROM tasks tk
      JOIN teams t ON tk.team_id = t.id
      JOIN users u_creator ON tk.created_by = u_creator.id
      LEFT JOIN users u_assigned ON tk.assigned_to = u_assigned.id
      WHERE tk.id = $1
    `;

    const fullTaskRes = await db.query(fullTaskQuery, [createdTask.id]);

    return res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task: fullTaskRes.rows[0],
    });
  } catch (err) {
    console.error('[createTask Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Server error creating task.',
    });
  }
}

/**
 * Get tasks with optional filtering by team_id or assigned_to
 * GET /tasks
 */
async function getTasks(req, res) {
  try {
    const userId = req.user.id;
    const { team_id, assigned_to, status, search } = req.query;

    const conditions = [];
    const params = [];

    // Filter by team_id if provided; otherwise restrict to teams the user belongs to
    if (team_id) {
      const teamIdNum = parseInt(team_id, 10);
      // Ensure user belongs to this team
      const memberCheck = await db.query(
        'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
        [teamIdNum, userId]
      );

      if (memberCheck.rowCount === 0) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. You are not a member of the requested team.',
        });
      }

      params.push(teamIdNum);
      conditions.push(`tk.team_id = $${params.length}`);
    } else {
      params.push(userId);
      conditions.push(`tk.team_id IN (SELECT team_id FROM team_members WHERE user_id = $${params.length})`);
    }

    // Filter by assigned_to
    if (assigned_to !== undefined && assigned_to !== '') {
      if (assigned_to === 'unassigned') {
        conditions.push('tk.assigned_to IS NULL');
      } else {
        const assignedIdNum = parseInt(assigned_to, 10);
        params.push(assignedIdNum);
        conditions.push(`tk.assigned_to = $${params.length}`);
      }
    }

    // Filter by status
    if (status && ['Pending', 'In Progress', 'Completed'].includes(status)) {
      params.push(status);
      conditions.push(`tk.status = $${params.length}`);
    }

    // Optional search by title or description
    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(LOWER(tk.title) LIKE $${params.length} OR LOWER(tk.description) LIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        tk.id,
        tk.title,
        tk.description,
        tk.status,
        tk.due_date,
        tk.team_id,
        t.name as team_name,
        tk.assigned_to,
        u_assigned.name as assignee_name,
        u_assigned.email as assignee_email,
        tk.created_by,
        u_creator.name as creator_name,
        tk.created_at
      FROM tasks tk
      JOIN teams t ON tk.team_id = t.id
      JOIN users u_creator ON tk.created_by = u_creator.id
      LEFT JOIN users u_assigned ON tk.assigned_to = u_assigned.id
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN tk.due_date IS NULL THEN 1 
          ELSE 0 
        END,
        tk.due_date ASC, 
        tk.created_at DESC
    `;

    const result = await db.query(query, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      tasks: result.rows,
    });
  } catch (err) {
    console.error('[getTasks Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving tasks.',
    });
  }
}

/**
 * Update an existing task
 * PUT /tasks/:id
 */
async function updateTask(req, res) {
  try {
    const taskId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { title, description, status, due_date, assigned_to } = req.body;

    // 1. Verify task exists
    const taskCheck = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    const currentTask = taskCheck.rows[0];

    // 2. Ensure current user is a member of the task's team
    const memberCheck = await db.query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
      [currentTask.team_id, userId]
    );

    if (memberCheck.rowCount === 0) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not a member of the team this task belongs to.',
      });
    }

    // 3. If assigned_to is changed, verify new assignee belongs to the team
    let newAssignedTo = currentTask.assigned_to;
    if (assigned_to !== undefined) {
      if (assigned_to === null || assigned_to === '' || assigned_to === 'unassigned') {
        newAssignedTo = null;
      } else {
        const targetUserId = parseInt(assigned_to, 10);
        const assigneeCheck = await db.query(
          'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
          [currentTask.team_id, targetUserId]
        );

        if (assigneeCheck.rowCount === 0) {
          return res.status(400).json({
            success: false,
            message: 'The assigned user must be a member of this team.',
          });
        }
        newAssignedTo = targetUserId;
      }
    }

    // Prepare updated values
    const newTitle = title !== undefined ? title.trim() : currentTask.title;
    const newDescription = description !== undefined ? (description ? description.trim() : null) : currentTask.description;
    const newStatus = status !== undefined ? status : currentTask.status;
    let newDueDate = currentTask.due_date;
    if (due_date !== undefined) {
      newDueDate = due_date ? new Date(due_date) : null;
    }

    // Update the task
    const updateQuery = `
      UPDATE tasks 
      SET 
        title = $1,
        description = $2,
        status = $3,
        due_date = $4,
        assigned_to = $5
      WHERE id = $6
      RETURNING *
    `;

    await db.query(updateQuery, [
      newTitle,
      newDescription,
      newStatus,
      newDueDate,
      newAssignedTo,
      taskId,
    ]);

    // Retrieve complete updated task with names
    const fullTaskQuery = `
      SELECT 
        tk.id,
        tk.title,
        tk.description,
        tk.status,
        tk.due_date,
        tk.team_id,
        t.name as team_name,
        tk.assigned_to,
        u_assigned.name as assignee_name,
        u_assigned.email as assignee_email,
        tk.created_by,
        u_creator.name as creator_name,
        tk.created_at
      FROM tasks tk
      JOIN teams t ON tk.team_id = t.id
      JOIN users u_creator ON tk.created_by = u_creator.id
      LEFT JOIN users u_assigned ON tk.assigned_to = u_assigned.id
      WHERE tk.id = $1
    `;

    const fullRes = await db.query(fullTaskQuery, [taskId]);

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      task: fullRes.rows[0],
    });
  } catch (err) {
    console.error('[updateTask Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Server error updating task.',
    });
  }
}

/**
 * Delete a task
 * DELETE /tasks/:id
 */
async function deleteTask(req, res) {
  try {
    const taskId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // Verify task exists
    const taskCheck = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    const task = taskCheck.rows[0];

    // Ensure user belongs to the task's team
    const memberCheck = await db.query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
      [task.team_id, userId]
    );

    if (memberCheck.rowCount === 0) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not a member of the team this task belongs to.',
      });
    }

    await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
      taskId,
    });
  } catch (err) {
    console.error('[deleteTask Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting task.',
    });
  }
}

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
};
