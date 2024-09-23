const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');

router.post('/createPatient', patientController.insertPatient);
router.get('/', patientController.getAllPatients);
router.get('/:patient_id', patientController.getPatientById);

module.exports = router;
