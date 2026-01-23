import { INodeRepository } from '../../../domain/repositories/INodeRepository';

/**
 * DeleteNodeUseCase
 * Node 삭제 유즈케이스
 * 클러스터에서 Node를 제거
 */
export class DeleteNodeUseCase {
  /**
   * DeleteNodeUseCase 생성자
   * @param nodeRepository - Node 리포지토리
   */
  constructor(
    private nodeRepository: INodeRepository
  ) {}

  /**
   * Node 삭제 실행
   * @param name - 삭제할 Node 이름
   * @throws Node를 찾을 수 없거나 삭제 실패 시 예외 발생
   */
  async execute(name: string): Promise<void> {
    // 1. Node 존재 확인
    const node = await this.nodeRepository.findById(name);
    if (!node) {
      throw new Error('Node not found');
    }

    // 2. Node 삭제
    await this.nodeRepository.delete(name);
  }
}
