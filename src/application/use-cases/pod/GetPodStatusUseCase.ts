import { Pod } from '../../../domain/entities/Pod';
import { IPodRepository } from '../../../domain/repositories/IPodRepository';
import { IContainerRuntime } from '../../../domain/services/IContainerRuntime';

/**
 * GetPodStatusUseCase
 * Pod 상태 조회 유즈케이스
 * Pod의 현재 상태를 조회하고 컨테이너 런타임 상태와 동기화
 */
export class GetPodStatusUseCase {
  /**
   * GetPodStatusUseCase 생성자
   * @param podRepository - Pod 리포지토리
   * @param containerRuntime - 컨테이너 런타임
   */
  constructor(
    private podRepository: IPodRepository,
    private containerRuntime: IContainerRuntime
  ) {}

  /**
   * Pod 상태 조회 실행
   * 1. Pod를 조회
   * 2. 컨테이너 ID 확인
   * 3. 컨테이너 런타임에서 실제 상태 조회
   * 4. Pod 상태 업데이트 및 반환
   * @param namespace - 조회할 Pod가 속한 네임스페이스
   * @param name - 조회할 Pod 이름
   * @returns Pod 엔티티 (상태 정보 포함)
   * @throws Pod를 찾을 수 없거나 컨테이너 상태 조회 실패 시 예외 발생
   */
  async execute(namespace: string, name: string): Promise<Pod> {
    const pod = await this.podRepository.findById(namespace, name);

    if (!pod) {
      throw new Error(`Pod ${name} not found in namespace ${namespace}`);
    }

    const containerId = pod.containerId;
    if (!containerId) {
      throw new Error(`Container ID not found for pod ${name}`);
    }

    // 컨테이너 런타임에서 실제 상태 조회
    const containerStatus = await this.containerRuntime.getStatus(containerId);

    // Pod 상태 업데이트
    if (!pod.status) {
      pod.status = {
        phase: containerStatus.running ? 'Running' as any : 'Pending' as any,
        containerStatuses: []
      };
    }

    pod.status.phase = containerStatus.running ? 'Running' as any : 'Pending' as any;
    if (pod.status.containerStatuses) {
      pod.status.containerStatuses[0] = {
        name: pod.spec.containers[0].name,
        state: containerStatus.running
          ? { running: { startedAt: new Date().toISOString() } }
          : { waiting: { reason: containerStatus.status } }
      };
    }

    return pod;
  }
}
