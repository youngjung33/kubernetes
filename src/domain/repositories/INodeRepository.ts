import { Node } from '../entities/Node';

export interface INodeRepository {
  create(node: Node): Promise<Node>;
  findById(name: string): Promise<Node | null>;
  findAll(): Promise<Node[]>;
  update(node: Node): Promise<Node>;
  delete(name: string): Promise<void>;
}
