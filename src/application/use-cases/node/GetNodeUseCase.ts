import { Node } from '../../../domain/entities/Node';
import { INodeRepository } from '../../../domain/repositories/INodeRepository';

/**
 * GetNodeUseCase
 * Node 조회 유즈케이스
 * 이름으로 특정 Node를 조회
 */
export class GetNodeUseCase {
  /**
   * GetNodeUseCase 생성자
   * @param nodeRepository - Node 리포지토리
   */
  constructor(
    private nodeRepository: INodeRepository
  ) {}

  /**
   * Node 조회 실행
   * @param name - 조회할 Node 이름
   * @returns 조회된 Node 엔티티 또는 null (존재하지 않을 경우)
   * @throws Repository 조회 실패 시 예외 발생
   */
  async execute(name: string): Promise<Node | null> {
    return await this.nodeRepository.findById(name);
  }
}
