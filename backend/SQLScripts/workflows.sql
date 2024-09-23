CREATE TABLE `Workflow` (
  `workflow_id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `status` varchar(255),
  `name` varchar(255),
  `description` varchar(255),
  `conditionsTreated` varchar(255),
  `duration` int,
  `noOfStages` int
);

CREATE TABLE `Stage` (
  `stage_id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `workflow_id` int NOT NULL,
  `sequence_id` int,
  `name` varchar(255),
  `description` varchar(255),
  `isSkippable` boolean
);

CREATE TABLE `StageItem` (
  `step_id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `stage_id` int NOT NULL,
  `sequence_id` int,
  `name` varchar(255),
  `description` varchar(255)
);

CREATE TABLE `StageItemAction` (
  `action_id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `step_id` int NOT NULL,
  `isFileUploadRequired` boolean,
  `isApprovalRequired` boolean,
  `sequence_id` int
);

ALTER TABLE `Stage` ADD FOREIGN KEY (`workflow_id`) REFERENCES `Workflow` (`workflow_id`);
ALTER TABLE `StageItem` ADD FOREIGN KEY (`stage_id`) REFERENCES `Stage` (`stage_id`);
ALTER TABLE `StageItemAction` ADD FOREIGN KEY (`step_id`) REFERENCES `StageItem` (`step_id`);

alter table StageItemAction rename column isApproved to isApprovalRequired;

INSERT INTO Workflow (status, name, description, conditionsTreated, duration, noOfStages)
VALUES ('Ongoing', 'Full Arch', 'Comprehensive orthodontic care that includes braces, retainers, and follow-up appointments to correct misaligned teeth and malocclusion.', 'Malocclusion, Misaligned Teeth', 2, 5);
INSERT INTO Stage (workflow_id, sequence_id, name, description, isSkippable)
VALUES 
(1, 1, 'Preparation Phase', '', false),
(1, 2, 'Smile Design', '', false),
(1, 3, 'Pre-Surgery Phase', '', false),
(1, 4, 'Planning Phase', '', false),
(1, 5, 'Surgical Phase', '', false);
INSERT INTO StageItem ( stage_id, sequence_id, name, description)
VALUES 
(1, 1, 'Upload Images', ''),
( 2, 1, 'Integration and manual upload for sending scans to Smiley', ''),
( 2, 2, 'Approve / Reject or Resend scans', ''),
( 2, 3, 'Confirm 3D printing done (get a POP object)', ''),
( 3, 1, 'Temp prosthetic design', ''),
( 3, 2, 'Manufacture Temporary Prosthetics', ''),
( 4, 1, 'Surgery Plan', ''),
( 4, 2, 'Review by mentor and Approval by planning and add review comments', ''),
( 4, 3, 'Order Consumables', ''),
( 4, 4, 'Design Surgical template', ''),
( 4, 5, 'Manufacture template', ''),
( 5, 1, 'Upload Patient Photos', '');

INSERT INTO StageItemAction ( step_id, isFileUploadRequired, isApprovalRequired,sequence_id)
VALUES 
( 1, true, false,1),
( 1, true, false,2),
( 1, true, false,3),
( 2, true, false,1),
( 3, false, true,1),
( 4, false, true,1),
( 5, false, false,1),
( 6, false, false,1),
( 7, false, false,1),
( 8, false, true,1),
( 9, false, false,1),
( 10, false, false,1),
( 11, false, false,1),
( 12, true, false,1);

SELECT
  w.workflow_id,
  w.name AS workflow_name,
  w.status AS workflow_status,
  w.description AS workflow_description,
  w.conditionsTreated,
  w.duration AS workflow_duration,
  w.noOfStages,
  s.stage_id,
  s.sequence_id AS stage_sequence,
  s.name AS stage_name,
  s.description AS stage_description,
  s.isSkippable,
  si.step_id,
  si.sequence_id AS step_sequence,
  si.name AS step_name,
  si.description AS step_description,
  sa.action_id,
  sa.isFileUploadRequired,
  sa.isApprovalRequired
FROM Workflow w
LEFT JOIN Stage s ON w.workflow_id = s.workflow_id
LEFT JOIN StageItem si ON s.stage_id = si.stage_id
LEFT JOIN StageItemAction sa ON si.step_id = sa.step_id
ORDER BY w.workflow_id, s.sequence_id, si.sequence_id;

UPDATE Stage
SET isSkippable = true
WHERE stage_id = 2;

