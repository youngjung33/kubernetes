import { Pod } from '../entities/Pod';

export interface IPodRepository {
  create(pod: Pod): Promise<Pod>;
  findById(namespace: string, name: string): Promise<Pod | null>;
  findAll(namespace?: string): Promise<Pod[]>;
  update(pod: Pod): Promise<Pod>;
  delete(namespace: string, name: string): Promise<void>;
}
