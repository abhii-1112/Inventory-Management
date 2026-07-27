import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import userRoutes from './routes/userroutes';
import categoryRoutes from './routes/categoryroutes';
import productRoutes from './routes/productroutes';
import bulkUploadRoutes from './routes/bulkuploadroutes';
import reportRoutes from './routes/reportroutes'

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload-jobs', bulkUploadRoutes);
app.use('/api/reports', reportRoutes);

export default app;