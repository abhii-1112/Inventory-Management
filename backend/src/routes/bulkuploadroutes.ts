import { Router } from 'express';
import uploadFile from '../middleware/uploadfile';
import { bulkUploadProducts, getUploadJobStatus } from '../controllers/bulkuploadcontroller';

const router = Router();

router.post('/upload', uploadFile.single('file'), bulkUploadProducts);
router.get('/:jobId', getUploadJobStatus);

export default router;