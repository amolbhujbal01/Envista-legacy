const dbService = require("../services/dbService");

const executeQuery = async (query, values) => {
  try {
    return await dbService.query(query, values);
  } catch (err) {
    console.error("Database error:", err);
    throw new Error("Oops, Something went wrong!");
  }
};

const insertTreatmentPlanStage = async (
  treatment_journey_id,
  workflow_id,
  patient_id,
  user,
  res
) => {
  const tenant_id = user.sub;

  if (!treatment_journey_id) {
    throw new Error("Missing required fields");
  }

  try {
    const stages = await getStagesByWorkflowId(workflow_id);
    if (stages.length === 0) {
      throw new Error("Stages not found for the given workflow");
    }

    const stageInsertPromises = stages.map(async (stage) => {
      const treatment_plan_stage_id = await insertStage({
        stage_id: stage.stage_id,
        workflow_id,
        patient_id,
        treatment_journey_id,
      });

      const steps = await getStepsByStageId(stage.stage_id);
      if (steps.length === 0) {
        throw new Error("Steps not found for the given stage");
      }

      const stepInsertPromises = steps.map(async (step) => {
        const treatment_plan_stage_item_id = await insertStep({
          tenant_id,
          stage_id: stage.stage_id,
          step_id: step.step_id,
          workflow_id,
          treatment_plan_stage_id,
          patient_id,
          treatment_journey_id
        });

        const procedureMap = await getProcedureMap(step.step_id);
        if (procedureMap.length === 0) {
          console.log("Step could not be linked to Procedure");
          return;
        }

        const procedureTemplate = await getProcedureTemplate(procedureMap[0].procedure_id);

        const actionInsertPromises = procedureTemplate.map(async (procedureAction) => {
          const procedureActions = await getProcedureActions(procedureAction.procedure_action_id);
          await insertActionItems(procedureActions, procedureAction, treatment_plan_stage_item_id, workflow_id, step.step_id, patient_id);
        });

        await Promise.all(actionInsertPromises);
      });

      await Promise.all(stepInsertPromises);
    });

    await Promise.all(stageInsertPromises);
  } catch (err) {
    console.error(err);
    throw new Error(err.message);
  }
};

const getStagesByWorkflowId = async (workflow_id) => {
  const query = `
    SELECT stage_id
    FROM Stage
    WHERE workflow_id = ?
  `;
  return executeQuery(query, [workflow_id]);
};

const insertStage = async ({
  stage_id,
  workflow_id,
  patient_id,
  treatment_journey_id,
}) => {
  const query = `
    INSERT INTO TreatmentPlanStage (stage_id, workflow_id, patient_id, treatment_journey_id, status, isSkipped)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const result = await executeQuery(query, [
    stage_id,
    workflow_id,
    patient_id,
    treatment_journey_id,
    "NOT_STARTED",
    false,
  ]);
  return result.insertId;
};

const getStepsByStageId = async (stage_id) => {
  const query = `
    SELECT step_id
    FROM StageItem
    WHERE stage_id = ?
  `;
  return executeQuery(query, [stage_id]);
};

const insertStep = async ({
  tenant_id,
  stage_id,
  step_id,
  workflow_id,
  treatment_plan_stage_id,
  patient_id,
  treatment_journey_id
}) => {
  const query = `
    INSERT INTO TreatmentPlanStageItem (tenant_id, stage_id, step_id, workflow_id, treatment_plan_stage_id, patient_id, status, treatment_journey_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await executeQuery(query, [
    tenant_id,
    stage_id,
    step_id,
    workflow_id,
    treatment_plan_stage_id,
    patient_id,
    "NOT_STARTED",
    treatment_journey_id
  ]);
  return result.insertId;
};

const getProcedureMap = async (step_id) => {
  const query = `
    SELECT procedure_id FROM ProcedureMap WHERE step_id = ?
  `;
  return executeQuery(query, [step_id]);
};

const getProcedureTemplate = async (procedure_id) => {
  const query = `
    SELECT procedure_action_id, procedure_name FROM ProcedureTemplate WHERE procedure_id = ? ORDER BY sequence_id
  `;
  return executeQuery(query, [procedure_id]);
};

const getProcedureActions = async (procedure_action_id) => {
  const query = `
    SELECT * FROM ProcedureActions WHERE procedure_action_id = ?
  `;
  return executeQuery(query, [procedure_action_id]);
};

const insertActionItems = async (procedureActions, procedureAction, treatment_plan_stage_item_id, workflow_id, step_id, patient_id) => {
  const query = `
    INSERT INTO TreatmentPlanStageActionItems (procedure_action_id, treatment_plan_stage_item_id, workflow_id, step_id, patient_id, isUploadRequired, fileExtension, image_repository_id, isApproveRequired, isSendToLab, isMentorReviewRequired, isOrderConsumables, status, isDownloadRequired)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  const actionItemsPromises = procedureActions.map(async (action_item) => {
    return executeQuery(query, [
      procedureAction.procedure_action_id,
      treatment_plan_stage_item_id,
      workflow_id,
      step_id,
      patient_id,
      action_item.isUploadRequired,
      action_item.fileExtension,
      null,
      action_item.isApproveRequired,
      action_item.isSentToLab,
      action_item.isMentorReviewRequired,
      action_item.isOrderConsumables,
      'NOT_STARTED',
      action_item.isDownloadRequired
    ]);
  });

  await Promise.all(actionItemsPromises);
};

module.exports = {
  insertTreatmentPlanStage
};
