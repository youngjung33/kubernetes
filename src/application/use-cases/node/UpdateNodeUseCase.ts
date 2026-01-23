import { Node } from '../../../domain/entities/Node';
import { INodeRepository } from '../../../domain/repositories/INodeRepository';

/**
 * UpdateNodeUseCase
 * Node 업데이트 유즈케이스
 * 기존 Node의 정보를 업데이트
 */
export class UpdateNodeUseCase {
  /**
   * UpdateNodeUseCase 생성자
   * @param nodeRepository - Node 리포지토리
   */
  constructor(
    private nodeRepository: INodeRepository
  ) {}

  /**
   * Node 업데이트 실행
   * 1. 기존 Node 조회
   * 2. 업데이트된 Node 정보로 저장
   * @param name - 업데이트할 Node 이름
   * @param node - 업데이트할 Node 엔티티
   * @returns 업데이트된 Node 엔티티
   * @throws Node를 찾을 수 없거나 업데이트 실패 시 예외 발생
   */
  async execute(name: string, node: Node): Promise<Node> {
    if (!node) {
      throw new Error('Node is required');
    }

    // 1. 기존 Node 조회
    const existingNode = await this.nodeRepository.findById(name);
    if (!existingNode) {
      throw new Error('Node not found');
    }

    // 2. Node 업데이트
    const updatedNode = await this.nodeRepository.update(node);
    
    return updatedNode;
  }
}
