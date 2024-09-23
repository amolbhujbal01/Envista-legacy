const dbService = require("../services/dbService");
const { insertTreatmentPlanStage } = require("./treatmentJourneyHelper");
const { updateTreatmentPlanStageStatus } = require("./updateStatusesHelper");

const executeQuery = async (query, values) => {
  try {
    return await dbService.query(query, values);
  } catch (err) {
    console.error("Database error:", err);
    throw new Error("Oops, Something went wrong!");
  }
};

const validateRequiredFields = (fields, res) => {
  for (const [field, value] of Object.entries(fields)) {
    if (!value) {
      res.status(400).send(`Missing required field: ${field}`);
      return false;
    }
  }
  return true;
};

const getUserPractice = async (tenant_id) => {
  const query = "SELECT practice_id FROM UserPractice WHERE tenant_id = ?";
  const results = await executeQuery(query, [tenant_id]);
  if (results.length === 0) throw new Error("User practice not found");
  return results[0].practice_id;
};

const getDentalPractice = async (tenant_id, practice_id) => {
  const query =
    "SELECT dental_practice_id FROM Dental_Practice WHERE tenant_id = ? AND practice_id = ?";
  const results = await executeQuery(query, [tenant_id, practice_id]);
  if (results.length === 0) throw new Error("Dental practice not found");
  return results[0].dental_practice_id;
};

const createTreatmentJourney = async (req, res) => {
  const { name, priority, start_date, end_date, clinical_notes, workflow_id } =
    req.body;
  const patient_id = req.params.patient_id;
  const { user } = req;

  if (
    !validateRequiredFields(
      { name, start_date, end_date, clinical_notes, workflow_id },
      res
    )
  )
    return;

  try {
    const tenant_id = user.sub;
    const practice_id = await getUserPractice(tenant_id);
    const dental_practice_id = await getDentalPractice(tenant_id, practice_id);

    const status = "NOT_STARTED";

    const query = `
            INSERT INTO TreatmentJourney (tenant_id, patient_id, dental_practice_id, name, status, start_date, end_date, priority, clinical_notes, workflow_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)
        `;
    const values = [
      tenant_id,
      patient_id,
      dental_practice_id,
      name,
      status,
      start_date,
      end_date,
      priority,
      clinical_notes,
      workflow_id,
    ];
    const result = await executeQuery(query, values);
    console.log(result.insertId);
    await insertTreatmentPlanStage(
      result.insertId,
      workflow_id,
      patient_id,
      user,
      res
    );
    const selectQuery =
      "SELECT * FROM TreatmentJourney WHERE tenant_id = ? AND treatment_journey_id = ?";
    const response = await executeQuery(selectQuery, [
      tenant_id,
      result.insertId,
    ]);

    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).send("Oops something went wrong, you can try again later");
  }
};

const getTreatmentJourneysForPatient = async (req, res) => {
  const { user } = req;
  const patient_id = req.params.patient_id;

  try {
    const TreatmentJourneyQuery = `
            SELECT tj.*, wk.description,wk.name as workflow_name
            FROM TreatmentJourney tj 
            JOIN Workflow wk on tj.workflow_id = wk.workflow_id
            WHERE tj.tenant_id=? and patient_id = ?
    `;
    const results = await executeQuery(TreatmentJourneyQuery, [
      user.sub,
      patient_id,
    ]);
    res.status(200).json(results);
  } catch (err) {
    console.log(err);
    res.status(500).send("Oops something went wrong, you can try again later");
  }
};

