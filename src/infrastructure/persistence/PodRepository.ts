import { IPodRepository } from '../../domain/repositories/IPodRepository';
import { Pod } from '../../domain/entities/Pod';
import { IStore } from '../../domain/services/IStore';

/**
 * PodRepository
 * Pod 엔티티의 영속성을 관리하는 리포지토리 구현체
 */
export class PodRepository implements IPodRepository {
  /**
   * PodRepository 생성자
   * @param store - 데이터 저장소 인터페이스
   */
  constructor(private store: IStore) {}

  /**
   * Pod 생성
   * @param pod - 생성할 Pod 엔티티
   * @returns 생성된 Pod 엔티티
   */
  async create(pod: Pod): Promise<Pod> {
    this.store.put(pod.getKey(), pod);
    return pod;
  }

  /**
   * 네임스페이스와 이름으로 Pod 조회
   * @param namespace - Pod가 속한 네임스페이스
   * @param name - Pod 이름
   * @returns 조회된 Pod 엔티티 또는 null
   */
  async findById(namespace: string, name: string): Promise<Pod | null> {
    const key = `pods/${namespace}/${name}`;
    const data = this.store.get(key);
    if (!data) return null;
    return Object.assign(new Pod(data.metadata, data.spec), data);
  }

  /**
   * Pod 목록 조회
   * @param namespace - 조회할 네임스페이스 (선택사항, 미지정 시 모든 네임스페이스)
   * @returns Pod 엔티티 배열
   */
  async findAll(namespace?: string): Promise<Pod[]> {
    const prefix = namespace ? `pods/${namespace}/` : 'pods/';
    const data = this.store.list(prefix);
    return Object.values(data).map(item => 
      Object.assign(new Pod(item.metadata, item.spec), item)
    );
  }

  /**
   * Pod 업데이트
   * @param pod - 업데이트할 Pod 엔티티
   * @returns 업데이트된 Pod 엔티티
   */
  async update(pod: Pod): Promise<Pod> {
    this.store.put(pod.getKey(), pod);
    return pod;
  }

  /**
   * Pod 삭제
   * @param namespace - 삭제할 Pod가 속한 네임스페이스
   * @param name - 삭제할 Pod 이름
   */
  async delete(namespace: string, name: string): Promise<void> {
    const key = `pods/${namespace}/${name}`;
    this.store.delete(key);
  }
}
