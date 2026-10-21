const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { ensureAuthenticated } = require('../middleware/auth');
const { validateCreateTask, validateUpdateTask } = require('../middleware/validation');

// Protect all task routes with ensureAuthenticated
router.use(ensureAuthenticated);

// POST /tasks - Create a new task
router.post('/', validateCreateTask, taskController.createTask);

// GET /tasks - List tasks (query by team_id, assigned_to, status, search)
router.get('/', taskController.getTasks);

// PUT /tasks/:id - Update task details, status, or assignee
router.put('/:id', validateUpdateTask, taskController.updateTask);

// DELETE /tasks/:id - Delete a task
router.delete('/:id', taskController.deleteTask);

module.exports = router;
