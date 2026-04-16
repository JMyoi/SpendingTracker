import express from 'express';
import cors from 'cors';

import userRoutes from './routes/userRoutes';
import expenseRoutes from './routes/expenseRoutes';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running');
});

// 注册 API
app.use('/users', userRoutes);
app.use('/expenses', expenseRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});