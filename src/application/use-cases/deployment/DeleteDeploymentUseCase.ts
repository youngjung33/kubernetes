import { IDeploymentRepository } from '../../../domain/repositories/IDeploymentRepository';
import { IPodRepository } from '../../../domain/repositories/IPodRepository';
import { DeletePodUseCase } from '../pod/DeletePodUseCase';

/**
 * DeleteDeploymentUseCase
 * Deployment 삭제 유즈케이스
 * selector로 매칭된 Pod를 먼저 삭제한 뒤 Deployment 삭제
 */
export class DeleteDeploymentUseCase {
  constructor(
    private deploymentRepository: IDeploymentRepository,
    private podRepository: IPodRepository,
    private deletePodUseCase: DeletePodUseCase
  ) {}

  async execute(namespace: string, name: string): Promise<void> {
    const deployment = await this.deploymentRepository.findById(namespace, name);
    if (deployment) {
      const ns = deployment.metadata.namespace || 'default';
      const matchingPods = await this.podRepository.findAll(ns, {
        labelSelector: deployment.spec.selector?.matchLabels || {}
      });
      for (const pod of matchingPods) {
        await this.deletePodUseCase.execute(ns, pod.metadata.name);
      }
    }
    await this.deploymentRepository.delete(namespace, name);
  }
}
