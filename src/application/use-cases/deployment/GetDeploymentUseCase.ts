import { Deployment } from '../../../domain/entities/Deployment';
import { IDeploymentRepository } from '../../../domain/repositories/IDeploymentRepository';

/**
 * GetDeploymentUseCase
 * Deployment 단건 조회 유즈케이스
 */
export class GetDeploymentUseCase {
  constructor(private deploymentRepository: IDeploymentRepository) {}

  async execute(namespace: string, name: string): Promise<Deployment | null> {
    return await this.deploymentRepository.findById(namespace, name);
  }
}
