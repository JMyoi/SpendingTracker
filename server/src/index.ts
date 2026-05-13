import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import userRoutes from './routes/userRoutes';
import expenseRoutes from './routes/expenseRoutes';
import budgetRoutes from './routes/budgetRoutes';
import ocrRoutes from './routes/ocrRoutes';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use("/budget", budgetRoutes);
app.use("/ocr", ocrRoutes);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/users', userRoutes);
app.use('/expenses', expenseRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
