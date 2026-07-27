import { Router } from 'express';
import { requestReport, getReportStatus, downloadReport } from '../controllers/reportcontroller';

const router = Router();

router.post('/', requestReport);
router.get('/:jobId', getReportStatus);
router.get('/:jobId/download', downloadReport);

export default router;