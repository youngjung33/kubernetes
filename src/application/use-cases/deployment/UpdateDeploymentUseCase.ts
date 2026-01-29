import { Deployment } from '../../../domain/entities/Deployment';
import { IDeploymentRepository } from '../../../domain/repositories/IDeploymentRepository';

/**
 * UpdateDeploymentUseCase
 * Deployment 수정 유즈케이스 (replicas, template 등 spec 변경)
 */
export class UpdateDeploymentUseCase {
  constructor(private deploymentRepository: IDeploymentRepository) {}

  /**
   * 기존 Deployment를 새 spec으로 갱신
   * @param namespace - 네임스페이스
   * @param name - Deployment 이름
   * @param deployment - 갱신할 내용 (metadata.name/namespace는 경로와 일치해야 함)
   * @returns 갱신된 Deployment
   * @throws 존재하지 않으면 예외
   */
  async execute(namespace: string, name: string, deployment: Deployment): Promise<Deployment> {
    const existing = await this.deploymentRepository.findById(namespace, name);
    if (!existing) {
      throw new Error(`Deployment ${name} not found in namespace ${namespace}`);
    }
    deployment.metadata.namespace = deployment.metadata.namespace || namespace;
    deployment.metadata.name = name;
    return await this.deploymentRepository.update(deployment);
  }
}