const updateWorkflowId = async (req, res) => {
  const { user } = req;
  const { workflow_id } = req.body;
  const treatment_journey_id = req.params.treatment_journey_id;

  if (!workflow_id) {
    return res.status(400).json({ error: "Missing workflow_id" });
  }

  try {
    const selectQuery =
      "SELECT * FROM TreatmentJourney WHERE treatment_journey_id = ?";
    const response = await executeQuery(selectQuery, [treatment_journey_id]);
    if (response[0].workflow_id) {
      res.status(400).json({
        message: "Workflow already exists for this Treatment Journey!",
      });
    }
    const query =
      "UPDATE TreatmentJourney SET workflow_id = ? WHERE tenant_id = ? AND treatment_journey_id = ?";
    await executeQuery(query, [workflow_id, user.sub, treatment_journey_id]);

    await insertTreatmentPlanStage(
      treatment_journey_id,
      workflow_id,
      patient_id,
      user,
      res
    );
    const response2 = await executeQuery(selectQuery, [treatment_journey_id]);
    res.status(200).json(response2);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Oops something went wrong, you can try again later" });
  }
};

const GetTreatmentJourneyPlanForPatient = async (req, res) => {
  const { patient_id, journey_id } = req.params;

  try {
    // Query to get workflow_id and treatment journey details
    const TreatmentJourneyQuery = `
            SELECT tj.workflow_id, tj.name, tj.status, tj.start_date, tj.end_date, tj.priority, tj.clinical_notes, wk.description,wk.name as workflow_name
            FROM TreatmentJourney tj 
            JOIN Workflow wk on tj.workflow_id = wk.workflow_id
            WHERE treatment_journey_id = ? AND patient_id = ?
        `;
    const TreatmentJourneyResults = await executeQuery(TreatmentJourneyQuery, [
      journey_id,
      patient_id,
    ]);

    // console.log(TreatmentJourneyResults);
    if (TreatmentJourneyResults.length === 0) {
      return res.status(404).send("Treatment journey not found");
    }

    const {
      workflow_id,
      description,
      workflow_name,
      name,
      status,
      start_date,
      end_date,
      priority,
      clinical_notes,
    } = TreatmentJourneyResults[0];

    // Query to get stages and steps
    const query = `
            SELECT 
                s.name AS stage_name,
                s.description AS stage_description,
                s.isSkippable,
                tps.status AS stage_status,
                tps.isSkipped,
                tps.treatment_plan_stage_id,
                si.name AS step_name,
                si.description AS step_description,
                tpsi.status AS step_status,
                tpsi.treatment_plan_stage_item_id
            FROM TreatmentPlanStage tps
            JOIN Stage s ON tps.stage_id = s.stage_id
            JOIN TreatmentPlanStageItem tpsi ON tps.treatment_plan_stage_id = tpsi.treatment_plan_stage_id
            JOIN StageItem si ON tpsi.step_id = si.step_id
            WHERE tps.patient_id = ? AND tps.treatment_journey_id = ? AND tps.workflow_id = ?
            ORDER BY s.sequence_id, si.sequence_id
        `;

    const result = await executeQuery(query, [
      patient_id,
      journey_id,
      workflow_id,
    ]);

    const stages = [];
    let currentStage = null;

    result.forEach((row) => {
      if (
        !currentStage ||
        currentStage.treatment_plan_stage_id !== row.treatment_plan_stage_id
      ) {
        if (currentStage) {
          stages.push(currentStage);
        }
        currentStage = {
          name: row.stage_name,
          description: row.stage_description,
          steps: [],
          skippable: !!row.isSkippable,
          status: row.stage_status,
          isSkipped: !!row.isSkipped,
          treatment_plan_stage_id: row.treatment_plan_stage_id,
        };
      }
      currentStage.steps.push({
        name: row.step_name,
        description: row.step_description,
        status: row.step_status,
        treatment_plan_stage_item_id: row.treatment_plan_stage_item_id,
      });
    });

    if (currentStage) {
      stages.push(currentStage);
    }

    const checkIfAllStageIsCompleteQuery = `
        SELECT 
          COUNT(*) AS total_stages,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_stages,
          CASE 
            WHEN COUNT(*) = SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) 
            THEN 'COMPLETED' 
            ELSE 'NOT_COMPLETE' 
          END AS status_flag
        FROM 
          TreatmentPlanStage
        WHERE
          patient_id = ? 
          AND treatment_journey_id = ?;
      `;

    const checkIfAllStagesIsCompleteQueryResult = await executeQuery(
      checkIfAllStageIsCompleteQuery,
      [patient_id, journey_id]
    );
    const all_stages_completed =
      checkIfAllStagesIsCompleteQueryResult[0].status_flag === "COMPLETED";

    const stage_count = checkIfAllStagesIsCompleteQueryResult[0];
    var completion_percentage = null;
    // Validate that result is not null and that total_stages is greater than 0
    if (stage_count && stage_count.total_stages > 0) {
      completion_percentage =
        (stage_count.completed_stages / stage_count.total_stages) * 100;
      console.log(`Completion Percentage: ${completion_percentage}%`);
    } else {
      console.log("Completion Percentage: null"); // Handling case where no stages exist or result is invalid
    }

    res.json({
      treatment_journey_id: parseInt(journey_id),
      patient_id: parseInt(patient_id),
      workflow_id,
      all_stages_completed,
      description,
      workflow_name,
      name,
      status,
      start_date,
      end_date,
      priority,
      clinical_notes,
      completion_percentage,
      stages,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch patient Treatment plan data" });
  }
};

const SkipTreatmentPlanStage = async (req, res) => {
  const { patient_id, journey_id, workflow_id, treatment_plan_stage_id } =
    req.params;

  try {
    // Fetch the corresponding stage_id from TreatmentPlanStage table
    const fetchStageIdQuery = `
            SELECT stage_id
            FROM TreatmentPlanStage
            WHERE treatment_plan_stage_id = ? AND patient_id = ? AND treatment_journey_id = ? AND workflow_id = ?
        `;

    const stageIdResults = await dbService.query(fetchStageIdQuery, [
      treatment_plan_stage_id,
      patient_id,
      journey_id,
      workflow_id,
    ]);

    if (stageIdResults.length === 0) {
      return res.status(404).json({ error: "Treatment plan stage not found" });
    }

    const { stage_id } = stageIdResults[0];

    // Check if the stage is skippable
    const checkSkippableQuery = `
            SELECT isSkippable
            FROM Stage
            WHERE stage_id = ? AND workflow_id = ?
        `;

    const checkSkippableResults = await dbService.query(checkSkippableQuery, [
      stage_id,
      workflow_id,
    ]);

    if (checkSkippableResults.length === 0) {
      return res.status(404).json({ error: "Stage not found" });
    }

    const { isSkippable } = checkSkippableResults[0];

    if (!isSkippable) {
      return res.status(400).json({ error: "Stage is not skippable" });
    }

    // Update the isSkipped field in TreatmentPlanStage table
    const updateQuery = `
            UPDATE TreatmentPlanStage
            SET isSkipped = TRUE
            WHERE treatment_plan_stage_id = ? AND patient_id = ? AND treatment_journey_id = ? AND workflow_id = ?
        `;

    const updateResults = await dbService.query(updateQuery, [
      treatment_plan_stage_id,
      patient_id,
      journey_id,
      workflow_id,
    ]);

    if (updateResults.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Stage not found or already skipped" });
    }

    res.status(200).json({ message: "Stage successfully skipped" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Oops! Failed to skip the stage" });
  }
};

const getStepActions = async (req, res) => {
  const { step_id, journey_id } = req.query;
  const { patient_id } = req.params;

  try {
    // Query to get treatment plan stage action items
    const treatmentPlanStageActionItemsQuery = `
      SELECT * 
      FROM TreatmentPlanStageActionItems 
      WHERE treatment_plan_stage_item_id = ? 
      AND patient_id = ?
    `;
    const treatmentPlanStageActionItemsResult = await executeQuery(
      treatmentPlanStageActionItemsQuery,
      [step_id, patient_id]
    );

    if (!treatmentPlanStageActionItemsResult.length) {
      return res
        .status(404)
        .json({ message: "No action items found for the given parameters." });
    }

    const treatmentPlanStageQuery = `
    SELECT si.name AS StageItemName, si.description AS StageItemDescription, s.name AS StageName, s.description  AS StageDescription, tpsi.treatment_plan_stage_id as TreatmentPlanStageID
    FROM TreatmentPlanStageItem as tpsi
    JOIN StageItem si ON tpsi.step_id = si.step_id 
    JOIN Stage s ON s.stage_id  = si.stage_id 
    WHERE tpsi.treatment_plan_stage_item_id = ?
    `;

    const treatmentPlanStageQueryResults = await executeQuery(
      treatmentPlanStageQuery,
      [step_id]
    );

    const {
      StageItemName,
      StageItemDescription,
      StageName,
      StageDescription,
      TreatmentPlanStageID,
    } = treatmentPlanStageQueryResults[0];
    console.log(
      "treatmentPlanStageQueryResults" +
        JSON.stringify(treatmentPlanStageQueryResults)
    );

    // Fetch the procedure map for the step_id
    const procedureMapQuery = `
      SELECT * 
      FROM ProcedureMap 
      WHERE step_id = ?
    `;
    const procedureMapResults = await executeQuery(procedureMapQuery, [
      treatmentPlanStageActionItemsResult[0].step_id,
    ]);

    if (!procedureMapResults.length) {
      return res
        .status(404)
        .json({ message: "No procedure map found for the given step ID." });
    }

    // Fetch the procedure template once to avoid redundant queries
    const procedureTemplateQuery = `
      SELECT procedure_action_id, procedure_name, sequence_id, isSkippable, isRejectable, isNotIntegrated
      FROM ProcedureTemplate 
      WHERE procedure_id = ? 
      ORDER BY sequence_id
    `;
    const procedureTemplateResult = await executeQuery(procedureTemplateQuery, [
      procedureMapResults[0].procedure_id,
    ]);

    // Create an array of unique procedure_action_id and sequence_id pairs
    const usedActions = new Set();

    // Iterate over treatment plan stage action items and populate procedures
    const procedures = [];

    for (const treatment_plan_step of treatmentPlanStageActionItemsResult) {
      const procedureActionsQuery = `
        SELECT * 
        FROM ProcedureActions 
        WHERE procedure_action_id = ?
      `;
      const procedureActionsResult = await executeQuery(procedureActionsQuery, [
        treatment_plan_step.procedure_action_id,
      ]);
      //console.log("action result" + JSON.stringify(procedureTemplateResult))

      if (procedureActionsResult.length > 0) {
        const procedure_action_id = treatment_plan_step.procedure_action_id;

        // Find the appropriate entry in the procedureTemplateResult
        const matchingEntry = procedureTemplateResult.find(
          (template) =>
            template.procedure_action_id === procedure_action_id &&
            !usedActions.has(
              `${template.procedure_action_id}_${template.sequence_id}`
            )
        );

        if (matchingEntry) {
          const { procedure_name, sequence_id, isSkippable, isRejectable, isNotIntegrated } = matchingEntry;

          procedures.push({
            treatment_plan_action_id:
              treatment_plan_step.treatment_plan_action_id,
            procedure_id: procedureMapResults[0].procedure_id,
            procedure_action_id: procedure_action_id,
            procedure_action_name: procedure_name,
            isMentorReviewRequired:
              procedureActionsResult[0].isMentorReviewRequired,
            isApproveRequired: procedureActionsResult[0].isApproveRequired,
            isUploadRequired: procedureActionsResult[0].isUploadRequired,
            isDownloadRequired: procedureActionsResult[0].isDownloadRequired,
            isOrderConsumables: procedureActionsResult[0].isOrderConsumables,
            isSendToLab: procedureActionsResult[0].isSentToLab,
            labStatus: treatmentPlanStageActionItemsResult[0].labStatus,
            status: treatment_plan_step.status,
            sequence_id: sequence_id,
            isSkippable: isSkippable,
            isRejectable: isRejectable,
            isNotIntegrated: isNotIntegrated
          });

          // Mark this combination as used
          usedActions.add(
            `${matchingEntry.procedure_action_id}_${matchingEntry.sequence_id}`
          );
        }
      }
    }

    // Sort the procedures by sequence_id
    procedures.sort((a, b) => a.sequence_id - b.sequence_id);

    // Fetch the next treatment_plan_stage_item_id
    const nextTreatmentPlanStageItemQuery = `
      WITH OrderedItems AS (
        SELECT *, 
               ROW_NUMBER() OVER (ORDER BY step_id, treatment_plan_stage_item_id) AS row_num 
        FROM TreatmentPlanStageItem 
        WHERE patient_id = ? 
          AND treatment_journey_id = ?
      ) 
      SELECT treatment_plan_stage_item_id, treatment_plan_stage_id 
      FROM OrderedItems 
      WHERE row_num = (
        SELECT row_num + 1 
        FROM OrderedItems 
        WHERE treatment_plan_stage_item_id = ?
      )
    `;
    const nextTreatmentPlanStageItemResult = await executeQuery(
      nextTreatmentPlanStageItemQuery,
      [patient_id, journey_id, step_id]
    );

    const next_treatment_plan_stage_item_id =
      nextTreatmentPlanStageItemResult.length
        ? nextTreatmentPlanStageItemResult[0].treatment_plan_stage_item_id
        : -1;
    const next_treatment_plan_stage_id = nextTreatmentPlanStageItemResult.length
      ? nextTreatmentPlanStageItemResult[0].treatment_plan_stage_id
      : -1;

    const response = {
      workflow_id: parseInt(treatmentPlanStageActionItemsResult[0].workflow_id),
      stage_item_name: StageItemName,
      stage_item_description: StageItemDescription,
      stage_name: StageName,
      stage_description: StageDescription,
      treatment_plan_stage_id: TreatmentPlanStageID,
      treatment_plan_stage_item_id: parseInt(step_id),
      next_treatment_plan_stage_item_id: next_treatment_plan_stage_item_id,
      treatment_plan_procedure: procedures,
    };

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).send("Oops something went wrong, you can try again later");
  }
};

// const updateTreatmentPlanStageStatus = async (req, res) => {
//   const { treatment_plan_stage_item_id } = req.params;

//   try {
//     // Query to check the statuses of actions
//     const checkActionsQuery = `
//       SELECT COUNT(*) AS total_actions,
//              SUM(CASE WHEN status = 'NOT_STARTED' THEN 1 ELSE 0 END) AS not_started_actions,
//              SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_actions,
//              SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress_actions
//       FROM TreatmentPlanStageActionItems
//       WHERE treatment_plan_stage_item_id = ?
//     `;

//     const checkActionsResult = await executeQuery(checkActionsQuery, [
//       treatment_plan_stage_item_id,
//     ]);

//     if (checkActionsResult.length === 0) {
//       throw new Error(
//         "No actions found for the given treatment plan stage item ID."
//       );
//     }

//     const {
//       total_actions,
//       not_started_actions,
//       completed_actions,
//       in_progress_actions,
//     } = checkActionsResult[0];

//     let newStatus;

//     const totalActions = Number(total_actions);
//     const completedActions = Number(completed_actions);
//     const inProgressActions = Number(in_progress_actions);
//     const notStartedActions = Number(not_started_actions);

//     if (totalActions === completedActions) {
//       newStatus = "COMPLETED";
//     } else if (inProgressActions > 0 || notStartedActions < totalActions) {
//       newStatus = "IN_PROGRESS";
//     }

//     // Update the treatment plan stage item status
//     const updateQuery = `
//       UPDATE TreatmentPlanStageItem
//       SET status = ?
//       WHERE treatment_plan_stage_item_id = ?
//     `;
//     await executeQuery(updateQuery, [newStatus, treatment_plan_stage_item_id]);

//     if (newStatus !== "COMPLETED") {
//       return res.status(400).json({
//         message:
//           "You must finish all the actions in this step to proceed to the next treatment plan stage item.",
//       });
//     }

//     // Execute additional SQL queries if the newStatus is COMPLETED
//     if (newStatus === "COMPLETED") {
//       // Query to check if it's the last item in the stage
//       const checkLastItemQuery = `
//         SELECT CASE WHEN tpsi.step_id = (
//                     SELECT MAX(tpsi_inner.step_id)
//                     FROM TreatmentPlanStageItem tpsi_inner
//                     WHERE tpsi_inner.treatment_plan_stage_id = tpsi.treatment_plan_stage_id
//                   ) THEN TRUE ELSE FALSE END AS is_last_item,
//                tpsi.treatment_plan_stage_id
//         FROM TreatmentPlanStageItem tpsi
//         WHERE tpsi.treatment_plan_stage_item_id = ?
//       `;
//       const lastItemResult = await executeQuery(checkLastItemQuery, [
//         treatment_plan_stage_item_id,
//       ]);

//       if (lastItemResult[0].is_last_item) {
//         const { treatment_plan_stage_id } = lastItemResult[0];

//         // Update TreatmentPlanStage status to COMPLETED
//         const updateStageQuery = `
//           UPDATE TreatmentPlanStage
//           SET status = 'COMPLETED'
//           WHERE treatment_plan_stage_id = ?
//         `;
//         await executeQuery(updateStageQuery, [treatment_plan_stage_id]);

//         // Check if there's a next stage
//         const nextStageQuery = `
//             SELECT tps.treatment_plan_stage_id AS next_stage_id
//             FROM TreatmentPlanStage tps
//             WHERE tps.treatment_journey_id = (
//                 SELECT tj.treatment_journey_id
//                 FROM TreatmentPlanStageItem tpsi
//                 JOIN TreatmentPlanStage tps ON tpsi.treatment_plan_stage_id = tps.treatment_plan_stage_id
//                 JOIN TreatmentJourney tj ON tps.treatment_journey_id = tj.treatment_journey_id
//                 WHERE tpsi.treatment_plan_stage_item_id = ?
//             )
//             AND tps.stage_id > (
//                 SELECT tps2.stage_id
//                 FROM TreatmentPlanStageItem tpsi2
//                 JOIN TreatmentPlanStage tps2 ON tpsi2.treatment_plan_stage_id = tps2.treatment_plan_stage_id
//                 WHERE tpsi2.treatment_plan_stage_item_id = ?
//             )
//             ORDER BY tps.stage_id ASC
//             LIMIT 1
//         `;
//         const nextStageResult = await executeQuery(nextStageQuery, [
//           treatment_plan_stage_item_id,
//           treatment_plan_stage_item_id,
//         ]);

//         console.log(nextStageResult);
//         // const nextStageId = nextStageResult[0].next_stage_id;

//         if (nextStageResult[0]) {
//           // Update next stage status to IN_PROGRESS
//           const nextStageId = nextStageResult[0].next_stage_id;
//           const updateNextStageQuery = `
//             UPDATE TreatmentPlanStage
//             SET status = 'IN_PROGRESS'
//             WHERE treatment_plan_stage_id = ?
//           `;
//           await executeQuery(updateNextStageQuery, [nextStageId]);

//           // Update the first item of the next stage to IN_PROGRESS
//           const updateNextItemQuery = `
//               UPDATE TreatmentPlanStageItem tpsi
//               JOIN (
//                   SELECT tpsi_inner.treatment_plan_stage_item_id AS min_treatment_plan_stage_item_id
//                   FROM TreatmentPlanStageItem tpsi_inner
//                   WHERE tpsi_inner.treatment_plan_stage_id = ?
//                   ORDER BY tpsi_inner.step_id ASC
//                   LIMIT 1
//               ) AS derived_table ON tpsi.treatment_plan_stage_item_id = derived_table.min_treatment_plan_stage_item_id
//               SET tpsi.status = 'IN_PROGRESS'
//           `;
//           await executeQuery(updateNextItemQuery, [nextStageId]);
//         } else {
//           // No next stage, so the journey is complete
//           return res
//             .status(200)
//             .json({ message: "Hooray, This Treatment journey is completed." });
//         }
//       } else {
//         // If not the last item, update the next treatment plan stage item to "IN_PROGRESS"
//         const updateNextItemQuery = `
//           UPDATE TreatmentPlanStageItem tpsi
//           JOIN (
//               SELECT tpsi_inner.treatment_plan_stage_item_id
//               FROM TreatmentPlanStageItem tpsi_inner
//               WHERE tpsi_inner.treatment_plan_stage_id = ?
//                 AND tpsi_inner.step_id > (
//                     SELECT step_id
//                     FROM TreatmentPlanStageItem
//                     WHERE treatment_plan_stage_item_id = ?
//                 )
//               ORDER BY tpsi_inner.step_id ASC
//               LIMIT 1
//           ) AS next_item ON tpsi.treatment_plan_stage_item_id = next_item.treatment_plan_stage_item_id
//           SET tpsi.status = 'IN_PROGRESS';

//         `;
//         await executeQuery(updateNextItemQuery, [
//           lastItemResult[0].treatment_plan_stage_id,
//           treatment_plan_stage_item_id,
//         ]);
//       }
//     }

//     res.status(200).json({
//       message: `Treatment plan stage status updated to ${newStatus} successfully.`,
//     });
//   } catch (err) {
//     console.error("Database error:", err);
//     res.status(500).json({ message: "Oops, something went wrong!" });
//   }
// };

const updateActionStatus = async (req, res) => {
  const { treatment_plan_action_id } = req.params;
  console.log(treatment_plan_action_id);

  try {
    // Check which flag is true for the given treatment_plan_action_id
    const selectQuery = `
      SELECT isApproveRequired, isMentorReviewRequired, isOrderConsumables
      FROM TreatmentPlanStageActionItems
      WHERE treatment_plan_action_id = ?
    `;

    const rows = await executeQuery(selectQuery, [treatment_plan_action_id]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "No action found for the given treatment plan action ID.",
      });
    }

    const { isApproveRequired, isMentorReviewRequired, isOrderConsumables } =
      rows[0];
    let updateQuery = "";
    let queryName;

    // Determine which flag is true and create the corresponding update query
    if (isApproveRequired) {
      queryName = "Approve";
      updateQuery = `
        UPDATE TreatmentPlanStageActionItems
        SET status = 'COMPLETED'
        WHERE treatment_plan_action_id = ?
        AND isApproveRequired = 1
      `;
    } else if (isMentorReviewRequired) {
      queryName = "Review";
      updateQuery = `
        UPDATE TreatmentPlanStageActionItems
        SET status = 'COMPLETED'
        WHERE treatment_plan_action_id = ?
        AND isMentorReviewRequired = 1
      `;
    } else if (isOrderConsumables) {
      queryName = "E-Shop";
      updateQuery = `
        UPDATE TreatmentPlanStageActionItems
        SET status = 'COMPLETED'
        WHERE treatment_plan_action_id = ?
        AND isOrderConsumables = 1
      `;
    } else {
      return res.status(400).json({
        message:
          "No action requires updating for the given treatment plan action ID.",
      });
    }

    // Execute the update query
    const result = await executeQuery(updateQuery, [treatment_plan_action_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Action could not be updated, please check the conditions.",
      });
    }

    res.status(200).json({
      message: `Status updated to COMPLETED for treatment plan action ID ${treatment_plan_action_id} (${queryName}) successfully.`,
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Oops, something went wrong!" });
  }
};

const updateJourneyStatus = async (req, res) => {
  const { treatment_journey_id } = req.params;

  if (!treatment_journey_id) {
    return res.status(400).json({ error: "Treatment journey ID is required." });
  }

  try {
    // Update TreatmentJourney status
    const updateJourneyQuery = `
      UPDATE TreatmentJourney
      SET status = 'IN_PROGRESS'
      WHERE treatment_journey_id = ?
    `;
    await dbService.query(updateJourneyQuery, [treatment_journey_id]);

    // Update TreatmentPlanStage status
    const updateStageQuery = `
      UPDATE TreatmentPlanStage
      JOIN (
          SELECT tps_inner.treatment_plan_stage_id AS id
          FROM TreatmentPlanStage tps_inner
          WHERE tps_inner.treatment_journey_id = ? ORDER BY stage_id LIMIT 1
      ) AS derived
      ON TreatmentPlanStage.treatment_plan_stage_id = derived.id
      SET TreatmentPlanStage.status = 'IN_PROGRESS'
    `;
    await dbService.query(updateStageQuery, [treatment_journey_id]);

    // Update TreatmentPlanStageItem status
    const updateStageItemQuery = `
      UPDATE TreatmentPlanStageItem tpsi
      JOIN (
          SELECT tpsi_inner.treatment_plan_stage_item_id
          FROM TreatmentPlanStageItem tpsi_inner
          JOIN TreatmentPlanStage tps_inner ON tpsi_inner.treatment_plan_stage_id = tps_inner.treatment_plan_stage_id
          WHERE tps_inner.treatment_journey_id = ?
          ORDER BY tps_inner.stage_id ASC, tpsi_inner.step_id ASC
          LIMIT 1
      ) AS derived
      ON tpsi.treatment_plan_stage_item_id = derived.treatment_plan_stage_item_id
      SET tpsi.status = 'IN_PROGRESS';
    `;
    await dbService.query(updateStageItemQuery, [treatment_journey_id]);

    res.status(200).json({
      message: "Journey and associated stages and steps updated successfully.",
    });
  } catch (err) {
    console.error("Error updating journey status:", err);
    res.status(500).json({ error: "Oops, something went wrong!" });
  }
};

const updateTreatmentJourneyStatusIfCompleted = async (req, res) => {
  const { patient_id, treatment_journey_id } = req.params;
  try {
    const checkJourneyStatusQuery = `
      SELECT CASE
              WHEN COUNT(*) = SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)
              THEN 'COMPLETED'
              ELSE 'NOT_COMPLETE'
            END AS status_flag
      FROM TreatmentPlanStage
      WHERE patient_id = ?
      AND treatment_journey_id = ?
    `;

    const statusCheckResult = await executeQuery(checkJourneyStatusQuery, [
      patient_id,
      treatment_journey_id,
    ]);

    if (statusCheckResult.length === 0) {
      console.error(
        `No stages found for patient_id: ${patient_id}, treatment_journey_id: ${treatment_journey_id}`
      );
      res.status(404).json({
        message:
          "No stages found for the given patient and treatment journey ID.",
      });
      return;
    }

    const { status_flag } = statusCheckResult[0];

    if (status_flag === "COMPLETED") {
      const updateJourneyStatusQuery = `
        UPDATE TreatmentJourney
        SET status = 'COMPLETED'
        WHERE patient_id = ?
        AND treatment_journey_id = ?
      `;

      await executeQuery(updateJourneyStatusQuery, [
        patient_id,
        treatment_journey_id,
      ]);

      console.log(
        `[INFO] Treatment journey status updated to COMPLETED for patient_id: ${patient_id}, treatment_journey_id: ${treatment_journey_id}`
      );
      res
        .status(200)
        .json({ message: "Treatment journey status updated to COMPLETED." });
    } else {
      console.log(
        `[INFO] Treatment journey is not yet complete for patient_id: ${patient_id}, treatment_journey_id: ${treatment_journey_id}`
      );
      res
        .status(200)
        .json({ message: "Treatment journey is not yet complete." });
    }
  } catch (err) {
    console.error(`[ERROR CODE 500] Database error:`, err);
    res.status(500).json({ message: "Oops, something went wrong." });
  }
};

module.exports = {
  createTreatmentJourney,
  getTreatmentJourneysForPatient,
  updateWorkflowId,
  insertTreatmentPlanStage,
  GetTreatmentJourneyPlanForPatient,
  SkipTreatmentPlanStage,
  getStepActions,
  updateTreatmentPlanStageStatus,
  updateJourneyStatus,
  updateActionStatus,
  updateTreatmentPlanStageStatus,
  updateTreatmentJourneyStatusIfCompleted,
};
