import express from 'express';
import { Container } from './src/infrastructure/di/container';
import { setupPodRoutes } from './src/presentation/api/routes/pod.routes';
import { setupNodeRoutes } from './src/presentation/api/routes/node.routes';

/**
 * Mini Kubernetes API Server
 * Node.js + TypeScript로 구현한 Kubernetes API 서버
 */

const app = express();
const container = new Container();

// Middleware
app.use(express.text({ type: 'application/yaml' }));
app.use(express.json());

// Routes
const podController = container.getPodController();
const nodeController = container.getNodeController();
setupPodRoutes(app, podController);
setupNodeRoutes(app, nodeController);

/**
 * Health check 엔드포인트
 * 서버 상태 확인용
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Mini Kubernetes API Server running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
});
