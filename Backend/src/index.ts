import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
// import dashboardRoutes from './routes/dashboardRoutes.js';
import permitRoutes from './routes/permitRoutes.js';
// import vehicleRoutes from './routes/vehicleRoutes.js';
// import reportRoutes from './routes/reportRoutes.js';
// import activityRoutes from './routes/activityRoutes.js';
import mlRoutes from './routes/mlRoutes.js';
import cameraRoutes from './routes/cameraRoutes.js';
import streamRoutes from './routes/streamRoutes.js';
import authRoutes from './routes/authRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import violationsRoutes from './routes/violationsRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationRoutes);
// app.use('/api/dashboard', dashboardRoutes);
app.use('/api/permits', permitRoutes);
// app.use('/api/reports', reportRoutes);
// app.use('/api/vehicles', vehicleRoutes);
// app.use('/api/activity', activityRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/violations', violationsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('CPMS Backend API is running');
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
