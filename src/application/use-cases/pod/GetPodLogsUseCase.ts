import { IPodRepository } from '../../../domain/repositories/IPodRepository';
import { IContainerRuntime } from '../../../domain/services/IContainerRuntime';

/**
 * GetPodLogsUseCase
 * Pod 로그 조회 유즈케이스
 * Pod의 컨테이너 로그를 조회
 */
export class GetPodLogsUseCase {
  /**
   * GetPodLogsUseCase 생성자
   * @param podRepository - Pod 리포지토리
   * @param containerRuntime - 컨테이너 런타임
   */
  constructor(
    private podRepository: IPodRepository,
    private containerRuntime: IContainerRuntime
  ) {}

  /**
   * Pod 로그 조회 실행
   * 1. Pod를 조회
   * 2. 컨테이너 ID 확인
   * 3. 컨테이너 런타임에서 로그 조회
   * @param namespace - 조회할 Pod가 속한 네임스페이스
   * @param name - 조회할 Pod 이름
   * @returns 컨테이너 로그 문자열
   * @throws Pod를 찾을 수 없거나 로그 조회 실패 시 예외 발생
   */
  async execute(namespace: string, name: string): Promise<string> {
    const pod = await this.podRepository.findById(namespace, name);

    if (!pod) {
      throw new Error(`Pod ${name} not found in namespace ${namespace}`);
    }

    // 컨테이너 ID 확인
    const containerId = (pod as any).containerId;
    if (!containerId) {
      throw new Error(`Container ID not found for pod ${name}`);
    }

    // 컨테이너 런타임에서 로그 조회
    const logs = await this.containerRuntime.getLogs(containerId);
    return logs;
  }
}
