const dbService = require("../services/dbService");

const executeQuery = async (query, values) => {
  try {
    return await dbService.query(query, values);
  } catch (err) {
    console.error("Database error:", err);
    throw new Error("Oops, Something went wrong!");
  }
};

const updateOptionalActionStatuses = async (treatment_plan_stage_item_id) => {
  try {
    // Step 1: Join TreatmentPlanStageActionItems and ProcedureTemplate tables to get the necessary data
    const joinQuery = `
      SELECT 
        tpsai.treatment_plan_action_id,
        pt.isOptional
      FROM 
        TreatmentPlanStageActionItems tpsai
      JOIN 
        ProcedureTemplate pt 
      ON 
        tpsai.procedure_action_id = pt.procedure_action_id
      WHERE 
        tpsai.treatment_plan_stage_item_id = ?
    `;

    const actionItems = await executeQuery(joinQuery, [treatment_plan_stage_item_id]);

    // Step 2: Iterate over the results and check if isOptional is true
    for (const actionItem of actionItems) {
      if (actionItem.isOptional) {
        // Step 3: If isOptional is true, update the status to 'COMPLETED'
        const updateQuery = `
          UPDATE TreatmentPlanStageActionItems
          SET status = 'COMPLETED'
          WHERE treatment_plan_action_id = ?
        `;
        await executeQuery(updateQuery, [actionItem.treatment_plan_action_id]);
      }
    }

    console.log(`Optional action statuses updated successfully for treatment_plan_stage_item_id: ${treatment_plan_stage_item_id}`);
  } catch (err) {
    console.error("Database error:", err);
  }
};

const getActionStatuses = async (treatment_plan_stage_item_id) => {

  await updateOptionalActionStatuses(treatment_plan_stage_item_id);

  const checkActionsQuery = `
    SELECT COUNT(*) AS total_actions,
           SUM(CASE WHEN tpsai.status = 'NOT_STARTED' THEN 1 ELSE 0 END) AS not_started_actions, 
           SUM(CASE WHEN tpsai.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_actions,
           SUM(CASE WHEN tpsai.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress_actions
    FROM TreatmentPlanStageActionItems tpsai
    WHERE tpsai.treatment_plan_stage_item_id = ?
  `;

  const result = await executeQuery(checkActionsQuery, [
    treatment_plan_stage_item_id,
  ]);

  if (result.length === 0) {
    throw new Error(
      "No actions found for the given treatment plan stage item ID."
    );
  }

  return result[0];
};

const determineNewStatus = ({
  total_actions,
  not_started_actions,
  completed_actions,
  in_progress_actions,
}) => {
  const totalActions = Number(total_actions);
  const completedActions = Number(completed_actions);
  const inProgressActions = Number(in_progress_actions);
  const notStartedActions = Number(not_started_actions);

  console.log('Total Actions:', totalActions);
  console.log('Completed Actions:', completedActions);
  console.log('In Progress Actions:', inProgressActions);
  console.log('Not Started Actions:', notStartedActions);

  if (totalActions === completedActions) {
    return "COMPLETED";
  } else if (inProgressActions > 0 || notStartedActions < totalActions) {
    return "IN_PROGRESS";
  }

  return null;
};

const updateStageItemStatus = async (
  newStatus,
  treatment_plan_stage_item_id
) => {
  const updateQuery = `
      UPDATE TreatmentPlanStageItem
      SET status = ?
      WHERE treatment_plan_stage_item_id = ?
    `;
  await executeQuery(updateQuery, [newStatus, treatment_plan_stage_item_id]);
};

const isLastStageItem = async (treatment_plan_stage_item_id) => {
  console.log(treatment_plan_stage_item_id);
  const checkLastItemQuery = `
      SELECT CASE WHEN tpsi.step_id = (
                  SELECT MAX(tpsi_inner.step_id)
                  FROM TreatmentPlanStageItem tpsi_inner
                  WHERE tpsi_inner.treatment_plan_stage_id = tpsi.treatment_plan_stage_id
                ) THEN TRUE ELSE FALSE END AS is_last_item,
             tpsi.treatment_plan_stage_id
      FROM TreatmentPlanStageItem tpsi
      WHERE tpsi.treatment_plan_stage_item_id = ?
    `;
  const result = await executeQuery(checkLastItemQuery, [
    treatment_plan_stage_item_id,
  ]);
  console.log(result);

  return result[0];
};

const completeCurrentStage = async (treatment_plan_stage_id) => {
  const updateStageQuery = `
      UPDATE TreatmentPlanStage
      SET status = 'COMPLETED'
      WHERE treatment_plan_stage_id = ?
    `;
  await executeQuery(updateStageQuery, [treatment_plan_stage_id]);
};

const getNextStage = async (treatment_plan_stage_item_id) => {
  const nextStageQuery = `
      SELECT tps.treatment_plan_stage_id AS next_stage_id
      FROM TreatmentPlanStage tps
      WHERE tps.treatment_journey_id = (
          SELECT tj.treatment_journey_id
          FROM TreatmentPlanStageItem tpsi
          JOIN TreatmentPlanStage tps ON tpsi.treatment_plan_stage_id = tps.treatment_plan_stage_id
          JOIN TreatmentJourney tj ON tps.treatment_journey_id = tj.treatment_journey_id
          WHERE tpsi.treatment_plan_stage_item_id = ?
      )
      AND tps.stage_id > (
          SELECT tps2.stage_id
          FROM TreatmentPlanStageItem tpsi2
          JOIN TreatmentPlanStage tps2 ON tpsi2.treatment_plan_stage_id = tps2.treatment_plan_stage_id
          WHERE tpsi2.treatment_plan_stage_item_id = ?
      )
      ORDER BY tps.stage_id ASC
      LIMIT 1
    `;
  const result = await executeQuery(nextStageQuery, [
    treatment_plan_stage_item_id,
    treatment_plan_stage_item_id,
  ]);

  return result[0];
};

