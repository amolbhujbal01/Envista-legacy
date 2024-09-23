const express = require('express');
const router = express.Router();
const treatmentJourneyController = require('../controllers/treatmentJourneyController');

router.post('/createTreatmentJourney/:patient_id', treatmentJourneyController.createTreatmentJourney);
router.get('/:patient_id', treatmentJourneyController.getTreatmentJourneysForPatient);
router.put('/updateWorkflowId/:treatment_journey_id', treatmentJourneyController.updateWorkflowId);
router.get('/getpatientjourneyplan/:patient_id/:journey_id', treatmentJourneyController.GetTreatmentJourneyPlanForPatient);
router.put('/skip-stage/:patient_id/:journey_id/:workflow_id/:treatment_plan_stage_id', treatmentJourneyController.SkipTreatmentPlanStage);
router.put('/step/complete/:treatment_plan_stage_item_id', treatmentJourneyController.updateTreatmentPlanStageStatus);
router.put('/step/action/complete/:treatment_plan_action_id', treatmentJourneyController.updateActionStatus);
router.get('/step/:patient_id', treatmentJourneyController.getStepActions);
router.get('/start-journey/:treatment_journey_id', treatmentJourneyController.updateJourneyStatus);
router.put('/complete-journey/:patient_id/:treatment_journey_id', treatmentJourneyController.updateTreatmentJourneyStatusIfCompleted);

module.exports = router;
