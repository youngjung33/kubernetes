import { Pod } from '../entities/Pod';

/** Pod 목록 조회 시 사용하는 필터 옵션 */
export interface ListPodsOptions {
  /** 라벨 셀렉터 (키-값 쌍, Pod의 metadata.labels가 모두 포함해야 함) */
  labelSelector?: Record<string, string>;
  /** 노드 이름 (Pod의 spec.nodeName과 일치한 것만) */
  nodeName?: string;
}

export interface IPodRepository {
  create(pod: Pod): Promise<Pod>;
  findById(namespace: string, name: string): Promise<Pod | null>;
  /** Pod 목록 조회. namespace 생략 시 전체, options로 라벨/노드 필터 가능 */
  findAll(namespace?: string, options?: ListPodsOptions): Promise<Pod[]>;
  update(pod: Pod): Promise<Pod>;
  delete(namespace: string, name: string): Promise<void>;
}
