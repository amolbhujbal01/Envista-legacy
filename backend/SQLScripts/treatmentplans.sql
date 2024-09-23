CREATE TABLE `ImageRepository` (
  `image_repository_id` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `tenant_id` VARCHAR(255),
  `Active` BOOLEAN,
  `version_id` INT,
  `s3URL` TEXT
);

CREATE TABLE `TreatmentJourney` (
  `treatment_journey_id` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `tenant_id` VARCHAR(255),
  `workflow_id` INT,
  `patient_id` INT NOT NULL,
  `dental_practice_id` INT NOT NULL,
  `status` VARCHAR(255),
  `start_date` DATE,
  `end_date` DATE,
  `priority` VARCHAR(255),
  `clinical_notes` TEXT,
  FOREIGN KEY (`workflow_id`) REFERENCES `Workflow`(`workflow_id`), 
  FOREIGN KEY (`patient_id`) REFERENCES `Patient`(`patient_id`), 
  FOREIGN KEY (`dental_practice_id`) REFERENCES `Dental_Practice`(`dental_practice_id`) 
);

CREATE TABLE `TreatmentPlanStage` (
  `treatment_plan_stage_id` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `stage_id` INT NOT NULL,
  `workflow_id` INT NOT NULL,
  `patient_id` INT NOT NULL,
  `treatment_journey_id` INT NOT NULL,
  `status` VARCHAR(255),
  `isSkipped` BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (`stage_id`) REFERENCES `Stage`(`stage_id`), 
  FOREIGN KEY (`workflow_id`) REFERENCES `Workflow`(`workflow_id`), 
  FOREIGN KEY (`patient_id`) REFERENCES `Patient`(`patient_id`), 
  FOREIGN KEY (`treatment_journey_id`) REFERENCES `TreatmentJourney`(`treatment_journey_id`)
);

CREATE TABLE `TreatmentPlanStageItem` (
  `tenant_id` VARCHAR(255),
  `treatment_plan_stage_item_id` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `stage_id` INT NOT NULL,
  `step_id` INT NOT NULL,
  `workflow_id` INT NOT NULL,
  `patient_id` INT NOT NULL,
  `treatment_plan_stage_id` INT NOT NULL,
  `status` VARCHAR(255),
  FOREIGN KEY (`stage_id`) REFERENCES `Stage`(`stage_id`), 
  FOREIGN KEY (`step_id`) REFERENCES `StageItem`(`step_id`), 
  FOREIGN KEY (`workflow_id`) REFERENCES `Workflow`(`workflow_id`), 
  FOREIGN KEY (`patient_id`) REFERENCES `Patient`(`patient_id`), 
  FOREIGN KEY (`treatment_plan_stage_id`) REFERENCES `TreatmentPlanStage`(`treatment_plan_stage_id`)
);

CREATE TABLE `TreatmentPlanStageItemNotes` (
  `note_id` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `tenant_id` VARCHAR(255),
  `stage_id` INT NOT NULL,
  `workflow_id` INT NOT NULL,
  `patient_id` INT NOT NULL,
  `note` TEXT,
  FOREIGN KEY (`stage_id`) REFERENCES `Stage`(`stage_id`), 
  FOREIGN KEY (`workflow_id`) REFERENCES `Workflow`(`workflow_id`), 
  FOREIGN KEY (`patient_id`) REFERENCES `Patient`(`patient_id`) 
);

CREATE TABLE `TreatmentPlanStageActions` (
  `treatment_plan_action_id` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `tenant_id` VARCHAR(255),
  `treatment_plan_stage_item_id` INT NOT NULL,
  `step_id` INT NOT NULL,
  `workflow_id` INT NOT NULL,
  `patient_id` INT NOT NULL,
  `image_repository_id` INT NOT NULL,
  `action_id` INT NOT NULL,
  `isApproved` BOOLEAN NOT NULL,
  `isImageUploaded` BOOLEAN NOT NULL,
  FOREIGN KEY (`treatment_plan_stage_item_id`) REFERENCES `TreatmentPlanStageItem`(`treatment_plan_stage_item_id`),
  FOREIGN KEY (`step_id`) REFERENCES `StageItem`(`step_id`), 
  FOREIGN KEY (`workflow_id`) REFERENCES `Workflow`(`workflow_id`), 
  FOREIGN KEY (`patient_id`) REFERENCES `Patient`(`patient_id`), 
  FOREIGN KEY (`image_repository_id`) REFERENCES `ImageRepository`(`image_repository_id`)
);


INSERT INTO `TreatmentJourney` (
  `tenant_id`,
  `workflow_id`,
  `patient_id`,
  `dental_practice_id`,
  `status`,
  `start_date`,
  `end_date`,
  `priority`,
  `clinical_notes`
) VALUES (
  'e49824e8-5081-70ee-1f8a-0448058d59ce', 
  1, 
  1,
  1, 
  'In Progress', 
  '2024-07-31', 
  '2024-08-31', 
  'High',
  'Initial consultation and treatment planning'
);

select * from TreatmentPlanStageActions;
select * from TreatmentPlanStageItem;
select * from TreatmentPlanStage;
select * from TreatmentJourney;
select * from ImageRepository;
select * from Patient;


select * from TreatmentPlanStage where treatment_journey_id=1;

delete from TreatmentJourney where priority ='High';

set foreign_key_checks=0;
truncate table TreatmentJourney;
truncate table TreatmentPlanStageActions;
truncate table TreatmentPlanStageItem;
truncate table TreatmentPlanStage;
truncate table ImageRepository;
set foreign_key_checks=1;