const startNextStage = async (next_stage_id) => {
  const updateNextStageQuery = `
      UPDATE TreatmentPlanStage
      SET status = 'IN_PROGRESS'
      WHERE treatment_plan_stage_id = ?
    `;
  await executeQuery(updateNextStageQuery, [next_stage_id]);

  const updateNextItemQuery = `
      UPDATE TreatmentPlanStageItem tpsi
      JOIN (
          SELECT tpsi_inner.treatment_plan_stage_item_id AS min_treatment_plan_stage_item_id
          FROM TreatmentPlanStageItem tpsi_inner
          WHERE tpsi_inner.treatment_plan_stage_id = ?
          ORDER BY tpsi_inner.step_id ASC
          LIMIT 1
      ) AS derived_table ON tpsi.treatment_plan_stage_item_id = derived_table.min_treatment_plan_stage_item_id
      SET tpsi.status = 'IN_PROGRESS'
    `;
  await executeQuery(updateNextItemQuery, [next_stage_id]);
};

const startNextStageItem = async (
  treatment_plan_stage_id,
  treatment_plan_stage_item_id
) => {
  const updateNextItemQuery = `
      UPDATE TreatmentPlanStageItem tpsi
      JOIN (
          SELECT tpsi_inner.treatment_plan_stage_item_id
          FROM TreatmentPlanStageItem tpsi_inner
          WHERE tpsi_inner.treatment_plan_stage_id = ?
            AND tpsi_inner.step_id > (
                SELECT step_id
                FROM TreatmentPlanStageItem
                WHERE treatment_plan_stage_item_id = ?
            )
          ORDER BY tpsi_inner.step_id ASC
          LIMIT 1
      ) AS next_item ON tpsi.treatment_plan_stage_item_id = next_item.treatment_plan_stage_item_id
      SET tpsi.status = 'IN_PROGRESS';
    `;
  await executeQuery(updateNextItemQuery, [
    treatment_plan_stage_id,
    treatment_plan_stage_item_id,
  ]);
};

const updateTreatmentJourneyTime = async (treatment_plan_stage_item_id) => {
  try {
    // Step 1: Retrieve the treatment_journey_id associated with the given treatment_plan_stage_item_id
    const getJourneyIdQuery = `
      SELECT tj.treatment_journey_id
      FROM TreatmentPlanStageItem tpsi
      JOIN TreatmentPlanStage tps ON tpsi.treatment_plan_stage_id = tps.treatment_plan_stage_id
      JOIN TreatmentJourney tj ON tps.treatment_journey_id = tj.treatment_journey_id
      WHERE tpsi.treatment_plan_stage_item_id = ?
    `;

    const journeyIdResult = await executeQuery(getJourneyIdQuery, [treatment_plan_stage_item_id]);

    if (journeyIdResult.length === 0) {
      throw new Error("No treatment journey found for the given treatment plan stage item ID.");
    }

    const { treatment_journey_id } = journeyIdResult[0];

    // Step 2: Update the updated_at column in the TreatmentJourney table
    const updateJourneyTimeQuery = `
      UPDATE TreatmentJourney
      SET updated_at = NOW()
      WHERE treatment_journey_id = ?
    `;

    await executeQuery(updateJourneyTimeQuery, [treatment_journey_id]);

    console.log(`Treatment journey updated_at time updated successfully for treatment_journey_id: ${treatment_journey_id}`);
  } catch (err) {
    console.error("Database error:", err);
  }
};

const updateStageStatus = async (treatment_plan_stage_item_id) => {
  const actionStatuses = await getActionStatuses(treatment_plan_stage_item_id);
  const newStatus = determineNewStatus(actionStatuses);

  if (!newStatus) {
    // return res.status(400).json({
    //   message: "Unable to determine the new status based on action items.",
    // });
    throw new Error("Unable to determine the new status based on action items.");
  }

  await updateStageItemStatus(newStatus, treatment_plan_stage_item_id);

  await updateTreatmentJourneyTime(treatment_plan_stage_item_id);

  if (newStatus !== "COMPLETED") {
    // return res.status(400).json({
    //   message:
    //     "You must finish all the actions in this step to proceed to the next treatment plan stage item.",
    // });
    throw new Error("You must finish all the actions in this step to proceed to the next treatment plan stage item.");
  }

  const { is_last_item, treatment_plan_stage_id } = await isLastStageItem(
    treatment_plan_stage_item_id
  );

  if (is_last_item) {
    await completeCurrentStage(treatment_plan_stage_id);
    const nextStage = await getNextStage(treatment_plan_stage_item_id);

    if (nextStage) {
      await startNextStage(nextStage.next_stage_id);
    } else {
      // return res
      //   .status(200)
      //   .json({ message: "Hooray, This Treatment journey is completed." });
      return false;
    }
  } else {
    await startNextStageItem(
      treatment_plan_stage_id,
      treatment_plan_stage_item_id
    );
  }
};

const updateTreatmentPlanStageStatus = async (req, res) => {
  const { treatment_plan_stage_item_id } = req.params;
  try {
    const status = await updateStageStatus(treatment_plan_stage_item_id);
    if (status == false) {
      return res
        .status(200)
        .json({ message: "Hooray, This Treatment journey is completed." });
    } else {
      res.status(200).json({
        message: "Treatment plan stage status updated successfully.",
      });
    }
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: err.message });
    // res.status(500).json({ message: "Oops, something went wrong!" });
  }
};

module.exports = {
  updateTreatmentPlanStageStatus,
  updateStageStatus,
};
