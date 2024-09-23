const dbService = require("../services/dbService");
const { getPresignedUrl } = require("../services/s3Service");
const { updateStageStatus } = require("./updateStatusesHelper");

const executeQuery = async (query, values) => {
  try {
    return await dbService.query(query, values);
  } catch (err) {
    console.error("Database error:", err);
    throw new Error("Oops, Something went wrong!");
  }
};

const getServiceRequestsCount = async (req, res) => {
    const { user } = req;
    const lab_id = req.params.lab_id;
    const practice_id = req.params.practice_id;

    try {
        // Get all the counts
        const countersQuery = `
            SELECT 
                COUNT(*) AS total_service_requests,
                COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS pending_requests,
                COUNT(CASE WHEN status = 'DESIGN_PHASE' THEN 1 END) AS design_phase_requests,
                COUNT(CASE WHEN status = 'SHIPPED' THEN 1 END) AS shipped_requests,
                COUNT(CASE WHEN status = 'ON_HOLD' THEN 1 END) AS on_hold_requests
            FROM ServiceRequest WHERE lab_id = ?
        `;

        const results = await executeQuery(countersQuery, [parseInt(lab_id)]);
        // console.log('results:', results);

        const statusMapping = {
            total_service_requests: 'Total',
            pending_requests: 'Pending',
            design_phase_requests: 'Design Phase',
            shipped_requests: 'Shipped',
            on_hold_requests: 'On Hold'
        };
        
        const transformedResults = results.map(item => {
            const transformedItem = {};
            
            for (const key in item) {
                transformedItem[key] = {
                status: statusMapping[key],
                count: item[key]
                };
            }
            
            return transformedItem;
        });
          
        // console.log('result:', transformedResults);
        res.status(200).json(transformedResults);
    } catch (err) {
        console.log(err);
        res.status(500).send("Oops something went wrong, you can try again later");
    }
};

