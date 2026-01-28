import { Deployment } from '../../../domain/entities/Deployment';
import { IDeploymentRepository } from '../../../domain/repositories/IDeploymentRepository';

/**
 * CreateDeploymentUseCase
 * Deployment 생성 유즈케이스
 * Deployment를 저장소에 저장 (Pod 생성은 ReconcileDeploymentUseCase에서 수행)
 */
export class CreateDeploymentUseCase {
  constructor(private deploymentRepository: IDeploymentRepository) {}

  /**
   * Deployment 생성 실행
   * @param deployment - 생성할 Deployment 엔티티
   * @returns 생성된 Deployment 엔티티
   * @throws 동일 namespace/name 존재 시 예외
   */
  async execute(deployment: Deployment): Promise<Deployment> {
    const ns = deployment.metadata.namespace || 'default';
    const existing = await this.deploymentRepository.findById(ns, deployment.metadata.name);
    if (existing) {
      throw new Error(`Deployment ${deployment.metadata.name} already exists in namespace ${ns}`);
    }
    return await this.deploymentRepository.create(deployment);
  }
}
