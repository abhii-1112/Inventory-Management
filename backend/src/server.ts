import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import sequelize from './config/database';
import User from './models/user';
import Category from './models/category';
import Product from './models/product';
import UploadJob from './models/uploadjobs';
import ReportJob from './models/reportjob';
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    await sequelize.sync({ alter: true });

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1); // stop the process — no point running an API with no DB
  }
}

startServer();