const getServiceRequests = async (req, res) => {
    const { user } = req;
    const lab_id = req.params.lab_id;
    const practice_id = req.params.practice_id;
    const queryParams = req.query;

    // Define allowed columns as an enum
    const allowedColumns = {
        patient_name: 'patient_name',
        service_request_id: 'service_request_id',
        status: 'status',
        search: 'search'
    };

    try {
        // Get the count
        let counterQuery = `
            SELECT 
                COUNT(*) AS total_count
            FROM ServiceRequest 
            WHERE lab_id = ?
        `;
        
        // Get all Service Requests
        let query = `
            SELECT 
                service_request_id, 
                status,
                DATE_FORMAT(created_date, '%m-%d-%Y') AS date,
                patient_name,
                requestor_name,
                practice_id,
                practice_name,
                treatment_journey_id
            FROM 
                ServiceRequest
            WHERE lab_id = ?
        `;
        
        const queryValues = [parseInt(lab_id)];
        const countValues = [...queryValues];

        // Extract date filters from query parameters
        const created_start_date = queryParams.created_start_date || null;
        const created_end_date = queryParams.created_end_date || null;

        // Add additional filters based on query parameters
        for (const param of Object.keys(queryParams)) {
            if (!['page', 'limit', 'created_start_date', 'created_end_date', 'search'].includes(param)) {
                if (allowedColumns[param]) {
                    query += ` AND ${param} LIKE ?`;
                    queryValues.push(`%${queryParams[param]}%`);
                    counterQuery += ` AND ${param} LIKE ?`;
                    countValues.push(`%${queryParams[param]}%`);
                } else {
                    return res.status(400).json({ error: `Invalid parameter: ${param}` });
                }
            }
        }

        const search = queryParams.search || null;
        
        if(search){
            query += ` AND patient_name LIKE ?`;
            queryValues.push(`%${queryParams.search}%`);
            counterQuery += ` AND patient_name LIKE ?`;
            countValues.push(`%${queryParams.search}%`);
        }
        
        // Add date range filters for created_date
        if (created_start_date && created_end_date) {
            query += ` AND created_date BETWEEN ? AND ?`;
            queryValues.push(created_start_date, created_end_date);
            counterQuery += ` AND created_date BETWEEN ? AND ?`;
            countValues.push(created_start_date, created_end_date);
        } else if (created_start_date) {
            query += ` AND created_date >= ?`;
            queryValues.push(created_start_date);
            counterQuery += ` AND created_date >= ?`;
            countValues.push(created_start_date);
        } else if (created_end_date) {
            query += ` AND created_date <= ?`;
            queryValues.push(created_end_date);
            counterQuery += ` AND created_date <= ?`;
            countValues.push(created_end_date);
        }

        const results = await dbService.query(counterQuery, countValues);

        // Default sorting by created_at in descending order
        query += ` ORDER BY created_date DESC`;

        // Extract page and limit from request query parameters
        const page = parseInt(queryParams.page) || null;
        const limit = parseInt(queryParams.limit) || null;

        if (page !== null && limit !== null) {
            const offset = (page - 1) * limit;
            query += ` LIMIT ? OFFSET ?`;
            queryValues.push(limit, offset);
        }

        pagination = {
            total_items: results[0].total_count,
            total_pages: Math.ceil(results[0].total_count / limit),
            current_page: page,
            items_per_page: limit
        };

        const response = await dbService.query(query, queryValues);

        res.status(200).json({
            data: response,
            pagination: page !== null && limit !== null ? pagination : undefined
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Oops something went wrong, you can try again later");
    }
};

const updateServiceRequestStatus = async (req, res) => {
    const { user } = req;
    const status = req.body.status.toUpperCase().replace(/\s+/g, '_');
    const practice_id = req.params.practice_id;
    const service_id = req.params.service_id;

    if (!service_id || !practice_id) {
        return res.status(400).json({ error: "Missing required path parameters" });
    }

    try {
        // Update ServiceRequest status
        const updateServiceRequestQuery = `
            UPDATE ServiceRequest
            SET status = ?
            WHERE service_request_id = ?
        `;
        await executeQuery(updateServiceRequestQuery, [status, service_id]);

        // Get treatment_plan_action_id based on service_request_id
        const getActionIdsQuery = `
            SELECT treatment_plan_action_id , treatment_plan_stage_item_id
            FROM TreatmentPlanStageActionItems 
            WHERE treatment_plan_stage_item_id = (
                SELECT treatment_plan_stage_item_id 
                FROM ServiceRequest 
                WHERE service_request_id = ?
            )
        `;
        const actionIdsResult = await executeQuery(getActionIdsQuery, [service_id]);
        
        // Extract action IDs and treatment_plan_stage_item_id from result
        const actionIds = actionIdsResult.map(row => row.treatment_plan_action_id);
        const stageItemId = actionIdsResult.length > 0 ? actionIdsResult[0].treatment_plan_stage_item_id : null;

        if (actionIds.length === 0) {
            return res.status(404).json({ error: "No matching actions found for the given service request." });
        }

        // Determine the new labStatus and status for TreatmentPlanStageActionItems
        let itemStatus;
        if (status === 'SHIPPED') {
            itemStatus = 'COMPLETED';
        } else if (status === 'DESIGN_PHASE') {
            itemStatus = 'IN_PROGRESS';
        } 

        // Update TreatmentPlanStageActionItems based on the new statuses
        const updateActionItemsQuery = `
            UPDATE TreatmentPlanStageActionItems 
            SET labStatus = ?, status = ?
            WHERE treatment_plan_action_id IN (?)
        `;
        await executeQuery(updateActionItemsQuery, [status, itemStatus, actionIds]);
        const updateitemquery = `UPDATE TreatmentPlanStageItem SET status=? WHERE treatment_plan_stage_item_id=?`;
        await executeQuery(updateitemquery, [itemStatus, stageItemId]);
        // Get updated ServiceRequest for response
        const getServiceRequestQuery = `
            SELECT * 
            FROM ServiceRequest 
            WHERE service_request_id = ?
        `;
        const response = await executeQuery(getServiceRequestQuery, [service_id]);
        console.log('response:', response);
        if (itemStatus=== 'COMPLETED'){
            await updateStageStatus(response[0].treatment_plan_stage_item_id)
        }
        res.status(200).json(response);

    } catch (err) {
        console.log(err);
        res.status(500).send("Oops, something went wrong. You can try again later.");
    }
};

const getServiceRequestDetails = async (req, res) => {
    const { user } = req;
    const lab_id = req.params.lab_id;
    const practice_id = req.params.practice_id;
    const service_request_id = req.params.service_id;

    try {
        const query = `
            SELECT planStageItem.tenant_id, planStageItem.patient_id, planStageItem.treatment_journey_id, planStageItem.workflow_id, 
                planStageItem.treatment_plan_stage_id, planStageItem.stage_id, planStageItem.treatment_plan_stage_item_id, planStageItem.step_id, 
                planStageActionItems.treatment_plan_action_id, planStageActionItems.fileExtension, planStageActionItems.image_repository_id, 
                planStageActionItems.isSendToLab, 
                ServiceRequest.service_request_id, ServiceRequest.created_date, ServiceRequest.status, ServiceRequest.patient_name, 
                ServiceRequest.requestor_name, ServiceRequest.created_date, ServiceRequest.practice_name, ServiceRequest.notes,
                ImageRepository.s3URL
            FROM TreatmentPlanStageItem planStageItem 
            INNER JOIN TreatmentPlanStageActionItems planStageActionItems 
                ON planStageItem.treatment_plan_stage_item_id = planStageActionItems.treatment_plan_stage_item_id 
            INNER JOIN ServiceRequest 
                ON planStageItem.treatment_plan_stage_id = ServiceRequest.treatment_plan_stage_id 
            INNER JOIN ImageRepository 
                ON planStageActionItems.image_repository_id = ImageRepository.image_repository_id
            WHERE ServiceRequest.practice_id = ? 
                AND ServiceRequest.service_request_id = ?
        `;
        const results = await executeQuery(query, [parseInt(practice_id), service_request_id]);

        // Process each result to add filename and presigned URL
        const files = await Promise.all(results.map(async (result) => {
            const url = result.s3URL;
            const lastFilename = decodeURIComponent(url.substring(url.lastIndexOf("/") + 1));
            const filename = lastFilename
                .split("/")
                .pop()
                .split("_")
                .slice(1)
                .join("_");

            // Generate the presigned URL
            try {
                const presignedUrl = await getPresignedUrl(url);
                return {
                    fileExtension: result.fileExtension,
                    image_repository_id: result.image_repository_id,
                    filename: filename,
                    presigned_s3url: presignedUrl
                };
            } catch (error) {
                console.error('Error generating presigned URL:', error);
                return null; // Ensure that a null entry doesn't cause issues
            }
        }));

        // Construct the final response object
        const [result] = results;
        const response = {
            tenant_id: result?.tenant_id || null,
            patient_id: result?.patient_id || null,
            treatment_journey_id: result?.treatment_journey_id || null,
            workflow_id: result?.workflow_id || null,
            treatment_plan_stage_id: result?.treatment_plan_stage_id || null,
            stage_id: result?.stage_id || null,
            treatment_plan_stage_item_id: result?.treatment_plan_stage_item_id || null,
            step_id: result?.step_id || null,
            treatment_plan_action_id: result?.treatment_plan_action_id || null,
            service_request_id: result?.service_request_id || null,
            notes: result?.notes || null,
            created_date: result?.created_date || null,
            status: result?.status || null,
            patient_name: result?.patient_name || null,
            requestor_name: result?.requestor_name || null,
            practice_name: result?.practice_name || null,
            files: files.filter(file => file !== null) // Remove any null entries if presigned URL generation fails
        };

        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        res.status(500).send("Oops something went wrong, you can try again later");
    }
};

const createServiceRequest = async (req, res) => {
    const patient_id = req.body.patient_id;
    const { treatment_plan_stage_id, treatment_plan_stage_item_id, notes } = req.body;
    const treatment_journey_id = req.params.treatment_journey_id
  
    // Retrieve user-related fields from the request's user object
    const { user } = req;
    const user_id = user.id;
    const tenant_id = user.sub;
    const requestor_name = user.name;

    console.log(user);
  
    try {
      // SQL query to fetch practice_id and patient_name
      const selectQuery = `
      SELECT 
      p.name AS patient_name,
      up.practice_id,
      u.user_id,
      u.name as requestor_name,
      dp.dental_practice_id,
      dp.name AS practice_name
    FROM 
      Patient p
    JOIN 
      Dental_Practice dp ON p.dental_practice_id=dp.dental_practice_id
    JOIN 
      User u ON p.tenant_id = u.tenant_id
    JOIN 
      UserPractice up ON u.user_id = up.user_id
    WHERE 
      p.patient_id = ? AND u.tenant_id = ? 
      `;
  
      const [selectResult] = await executeQuery(selectQuery, [patient_id, tenant_id]);

      console.log(selectResult);
  
      if (!selectResult) {
        return res.status(404).json({ message: "Patient or practice not found" });
      }
  
      const { patient_name, practice_id, user_id, dental_practice_id, practice_name, requestor_name} = selectResult;
  
      // Proceed with the insert query
      const insertQuery = `
        INSERT INTO ServiceRequest (
          patient_id, user_id, practice_id, dental_practice_id, practice_name, status, tenant_id, 
          treatment_journey_id, lab_id, patient_name, requestor_name, treatment_plan_stage_id, 
          treatment_plan_stage_item_id, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
  
      const result = await executeQuery(insertQuery, [
        patient_id,
        user_id,
        practice_id,
        dental_practice_id,
        practice_name,
        'PENDING',
        tenant_id,
        treatment_journey_id,
        1,
        patient_name,
        requestor_name,
        treatment_plan_stage_id,
        treatment_plan_stage_item_id,
        notes
      ]);

      const updateQuery = `
            UPDATE ServiceRequest
            SET service_request_id = CONCAT('SR#', ?)
            WHERE id = ?
    `;

    await executeQuery(updateQuery, [result.insertId, result.insertId]);
    const updateStatusQuery = `
      UPDATE TreatmentPlanStageActionItems SET labStatus='PENDING' WHERE treatment_plan_stage_item_id=?
    `;  
    await executeQuery(updateStatusQuery, [treatment_plan_stage_item_id]);
    res.status(201).json({ message: "Service Request created successfully", service_request_id: result.insertId });
    } catch (err) {
      console.log(err);
      res.status(500).send("Oops, something went wrong. Please try again later.");
    }
  };
  

module.exports = {
    getServiceRequestsCount,
    getServiceRequests,
    updateServiceRequestStatus,
    getServiceRequestDetails,
    createServiceRequest
};