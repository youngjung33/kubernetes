import { IPodRepository } from '../../../domain/repositories/IPodRepository';

/**
 * DeletePodUseCase
 * Pod 삭제 유즈케이스
 * 네임스페이스와 이름으로 Pod를 삭제
 */
export class DeletePodUseCase {
  /**
   * DeletePodUseCase 생성자
   * @param podRepository - Pod 리포지토리
   */
  constructor(private podRepository: IPodRepository) {}

  /**
   * Pod 삭제 실행
   * @param namespace - 삭제할 Pod가 속한 네임스페이스
   * @param name - 삭제할 Pod 이름
   */
  async execute(namespace: string, name: string): Promise<void> {
    await this.podRepository.delete(namespace, name);
  }
}
