import { Pod } from '../../../domain/entities/Pod';
import { IPodRepository } from '../../../domain/repositories/IPodRepository';

/**
 * UpdatePodUseCase
 * Pod 업데이트 유즈케이스
 * 기존 Pod를 조회하고 업데이트된 정보로 저장
 */
export class UpdatePodUseCase {
  /**
   * UpdatePodUseCase 생성자
   * @param podRepository - Pod 리포지토리
   */
  constructor(
    private podRepository: IPodRepository
  ) {}

  /**
   * Pod 업데이트 실행
   * 1. 기존 Pod 조회
   * 2. 업데이트된 Pod 정보로 저장
   * @param namespace - Pod가 속한 네임스페이스
   * @param name - Pod 이름
   * @param pod - 업데이트할 Pod 엔티티
   * @returns 업데이트된 Pod 엔티티
   * @throws Pod를 찾을 수 없거나 업데이트 실패 시 예외 발생
   */
  async execute(namespace: string, name: string, pod: Pod): Promise<Pod> {
    if (!pod) {
      throw new Error('Pod is required');
    }

    // 1. 기존 Pod 조회
    const existingPod = await this.podRepository.findById(namespace, name);
    if (!existingPod) {
      throw new Error('Pod not found');
    }

    // 2. Pod 업데이트
    const updatedPod = await this.podRepository.update(pod);
    
    return updatedPod;
  }
}
