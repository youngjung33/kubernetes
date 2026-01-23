import { Node } from '../../../domain/entities/Node';
import { INodeRepository } from '../../../domain/repositories/INodeRepository';

/**
 * ListNodesUseCase
 * Node 목록 조회 유즈케이스
 * 클러스터의 모든 Node 목록을 조회
 */
export class ListNodesUseCase {
  /**
   * ListNodesUseCase 생성자
   * @param nodeRepository - Node 리포지토리
   */
  constructor(
    private nodeRepository: INodeRepository
  ) {}

  /**
   * Node 목록 조회 실행
   * @returns Node 엔티티 배열
   * @throws Repository 조회 실패 시 예외 발생
   */
  async execute(): Promise<Node[]> {
    return await this.nodeRepository.findAll();
  }
}
