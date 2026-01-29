import { Request, Response } from 'express';
import { CreateDeploymentUseCase } from '../../../application/use-cases/deployment/CreateDeploymentUseCase';
import { GetDeploymentUseCase } from '../../../application/use-cases/deployment/GetDeploymentUseCase';
import { ListDeploymentsUseCase } from '../../../application/use-cases/deployment/ListDeploymentsUseCase';
import { DeleteDeploymentUseCase } from '../../../application/use-cases/deployment/DeleteDeploymentUseCase';
import { ReconcileDeploymentUseCase } from '../../../application/use-cases/deployment/ReconcileDeploymentUseCase';
import { UpdateDeploymentUseCase } from '../../../application/use-cases/deployment/UpdateDeploymentUseCase';
import { Deployment } from '../../../domain/entities/Deployment';
import * as yaml from 'js-yaml';

/**
 * DeploymentController
 * Deployment 관련 HTTP 요청을 처리하는 컨트롤러
 */
export class DeploymentController {
  constructor(
    private createDeploymentUseCase: CreateDeploymentUseCase,
    private getDeploymentUseCase: GetDeploymentUseCase,
    private listDeploymentsUseCase: ListDeploymentsUseCase,
    private deleteDeploymentUseCase: DeleteDeploymentUseCase,
    private updateDeploymentUseCase: UpdateDeploymentUseCase,
    private reconcileDeploymentUseCase: ReconcileDeploymentUseCase
  ) {}

  /** Deployment 생성 (YAML body) */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = yaml.load(req.body) as any;
      if (!data?.metadata?.name || !data?.spec) {
        res.status(400).json({ error: 'metadata.name and spec are required' });
        return;
      }
      const deployment = new Deployment(data.metadata, data.spec);
      const created = await this.createDeploymentUseCase.execute(deployment);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /** Deployment 단건 조회 */
  async get(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, name } = req.params;
      const deployment = await this.getDeploymentUseCase.execute(namespace, name);
      if (!deployment) {
        res.status(404).json({ error: 'Deployment not found' });
        return;
      }
      res.json(deployment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /** Deployment 목록 조회 (query.namespace 선택) */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const namespace = (req.query.namespace as string) || 'default';
      const list = await this.listDeploymentsUseCase.execute(namespace);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /** Deployment 수정 (YAML body, replicas/template 등) */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, name } = req.params;
      const data = yaml.load(req.body) as any;
      if (!data?.spec) {
        res.status(400).json({ error: 'spec is required' });
        return;
      }
      const deployment = new Deployment(
        { name, namespace: data.metadata?.namespace || namespace },
        data.spec
      );
      const updated = await this.updateDeploymentUseCase.execute(namespace, name, deployment);
      res.status(200).json(updated);
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  /** Deployment 삭제 (관련 Pod 먼저 삭제) */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, name } = req.params;
      await this.deleteDeploymentUseCase.execute(namespace, name);
      res.status(200).json({ status: 'deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /** Reconcile 실행 (목표 replicas에 맞춰 Pod 생성/삭제) */
  async reconcile(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, name } = req.params;
      await this.reconcileDeploymentUseCase.execute(namespace, name);
      res.status(200).json({ status: 'reconciled' });
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
}
