import { INodeRepository } from '../../domain/repositories/INodeRepository';
import { Node } from '../../domain/entities/Node';
import { IStore } from '../../domain/services/IStore';

/**
 * NodeRepository
 * Node 엔티티의 영속성을 관리하는 리포지토리 구현체
 */
export class NodeRepository implements INodeRepository {
  /**
   * NodeRepository 생성자
   * @param store - 데이터 저장소 인터페이스
   */
  constructor(private store: IStore) {}

  /**
   * Node 생성
   * @param node - 생성할 Node 엔티티
   * @returns 생성된 Node 엔티티
   */
  async create(node: Node): Promise<Node> {
    this.store.put(node.getKey(), node);
    return node;
  }

  /**
   * 이름으로 Node 조회
   * @param name - Node 이름
   * @returns 조회된 Node 엔티티 또는 null
   */
  async findById(name: string): Promise<Node | null> {
    const key = `nodes/${name}`;
    const data = this.store.get(key);
    if (!data) return null;
    return Object.assign(new Node(data.metadata, data.spec), data);
  }

  /**
   * 모든 Node 목록 조회
   * @returns Node 엔티티 배열
   */
  async findAll(): Promise<Node[]> {
    const data = this.store.list('nodes/');
    return Object.values(data).map(item => 
      Object.assign(new Node(item.metadata, item.spec), item)
    );
  }

  /**
   * Node 업데이트
   * @param node - 업데이트할 Node 엔티티
   * @returns 업데이트된 Node 엔티티
   */
  async update(node: Node): Promise<Node> {
    this.store.put(node.getKey(), node);
    return node;
  }

  /**
   * Node 삭제
   * @param name - 삭제할 Node 이름
   */
  async delete(name: string): Promise<void> {
    const key = `nodes/${name}`;
    this.store.delete(key);
  }
}
