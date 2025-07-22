import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime()
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test Server running on http://localhost:${PORT}`);
});