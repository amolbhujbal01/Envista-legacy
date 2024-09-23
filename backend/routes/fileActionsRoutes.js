const express = require('express');
const multer = require('multer');
const fileActionsController = require('../controllers/fileActionsController');
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10 GB limit
});

router.post('/upload', upload.single('file'), fileActionsController.uploadFile);
router.post('/generate-presigned-url', fileActionsController.getUploadPresignedUrl);
router.post('/upload-success', fileActionsController.uploadSuccess);
router.get('/download', fileActionsController.downloadFile);
router.get('/image-repository/:patient_id', fileActionsController.listImageRepository);
router.post('/image-repository/:treatment_plan_action_id', fileActionsController.setImageFromRepository);

module.exports = router;
