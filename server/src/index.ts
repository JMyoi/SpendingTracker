import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import userRoutes from './routes/userRoutes';
import expenseRoutes from './routes/expenseRoutes';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

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
