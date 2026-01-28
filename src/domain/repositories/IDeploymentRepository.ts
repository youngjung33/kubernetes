import { Deployment } from '../entities/Deployment';

export interface IDeploymentRepository {
  create(deployment: Deployment): Promise<Deployment>;
  findById(namespace: string, name: string): Promise<Deployment | null>;
  findAll(namespace?: string): Promise<Deployment[]>;
  update(deployment: Deployment): Promise<Deployment>;
  delete(namespace: string, name: string): Promise<void>;
}
