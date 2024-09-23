const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');

router.get('/', workflowController.getAllWorkflows);
router.get('/:workflowId', workflowController.getWorkflow);

module.exports = router;