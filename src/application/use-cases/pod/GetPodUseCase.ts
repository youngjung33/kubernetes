import { IPodRepository } from '../../../domain/repositories/IPodRepository';
import { Pod } from '../../../domain/entities/Pod';

/**
 * GetPodUseCase
 * Pod 조회 유즈케이스
 * 네임스페이스와 이름으로 Pod를 조회
 */
export class GetPodUseCase {
  /**
   * GetPodUseCase 생성자
   * @param podRepository - Pod 리포지토리
   */
  constructor(private podRepository: IPodRepository) {}

  /**
   * Pod 조회 실행
   * @param namespace - 조회할 Pod가 속한 네임스페이스
   * @param name - 조회할 Pod 이름
   * @returns 조회된 Pod 엔티티 또는 null
   */
  async execute(namespace: string, name: string): Promise<Pod | null> {
    return await this.podRepository.findById(namespace, name);
  }
}
