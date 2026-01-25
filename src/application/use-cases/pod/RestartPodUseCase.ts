import { Pod } from '../../../domain/entities/Pod';
import { IPodRepository } from '../../../domain/repositories/IPodRepository';
import { IContainerRuntime } from '../../../domain/services/IContainerRuntime';

/**
 * RestartPodUseCase
 * Pod 재시작 유즈케이스
 * 실행 중인 Pod를 중지하고 다시 시작
 */
export class RestartPodUseCase {
  /**
   * RestartPodUseCase 생성자
   * @param podRepository - Pod 리포지토리
   * @param containerRuntime - 컨테이너 런타임
   */
  constructor(
    private podRepository: IPodRepository,
    private containerRuntime: IContainerRuntime
  ) {}

  /**
   * Pod 재시작 실행
   * 1. Pod를 조회
   * 2. 컨테이너 ID 확인
   * 3. 기존 컨테이너 중지
   * 4. 새로운 컨테이너 실행
   * 5. Pod 정보 업데이트
   * @param namespace - 재시작할 Pod가 속한 네임스페이스
   * @param name - 재시작할 Pod 이름
   * @returns 재시작된 Pod 엔티티
   * @throws Pod를 찾을 수 없거나 재시작 실패 시 예외 발생
   */
  async execute(namespace: string, name: string): Promise<Pod> {
    const pod = await this.podRepository.findById(namespace, name);

    if (!pod) {
      throw new Error(`Pod ${name} not found in namespace ${namespace}`);
    }

    // 컨테이너 ID 확인
    const containerId = (pod as any).containerId;
    if (!containerId) {
      throw new Error(`Container ID not found for pod ${name}`);
    }

    // 기존 컨테이너 중지
    await this.containerRuntime.stop(containerId);

    // 새로운 컨테이너 실행
    const newContainerStatus = await this.containerRuntime.run(pod);

    // Pod 정보 업데이트
    (pod as any).containerId = newContainerStatus.id;
    if (pod.status) {
      pod.status.phase = 'Running' as any;
      if (pod.status.containerStatuses) {
        pod.status.containerStatuses[0] = {
          name: pod.spec.containers[0].name,
          state: { running: { startedAt: new Date().toISOString() } }
        };
      }
    }

    // 저장소에 업데이트
    const updatedPod = await this.podRepository.update(pod);
    return updatedPod;
  }
}
