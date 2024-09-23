const s3Service = require("../services/s3Service");
const dbService = require("../services/dbService");

const validateRequiredFields = (fields, res) => {
  for (const [field, value] of Object.entries(fields)) {
    if (!value) {
      res.status(400).send(`Missing required field: ${field}`);
      return false;
    }
  }
  return true;
};

exports.getUploadPresignedUrl = async (req, res) => {
  const {
    filename,
    fileType,
    patient_id,
    journey_id,
    workflow_id,
    stage_id,
    step_id,
    action_id,
  } = req.body;
  const { user } = req;

  if (
    !validateRequiredFields(
      {
        filename,
        fileType,
        patient_id,
        journey_id,
        workflow_id,
        stage_id,
        step_id,
        action_id,
      },
      res
    )
  )
    return;
  try {
    // Query to get the tenant_id and practice_id
    const userPracticeQuery = `
      SELECT tenant_id, practice_id
      FROM UserPractice
      WHERE tenant_id = ?
    `;
    const userPracticeResults = await dbService.query(userPracticeQuery, [
      user.sub,
    ]);

    if (userPracticeResults.length === 0) {
      return res
        .status(404)
        .json({
          error: "User practice not found. Please check your account details.",
        });
    }

    const { tenant_id, practice_id } = userPracticeResults[0];

    // Query to get the dental_practice_id
    const dentalPracticeQuery = `
      SELECT dental_practice_id
      FROM Dental_Practice
      WHERE tenant_id = ? AND practice_id = ?
    `;
    const dentalPracticeResults = await dbService.query(dentalPracticeQuery, [
      tenant_id,
      practice_id,
    ]);

    if (dentalPracticeResults.length === 0) {
      return res
        .status(404)
        .json({
          error:
            "Dental practice not found. Please check your practice details.",
        });
    }

    const { dental_practice_id } = dentalPracticeResults[0];
    // const dental_practice_id=1;

    // Construct the filename with the dental practice ID and journey ID
    const fullFilename = `dental_practice/${dental_practice_id}/patient/${patient_id}/journey/${journey_id}/workflow/${workflow_id}/stage/${stage_id}/step/${step_id}/action/${action_id}/${Date.now()}_${filename}`;

    // Generate the presigned URL
    const presignedUrl = await s3Service.getUploadPresignedUrl(
      fullFilename,
      fileType
    );

    res.status(200).json({
      message: "Presigned URL generated successfully",
      presignedUrl,
      fullFilename,
    });
  } catch (err) {
    console.error("Error:", err);
    res
      .status(500)
      .json({ error: "Oops! Something went wrong. Please try again later." });
  }
};

exports.uploadSuccess = async (req, res) => {
  const { filename, patient_id, step_id, action_id } = req.body;
  const { user } = req;

  if (
    !validateRequiredFields({ filename, patient_id, step_id, action_id }, res)
  )
    return;

  try {
    // Verify file exists in S3
    await s3Service.verifyFileExists(filename);

    const fileURL = s3Service.getS3FileURL(filename);
    console.log("S3 File URL:", fileURL);
    // Insert into ImageRepository table
    const imageRepoInsertQuery = `
      INSERT INTO ImageRepository (tenant_id, Active, s3URL)
      VALUES (?, ?, ?)
    `;
    const imageRepoResult = await dbService.query(imageRepoInsertQuery, [
      user.sub,
      true,
      fileURL,
    ]);

    const image_repository_id = imageRepoResult.insertId;

    // Update TreatmentPlanStageActions
    const treatmentPlanUpdateQuery = `
      UPDATE TreatmentPlanStageActionItems 
      SET image_repository_id = ?, status = ?
      WHERE patient_id = ? AND treatment_plan_stage_item_id = ? AND treatment_plan_action_id = ?
    `;
    const updateResult = await dbService.query(treatmentPlanUpdateQuery, [
      image_repository_id,
      "COMPLETED",
      patient_id,
      step_id,
      action_id,
    ]);
    // console.log(updateResult);
    if (updateResult.affectedRows === 0) {
      return res
        .status(404)
        .json({
          error: "Failed to update. Please verify the details and try again.",
        });
    }

    // Respond with JSON
    res.status(200).json({
      message: "File verified and Inserted successfully",
      fileURL: fileURL,
    });
  } catch (err) {
    console.error("Error:", err);
    res
      .status(500)
      .json({ error: "Oops! Something went wrong. Please try again later." });
  }
};

