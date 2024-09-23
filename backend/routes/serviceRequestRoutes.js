const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/serviceRequestController');

router.get('/getservicerequestscount/:practice_id/:lab_id', serviceRequestController.getServiceRequestsCount);
router.get('/getservicerequests/:practice_id/:lab_id', serviceRequestController.getServiceRequests);
router.get('/getservicerequest/:practice_id/:lab_id/:service_id', serviceRequestController.getServiceRequestDetails)
router.put('/updatestatus/:practice_id/:service_id', serviceRequestController.updateServiceRequestStatus);
router.post('/:treatment_journey_id', serviceRequestController.createServiceRequest);

module.exports = router;