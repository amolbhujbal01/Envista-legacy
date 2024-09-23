const dbService = require('../services/dbService');

const getWorkflow = async (req, res) => {
    const workflowId = req.params.workflowId;

    try {
        // Query to get workflow details
        const workflowDetailsQuery = `
            SELECT status, name, description, conditionsTreated, duration, noOfStages
            FROM Workflow
            WHERE workflow_id = ?
        `;

        const workflowDetails = await dbService.query(workflowDetailsQuery, [workflowId]);

        if (workflowDetails.length === 0) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        const { status, name, description, conditionsTreated, duration, noOfStages } = workflowDetails[0];

        // Query to get stages and steps
        const workflowQuery = `
            SELECT s.name AS stage_name, s.isSkippable, si.name AS step_name
            FROM Stage s
            JOIN StageItem si ON s.stage_id = si.stage_id
            WHERE s.workflow_id = ?
            ORDER BY s.sequence_id, si.sequence_id
        `;

        const workflowData = await dbService.query(workflowQuery, [workflowId]);

        const stages = [];
        let currentStage = null;

        workflowData.forEach(row => {
            if (!currentStage || currentStage.name !== row.stage_name) {
                if (currentStage) {
                    stages.push(currentStage);
                }
                currentStage = {
                    name: row.stage_name,
                    steps: [],
                    skippable: !!row.isSkippable
                };
            }
            currentStage.steps.push({ name: row.step_name });
        });

        if (currentStage) {
            stages.push(currentStage);
        }

        res.status(200).json({
            status,
            name,
            description,
            conditionsTreated,
            duration,
            noOfStages,
            stages
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch workflow data' });
    }
};


const getAllWorkflows = async (req, res) => {
    // Define allowed columns as an enum
    const allowedColumns = {
        workflow_id: 'workflow_id',
        name: 'name',
        description: 'description',
        conditionsTreated: 'conditionsTreated',
        duration: 'duration',
        noOfStages: 'noOfStages',
        status: 'status'
    };

    const queryParams = req.query;

    try {
        let baseQuery = `
            SELECT workflow_id, name, description, conditionsTreated, duration, noOfStages, status, created_at
            FROM Workflow
        `;
        
        let countQuery = `
            SELECT COUNT(*) as count
            FROM Workflow
        `;
        
        let queryValues = [];
        let countValues = [];
        let conditions = [];

        // Add additional filters based on query parameters
        for (const param in queryParams) {
            if (param !== 'page' && param !== 'limit') {
                if (allowedColumns[param]) {
                    conditions.push(`${allowedColumns[param]} LIKE ?`);
                    queryValues.push(`%${queryParams[param]}%`);
                    countValues.push(`%${queryParams[param]}%`);
                } else {
                    return res.status(400).json({ error: `Invalid parameter: ${param}` });
                }
            }
        }

        if (conditions.length > 0) {
            const conditionsStr = conditions.join(' AND ');
            baseQuery += ' WHERE ' + conditionsStr;
            countQuery += ' WHERE ' + conditionsStr;
        }

        // Add order by created_at in descending order
        baseQuery += ' ORDER BY created_at';

        // Get total count of records
        const countResults = await dbService.query(countQuery, countValues);
        const totalRecords = countResults[0].count;

        // Add pagination
        const page = parseInt(queryParams.page) || null;
        const limit = parseInt(queryParams.limit) || null;

        let pagination = {};

        if (page !== null && limit !== null) {
            const offset = (page - 1) * limit;
            baseQuery += ` LIMIT ? OFFSET ?`;
            queryValues.push(limit, offset);

            const totalPages = Math.ceil(totalRecords / limit);
            pagination = {
                totalRecords,
                totalPages,
                currentPage: page,
                pageSize: limit
            };
        }

        const workflowsData = await dbService.query(baseQuery, queryValues);
        
        res.json({
            data: workflowsData,
            pagination: page !== null && limit !== null ? pagination : undefined
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch workflows data' });
    }
};


module.exports = {
    getWorkflow,
    getAllWorkflows
};