DROP TABLE IF EXISTS `TreatmentPlanStageActions`;
DROP TABLE IF EXISTS `TreatmentPlanStageItemNotes`;
DROP TABLE IF EXISTS `TreatmentPlanStageItem`;
DROP TABLE IF EXISTS `TreatmentPlanStage`;
DROP TABLE IF EXISTS `TreatmentJourney`;
DROP TABLE IF EXISTS `ImageRepository`;
DROP TABLE IF EXISTS `StageItemAction`;
DROP TABLE IF EXISTS `StageItem`;
DROP TABLE IF EXISTS `Stage`;
DROP TABLE IF EXISTS `Workflow`;

select * from ProcedureTemplate pt ;
SELECT * FROM TreatmentPlanStageActionItems where patient_id =23;
SELECT * FROM TreatmentPlanStageItem where treatment_plan_stage_item_id =16;
select * from `User` order by created_at desc;


SELECT *
      FROM TreatmentPlanStageActionItems tpa
      JOIN ImageRepository ir ON tpa.image_repository_id = ir.image_repository_id
      WHERE tpa.patient_id = 23 AND tpa.treatment_plan_stage_item_id =16  AND tpa.treatment_plan_action_id = 28;

 select * from ImageRepository ir ;


SELECT 
    tpsai.treatment_plan_action_id,
    tpsai.treatment_plan_stage_item_id,
    tpsi.treatment_plan_stage_id,
    w.workflow_id,
    ir.image_repository_id,
    ir.S3URL,
    ir.version_id,
--     u.user_id,
    u.name AS "Clinician",
    tj.treatment_journey_id,
    tj.name,
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
    tpsai.patient_id = 23 AND tj.dental_practice_id =1;

select step_id from TreatmentPlanStageItem;

select * from TreatmentPlanStageActionItems tpsai  where patient_id = 23 and isUploadRequired = true;

SELECT * from TreatmentPlanStageItem where patient_id =23;

SELECT 
    tpsi.treatment_plan_stage_item_id,
    tpsi.treatment_plan_stage_id,
    CASE 
        WHEN tpsi.treatment_plan_stage_item_id = (
            SELECT 
                MAX(tpsi_inner.treatment_plan_stage_item_id)
            FROM 
                TreatmentPlanStageItem tpsi_inner
            WHERE 
                tpsi_inner.treatment_plan_stage_id = tpsi.treatment_plan_stage_id
        ) 
        THEN TRUE
        ELSE FALSE
    END AS is_last_item
FROM 
    TreatmentPlanStageItem tpsi
WHERE 
    tpsi.treatment_plan_stage_item_id = :given_treatment_plan_stage_item_id;
   
  
UPDATE TreatmentJourney
SET status = 'IN_PROGRESS'
WHERE treatment_journey_id = :treatment_journey_id;

UPDATE TreatmentPlanStage
JOIN (
    SELECT MIN(tps_inner.treatment_plan_stage_id) AS id
    FROM TreatmentPlanStage tps_inner
    WHERE tps_inner.treatment_journey_id = :treatment_journey_id
) AS derived
ON TreatmentPlanStage.treatment_plan_stage_id = derived.id
SET TreatmentPlanStage.status = 'IN_PROGRESS';

UPDATE TreatmentPlanStageItem
JOIN (
    SELECT MIN(tpsi_inner.treatment_plan_stage_item_id) AS id
    FROM TreatmentPlanStageItem tpsi_inner
    JOIN TreatmentPlanStage tps_inner ON tpsi_inner.treatment_plan_stage_id = tps_inner.treatment_plan_stage_id
    WHERE tps_inner.treatment_journey_id = :treatment_journey_id
    AND tpsi_inner.treatment_plan_stage_id = (
        SELECT MIN(tps_stage_inner.treatment_plan_stage_id)
        FROM TreatmentPlanStage tps_stage_inner
        WHERE tps_stage_inner.treatment_journey_id = :treatment_journey_id
    )
) AS derived ON TreatmentPlanStageItem.treatment_plan_stage_item_id = derived.id
SET TreatmentPlanStageItem.status = 'IN_PROGRESS';



SET foreign_key_checks = 0;
truncate table TreatmentJourney;
truncate table TreatmentPlanStage;
truncate table TreatmentPlanStageActionItems;
TRUNCATE table TreatmentPlanStageItem;
truncate table ImageRepository;
SET foreign_key_checks = 1;




