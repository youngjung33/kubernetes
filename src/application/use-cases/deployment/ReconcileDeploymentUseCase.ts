import { IDeploymentRepository } from '../../../domain/repositories/IDeploymentRepository';
import { IPodRepository } from '../../../domain/repositories/IPodRepository';
import { CreatePodUseCase } from '../pod/CreatePodUseCase';
import { DeletePodUseCase } from '../pod/DeletePodUseCase';

/**
 * ReconcileDeploymentUseCase
 * Deployment 목표 상태와 현재 Pod 수를 맞추는 유즈케이스
 * selector로 매칭된 Pod 수가 replicas와 다르면 Pod 생성 또는 삭제
 */
export class ReconcileDeploymentUseCase {
  constructor(
    private deploymentRepository: IDeploymentRepository,
    private podRepository: IPodRepository,
    private createPodUseCase: CreatePodUseCase,
    private deletePodUseCase: DeletePodUseCase
  ) {}

  /**
   * Reconcile 실행
   * @param namespace - Deployment가 속한 네임스페이스
   * @param deploymentName - Deployment 이름
   * @throws Deployment를 찾을 수 없을 시 예외
   */
  async execute(namespace: string, deploymentName: string): Promise<void> {
    const deployment = await this.deploymentRepository.findById(namespace, deploymentName);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentName} not found in namespace ${namespace}`);
    }

    const ns = deployment.metadata.namespace || 'default';
    const matchingPods = await this.podRepository.findAll(ns, {
      labelSelector: deployment.spec.selector?.matchLabels || {}
    });

    const desired = deployment.spec.replicas;
    const current = matchingPods.length;

    if (current < desired) {
      const toCreate = desired - current;
      for (let i = 0; i < toCreate; i++) {
        const suffix = `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`;
        const pod = deployment.createPodFromTemplate(suffix);
        await this.createPodUseCase.execute(pod);
      }
    } else if (current > desired) {
      const toDelete = current - desired;
      for (let i = 0; i < toDelete; i++) {
        await this.deletePodUseCase.execute(ns, matchingPods[i].metadata.name);
      }
    }
  }
}
