import { IDeploymentRepository } from '../../domain/repositories/IDeploymentRepository';
import { Deployment } from '../../domain/entities/Deployment';
import { IStore } from '../../domain/services/IStore';

/**
 * DeploymentRepository
 * Deployment 엔티티의 영속성을 관리하는 리포지토리 구현체
 */
export class DeploymentRepository implements IDeploymentRepository {
  constructor(private store: IStore) {}

  /** Deployment 생성 */
  async create(deployment: Deployment): Promise<Deployment> {
    this.store.put(deployment.getKey(), deployment);
    return deployment;
  }

  /** 네임스페이스와 이름으로 Deployment 조회 */
  async findById(namespace: string, name: string): Promise<Deployment | null> {
    const key = `deployments/${namespace}/${name}`;
    const data = this.store.get(key);
    if (!data) return null;
    return Object.assign(new Deployment(data.metadata, data.spec), data);
  }

  /** Deployment 목록 조회 (namespace 생략 시 전체) */
  async findAll(namespace?: string): Promise<Deployment[]> {
    const prefix = namespace ? `deployments/${namespace}/` : 'deployments/';
    const data = this.store.list(prefix);
    return Object.values(data).map(item =>
      Object.assign(new Deployment(item.metadata, item.spec), item)
    );
  }

  /** Deployment 업데이트 */
  async update(deployment: Deployment): Promise<Deployment> {
    this.store.put(deployment.getKey(), deployment);
    return deployment;
  }

  /** Deployment 삭제 */
  async delete(namespace: string, name: string): Promise<void> {
    const key = `deployments/${namespace}/${name}`;
    this.store.delete(key);
  }
}
