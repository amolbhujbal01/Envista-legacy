SELECT 
    CASE 
        WHEN tpsi.step_id = (
            SELECT 
                MAX(tpsi_inner.step_id)
            FROM 
                TreatmentPlanStageItem tpsi_inner
            WHERE 
                tpsi_inner.treatment_plan_stage_id = tpsi.treatment_plan_stage_id
        ) 
        THEN TRUE
        ELSE FALSE
    END AS is_last_item,
    tpsi.treatment_plan_stage_id
FROM 
    TreatmentPlanStageItem tpsi
WHERE 
    tpsi.treatment_plan_stage_item_id = :given_treatment_plan_stage_item_id;




UPDATE TreatmentPlanStage
SET status = 'COMPLETED'
WHERE treatment_plan_stage_id = (
    SELECT tpsi.treatment_plan_stage_id
    FROM TreatmentPlanStageItem tpsi
    WHERE tpsi.treatment_plan_stage_item_id = :given_treatment_plan_stage_item_id
);




UPDATE TreatmentPlanStage
SET status = 'IN_PROGRESS'
WHERE treatment_plan_stage_id = (
    SELECT MIN(tps.treatment_plan_stage_id)
    FROM TreatmentPlanStage tps
    WHERE tps.treatment_journey_id = (
        SELECT tj.treatment_journey_id
        FROM TreatmentPlanStageItem tpsi
        JOIN TreatmentPlanStage tps ON tpsi.treatment_plan_stage_id = tps.treatment_plan_stage_id
        JOIN TreatmentJourney tj ON tps.treatment_journey_id = tj.treatment_journey_id
        WHERE tpsi.treatment_plan_stage_item_id = :given_treatment_plan_stage_item_id
    )
    AND tps.stage_id > (
        SELECT tps_inner.stage_id
        FROM TreatmentPlanStageItem tpsi_inner
        JOIN TreatmentPlanStage tps_inner ON tpsi_inner.treatment_plan_stage_id = tps_inner.treatment_plan_stage_id
        WHERE tpsi_inner.treatment_plan_stage_item_id = :given_treatment_plan_stage_item_id
    )
);


UPDATE TreatmentPlanStageItem
SET status = 'IN_PROGRESS'
WHERE treatment_plan_stage_item_id = (
    SELECT MIN(tpsi.treatment_plan_stage_item_id)
    FROM TreatmentPlanStageItem tpsi
    WHERE tpsi.treatment_plan_stage_id = (
        SELECT MIN(tps.treatment_plan_stage_id)
        FROM TreatmentPlanStage tps
        WHERE tps.treatment_journey_id = (
            SELECT tj.treatment_journey_id
            FROM TreatmentPlanStageItem tpsi
            JOIN TreatmentPlanStage tps ON tpsi.treatment_plan_stage_id = tps.treatment_plan_stage_id
            JOIN TreatmentJourney tj ON tps.treatment_journey_id = tj.treatment_journey_id
            WHERE tpsi.treatment_plan_stage_item_id = :given_treatment_plan_stage_item_id
        )
        AND tps.stage_id > (
            SELECT tps_inner.stage_id
            FROM TreatmentPlanStageItem tpsi_inner
            JOIN TreatmentPlanStage tps_inner ON tpsi_inner.treatment_plan_stage_id = tps_inner.treatment_plan_stage_id
            WHERE tpsi_inner.treatment_plan_stage_item_id = :given_treatment_plan_stage_item_id
        )
    )
    ORDER BY tpsi.step_id ASC
    LIMIT 1
);



select treatment_plan_stage_item_id,stage_id,step_id,treatment_plan_stage_id,status from TreatmentPlanStageItem tpsi where patient_id =23 and treatment_journey_id = 28 ORDER by step_id;
select * from TreatmentPlanStage tps where patient_id =23 and treatment_journey_id = 28 ORDER by stage_id;
select treatment_plan_action_id,treatment_plan_stage_item_id,status,step_id from TreatmentPlanStageActionItems tpsai where procedure_action_id =9;

select * from ProcedureTemplate pt order by procedure_id ;


UPDATE TreatmentPlanStageItem tpsi
JOIN (
    SELECT tpsi_inner.treatment_plan_stage_item_id
    FROM TreatmentPlanStageItem tpsi_inner
    WHERE tpsi_inner.treatment_plan_stage_id = 164
      AND tpsi_inner.step_id > (
          SELECT step_id
          FROM TreatmentPlanStageItem
          WHERE treatment_plan_stage_item_id = 391
      )
    ORDER BY tpsi_inner.step_id ASC
    LIMIT 1
) AS next_item ON tpsi.treatment_plan_stage_item_id = next_item.treatment_plan_stage_item_id
SET tpsi.status = 'IN_PROGRESS';



select pm.procedure_id from ProcedureMap pm 
JOIN TreatmentPlanStageActionItems tpsai on pm.step_id = tpsai.step_id 
where tpsai.treatment_plan_action_id = :given_action_id and tpsai.treatment_plan_stage_item_id =:given_step_id;


select * from TreatmentPlanStageActionItems tpsai where step_id = 12 and isDownloadRequired = 1;


select pm.procedure_id,step_id from ProcedureMap pm; 

INSERT INTO envista.ProcedureActions
(action_name, isUploadRequired, fileExtension, isApproveRequired, isSentToLab, isMentorReviewRequired, isOrderConsumables, isDownloadRequired)
VALUES('Review + Upload', 1, null, 0, 0, 1, 0, 0);


update ProcedureTemplate set procedure_name ="Request for Surgical Plan" , procedure_action_id = 11 where procedure_id =5 and sequence_id =5;


update ProcedureTemplate set procedure_name ="Upload Upper Arch Intraoral Scan" where procedure_id =13 and sequence_id =1;
update ProcedureTemplate set procedure_name ="Upload Lower Arch Intraoral Scan" where procedure_id =13 and sequence_id =2;

update ProcedureTemplate set procedure_name ="Upload Surgical Plan (Optional)" where procedure_id =5 and sequence_id =6;

ALTER TABLE Patient
MODIFY pms_id TEXT;

describe Patient ;


