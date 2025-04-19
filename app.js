import express from 'express';
import tasksRouter from './routes/tasks.js';
import { json } from 'express';

const app = express();
app.use(json());

app.use('/tasks', tasksRouter);

export default app;
