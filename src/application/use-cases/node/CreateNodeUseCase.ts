import { Node } from '../../../domain/entities/Node';
import { INodeRepository } from '../../../domain/repositories/INodeRepository';

/**
 * CreateNodeUseCase
 * Node 생성 유즈케이스
 * 새로운 워커 노드를 클러스터에 추가
 */
export class CreateNodeUseCase {
  /**
   * CreateNodeUseCase 생성자
   * @param nodeRepository - Node 리포지토리
   */
  constructor(
    private nodeRepository: INodeRepository
  ) {}

  /**
   * Node 생성 실행
   * @param node - 생성할 Node 엔티티
   * @returns 생성된 Node 엔티티
   * @throws Node가 null이거나 저장 실패 시 예외 발생
   */
  async execute(node: Node): Promise<Node> {
    if (!node) {
      throw new Error('Node is required');
    }

    const createdNode = await this.nodeRepository.create(node);
    return createdNode;
  }
}
