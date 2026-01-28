import { Express } from 'express';
import { DeploymentController } from '../controllers/DeploymentController';

export function setupDeploymentRoutes(app: Express, deploymentController: DeploymentController): void {
  app.post('/api/v1/deployments', (req, res) => deploymentController.create(req, res));
  app.get('/api/v1/deployments', (req, res) => deploymentController.list(req, res));
  app.post('/api/v1/deployments/:namespace/:name/reconcile', (req, res) => deploymentController.reconcile(req, res));
  app.get('/api/v1/deployments/:namespace/:name', (req, res) => deploymentController.get(req, res));
  app.delete('/api/v1/deployments/:namespace/:name', (req, res) => deploymentController.delete(req, res));
}
