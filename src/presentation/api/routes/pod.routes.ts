import { Express } from 'express';
import { PodController } from '../controllers/PodController';

/**
 * Pod 관련 라우트 설정
 * Express 앱에 Pod 관련 REST API 엔드포인트를 등록
 * @param app - Express 애플리케이션 인스턴스
 * @param podController - Pod 컨트롤러 인스턴스
 */
export function setupPodRoutes(app: Express, podController: PodController): void {
  app.post('/api/v1/pods', (req, res) => podController.create(req, res));
  app.get('/api/v1/pods', (req, res) => podController.list(req, res));
  app.get('/api/v1/pods/:namespace/:name', (req, res) => podController.get(req, res));
  app.put('/api/v1/pods/:namespace/:name', (req, res) => podController.update(req, res));
  app.delete('/api/v1/pods/:namespace/:name', (req, res) => podController.delete(req, res));
  app.get('/api/v1/pods/:namespace/:name/status', (req, res) => podController.getStatus(req, res));
  app.post('/api/v1/pods/:namespace/:name/restart', (req, res) => podController.restart(req, res));
  app.get('/api/v1/pods/:namespace/:name/logs', (req, res) => podController.getLogs(req, res));
}
