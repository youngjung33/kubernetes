import { Deployment } from '../../../domain/entities/Deployment';
import { IDeploymentRepository } from '../../../domain/repositories/IDeploymentRepository';

/**
 * ListDeploymentsUseCase
 * Deployment 목록 조회 유즈케이스
 */
export class ListDeploymentsUseCase {
  constructor(private deploymentRepository: IDeploymentRepository) {}

  async execute(namespace?: string): Promise<Deployment[]> {
    return await this.deploymentRepository.findAll(namespace);
  }
}
