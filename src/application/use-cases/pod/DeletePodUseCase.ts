import { IPodRepository } from '../../../domain/repositories/IPodRepository';
import { IContainerRuntime } from '../../../domain/services/IContainerRuntime';

/**
 * DeletePodUseCase
 * Pod 삭제 유즈케이스
 * 컨테이너가 있으면 먼저 중지한 뒤 저장소에서 Pod 삭제
 */
export class DeletePodUseCase {
  /**
   * DeletePodUseCase 생성자
   * @param podRepository - Pod 리포지토리
   * @param containerRuntime - 컨테이너 런타임 (삭제 전 중지용)
   */
  constructor(
    private podRepository: IPodRepository,
    private containerRuntime: IContainerRuntime
  ) {}

  /**
   * Pod 삭제 실행
   * 1. Pod 조회
   * 2. containerId가 있으면 컨테이너 중지
   * 3. 저장소에서 Pod 삭제
   * @param namespace - 삭제할 Pod가 속한 네임스페이스
   * @param name - 삭제할 Pod 이름
   */
  async execute(namespace: string, name: string): Promise<void> {
    const pod = await this.podRepository.findById(namespace, name);
    if (pod?.containerId) {
      await this.containerRuntime.stop(pod.containerId);
    }
    await this.podRepository.delete(namespace, name);
  }
}
