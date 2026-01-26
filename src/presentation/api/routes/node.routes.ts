import { Express } from 'express';
import { NodeController } from '../controllers/NodeController';

/**
 * Node 관련 라우트 설정
 * Express 앱에 Node 관련 REST API 엔드포인트를 등록
 * @param app - Express 애플리케이션 인스턴스
 * @param nodeController - Node 컨트롤러 인스턴스
 */
export function setupNodeRoutes(app: Express, nodeController: NodeController): void {
  app.post('/api/v1/nodes', (req, res) => nodeController.create(req, res));
  app.get('/api/v1/nodes', (req, res) => nodeController.list(req, res));
  app.get('/api/v1/nodes/:name', (req, res) => nodeController.get(req, res));
  app.put('/api/v1/nodes/:name', (req, res) => nodeController.update(req, res));
  app.delete('/api/v1/nodes/:name', (req, res) => nodeController.delete(req, res));
}
