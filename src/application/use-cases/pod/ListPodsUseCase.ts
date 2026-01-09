import { IPodRepository } from '../../../domain/repositories/IPodRepository';
import { Pod } from '../../../domain/entities/Pod';

/**
 * ListPodsUseCase
 * Pod 목록 조회 유즈케이스
 * 네임스페이스별 또는 전체 Pod 목록을 조회
 */
export class ListPodsUseCase {
  /**
   * ListPodsUseCase 생성자
   * @param podRepository - Pod 리포지토리
   */
  constructor(private podRepository: IPodRepository) {}

  /**
   * Pod 목록 조회 실행
   * @param namespace - 조회할 네임스페이스 (선택사항, 미지정 시 전체 조회)
   * @returns Pod 엔티티 배열
   */
  async execute(namespace?: string): Promise<Pod[]> {
    return await this.podRepository.findAll(namespace);
  }
}