exports.downloadFile = async (req, res) => {
  const { user } = req;
  const { patient_id, step_id, action_id } = req.query;

  try {
    // Query to get the procedure_id based on step_id and action_id
    const procedure_query = `
      SELECT pm.procedure_id 
      FROM ProcedureMap pm 
      JOIN TreatmentPlanStageActionItems tpsai ON pm.step_id = tpsai.step_id 
      WHERE tpsai.treatment_plan_action_id = ? 
        AND tpsai.treatment_plan_stage_item_id = ?
        AND tpsai.patient_id = ?
    `;

    const procedureResults = await dbService.query(procedure_query, [
      action_id,
      step_id,
      patient_id
    ]);

    let presignedUrl;
    let fileURL;
    let procedureHandled = false;

    // Handle different procedure_id cases
    if (procedureResults.length > 0) {
      const { procedure_id } = procedureResults[0];
      console.log(procedure_id);

      switch (procedure_id) {
        case 3:
        case 4:
          fileURL =
            "https://envista-test.s3.amazonaws.com/sample-files/Exocad-Smile-Design.zip";
          procedureHandled = true;
          break;
        case 6:
          fileURL =
            "https://envista-test.s3.amazonaws.com/sample-files/Surgical-Plan.zip";
          procedureHandled = true;
          break;
        case 12:
          fileURL = "https://envista-test.s3.amazonaws.com/sample-files/Temporary-Prosthetic-Design.zip";
          procedureHandled = true;
          break;
        case 15:
          fileURL = "https://envista-test.s3.amazonaws.com/sample-files/Final-Prosthetic-Design.zip";
          procedureHandled = true;
          break;
        default:
          procedureHandled = false;
          break;
      }

      if (procedureHandled) {
        // Generate presigned URL from the fileURL
        presignedUrl = await s3Service.getPresignedUrl(fileURL);

        // Update the TreatmentPlanStageActionItems table if presigned URL was generated
        if (presignedUrl) {
          const treatmentPlanUpdateQuery = `
            UPDATE TreatmentPlanStageActionItems 
            SET status = 'COMPLETED'
            WHERE patient_id = ? AND treatment_plan_stage_item_id = ? AND treatment_plan_action_id = ?
          `;

          await dbService.query(treatmentPlanUpdateQuery, [
            patient_id,
            step_id,
            action_id,
          ]);
        }
      }
    }

    // If procedure_id is not handled, proceed with the join query
    if (!procedureHandled || !presignedUrl) {
      // Query to join TreatmentPlanStageActionItems and ImageRepository tables
      const joinedQuery = `
        SELECT ir.s3URL
        FROM TreatmentPlanStageActionItems tpa
        JOIN ImageRepository ir ON tpa.image_repository_id = ir.image_repository_id
        WHERE tpa.patient_id = ? 
          AND tpa.treatment_plan_stage_item_id = ? 
          AND tpa.treatment_plan_action_id = ?
      `;

      const joinedResults = await dbService.query(joinedQuery, [
        patient_id,
        step_id,
        action_id,
      ]);

      if (joinedResults.length === 0) {
        return res.status(404).json({
          error: "Image not found. Please verify the details and try again.",
        });
      }

      const { s3URL } = joinedResults[0];

      // Generate presigned URL from the s3URL
      presignedUrl = await s3Service.getPresignedUrl(s3URL);
    }

    // Respond with JSON
    res.status(200).json({
      message: "Presigned URL generated successfully",
      presignedUrl,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Oops! Something went wrong. Please try again later." });
  }
};

exports.listImageRepository = async (req, res) => {
  const { patient_id } = req.params;

  const { user } = req;

  if (!validateRequiredFields({ patient_id }, res)) return;

  try {
    // Query to get the tenant_id and practice_id
    const userPracticeQuery = `
      SELECT tenant_id, practice_id
      FROM UserPractice
      WHERE tenant_id = ?
    `;
    const userPracticeResults = await dbService.query(userPracticeQuery, [
      user.sub,
    ]);

    if (userPracticeResults.length === 0) {
      return res
        .status(404)
        .json({
          error: "User practice not found. Please check your account details.",
        });
    }

    const { tenant_id, practice_id } = userPracticeResults[0];

    // Query to get the dental_practice_id
    const dentalPracticeQuery = `
      SELECT dental_practice_id
      FROM Dental_Practice
      WHERE tenant_id = ? AND practice_id = ?
    `;
    const dentalPracticeResults = await dbService.query(dentalPracticeQuery, [
      tenant_id,
      practice_id,
    ]);

    if (dentalPracticeResults.length === 0) {
      return res
        .status(404)
        .json({
          error:
            "Dental practice not found. Please check your practice details.",
        });
    }

    const { dental_practice_id } = dentalPracticeResults[0];
    const query = `
      SELECT 
        tpsai.treatment_plan_action_id,
        tpsai.treatment_plan_stage_item_id,
        tpsi.treatment_plan_stage_id,
        tps.workflow_id as workflow_id,
        ir.image_repository_id,
        ir.s3URL,
        ir.version_id,
        ir.created_at,
        u.name AS Clinician,
        tj.treatment_journey_id,
        tj.name as treatment_journey_name,
        w.name AS workflow_name,
        s.name AS stage_name,
        si.name AS step_name
      FROM 
        TreatmentPlanStageActionItems tpsai
      JOIN 
        ImageRepository ir ON tpsai.image_repository_id = ir.image_repository_id
      JOIN 
        TreatmentPlanStageItem tpsi ON tpsai.treatment_plan_stage_item_id = tpsi.treatment_plan_stage_item_id
      JOIN 
        TreatmentPlanStage tps ON tpsi.treatment_plan_stage_id = tps.treatment_plan_stage_id
      JOIN 
        TreatmentJourney tj ON tps.treatment_journey_id = tj.treatment_journey_id
      JOIN 
        User u ON tj.tenant_id = u.tenant_id
      JOIN 
        Workflow w ON tps.workflow_id = w.workflow_id
      JOIN 
        Stage s ON tps.stage_id = s.stage_id
      JOIN 
        StageItem si ON s.stage_id = si.stage_id
      WHERE 
        tpsai.patient_id = ? AND tj.dental_practice_id = ?
      GROUP BY
         ir.image_repository_id
    `;

    const results = await dbService.query(query, [
      patient_id,
      dental_practice_id,
    ]);

    const processedResults = results.map((row) => {
      const s3Url = row.s3URL;
      const lastFilename = decodeURIComponent(
        s3Url.substring(s3Url.lastIndexOf("/") + 1)
      );
      const Filename = lastFilename
        .split("/")
        .pop()
        .split("_")
        .slice(1)
        .join("_");
              
      return {
        treatment_plan_action_id: row.treatment_plan_action_id,
        treatment_plan_stage_item_id: row.treatment_plan_stage_item_id,
        treatment_plan_stage_id: row.treatment_plan_stage_id,
        workflow_id: row.workflow_id,
        image_repository_id: row.image_repository_id,
        filename: Filename,
        version_id: row.version_id,
        Clinician: row.Clinician,
        treatment_journey_id: row.treatment_journey_id,
        treatment_journey_name: row.treatment_journey_name,
        workflow_name: row.workflow_name,
        stage_name: row.stage_name,
        step_name: row.step_name,
        created_date:  row.created_at
      };
    });

    res.status(200).json(processedResults);
  } catch (err) {
    console.error("Error fetching image repository:", err);
    res.status(500).json({ error: "Failed to fetch image repository data." });
  }
};

exports.setImageFromRepository = async (req, res) => {
  const { image_repository_id, patient_id, treatment_plan_stage_item_id } =
    req.body;
  const { treatment_plan_action_id } = req.params;

  if (
    !validateRequiredFields(
      {
        image_repository_id,
        patient_id,
        treatment_plan_stage_item_id,
        treatment_plan_action_id,
      },
      res
    )
  )
    return;

  try {
    const treatmentPlanUpdateQuery = `
      UPDATE TreatmentPlanStageActionItems 
      SET image_repository_id = ?, status = ?
      WHERE patient_id = ? AND treatment_plan_stage_item_id = ? AND treatment_plan_action_id = ?
    `;

    const updateResult = await dbService.query(treatmentPlanUpdateQuery, [
      image_repository_id,
      "COMPLETED",
      patient_id,
      treatment_plan_stage_item_id,
      treatment_plan_action_id,
    ]);

    if (updateResult.affectedRows === 0) {
      return res
        .status(404)
        .json({
          error: "No matching record found to update. Please check your input.",
        });
    }

    res.status(200).json({
      message: "Image inserted from Image repository successfully",
    });
  } catch (err) {
    console.error("Error updating TreatmentPlanStageActionItems:", err);
    res
      .status(500)
      .json({ error: "Failed to Insert Image from Image Repository." });
  }
};

exports.uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const { user } = req;
  const { patient_id, journey_id, workflow_id, stage_id, step_id, action_id } =
    req.body;

  try {
    // Query to get the tenant_id and practice_id
    const userPracticeQuery = `
      SELECT tenant_id, practice_id
      FROM UserPractice
      WHERE tenant_id = ?
    `;
    const userPracticeResults = await dbService.query(userPracticeQuery, [
      user.sub,
    ]);

    if (userPracticeResults.length === 0) {
      return res
        .status(404)
        .json({
          error: "User practice not found. Please check your account details.",
        });
    }

    const { tenant_id, practice_id } = userPracticeResults[0];

    // Query to get the dental_practice_id
    const dentalPracticeQuery = `
      SELECT dental_practice_id
      FROM Dental_Practice
      WHERE tenant_id = ? AND practice_id = ?
    `;
    const dentalPracticeResults = await dbService.query(dentalPracticeQuery, [
      tenant_id,
      practice_id,
    ]);

    if (dentalPracticeResults.length === 0) {
      return res
        .status(404)
        .json({
          error:
            "Dental practice not found. Please check your practice details.",
        });
    }

    const { dental_practice_id } = dentalPracticeResults[0];

    // Construct the filename with the dental practice ID and journey ID
    const filename = `dental_practice/${dental_practice_id}/patient/${patient_id}/journey/${journey_id}/workflow/${workflow_id}/stage/${stage_id}/step/${step_id}/action/${action_id}/${Date.now()}_${
      req.file.originalname
    }`;

    // Upload file to S3
    const s3Data = await s3Service.uploadFile(req.file, filename);

    // Insert into ImageRepository table
    const imageRepoInsertQuery = `
      INSERT INTO ImageRepository (tenant_id, Active, s3URL)
      VALUES (?, ?, ?)
    `;
    const imageRepoResult = await dbService.query(imageRepoInsertQuery, [
      user.sub,
      true,
      s3Data.Location,
    ]);

    const image_repository_id = imageRepoResult.insertId;
    console.log("Image Repository ID:", image_repository_id);

    // Update TreatmentPlanStageActionItems
    const treatmentPlanUpdateQuery = `
      UPDATE TreatmentPlanStageActionItems 
      SET image_repository_id = ?, status = 'COMPLETED'
      WHERE patient_id = ? AND workflow_id = ? AND treatment_plan_stage_item_id = ? AND treatment_plan_action_id = ?
    `;
    const updateResult = await dbService.query(treatmentPlanUpdateQuery, [
      image_repository_id,
      patient_id,
      workflow_id,
      stage_id,
      action_id,
    ]);

    // console.log("Update Result:", updateResult);

    if (updateResult.affectedRows === 0) {
      return res
        .status(404)
        .json({
          error:
            "Failed to update TreatmentPlanStageActions. Please verify the details and try again.",
        });
    }

    // Respond with JSON
    res.status(200).json({
      message: "File uploaded successfully",
      fileURL: s3Data.Location,
    });
  } catch (err) {
    console.error("Error:", err);
    res
      .status(500)
      .json({ error: "Oops! Something went wrong. Please try again later." });
  }
};
