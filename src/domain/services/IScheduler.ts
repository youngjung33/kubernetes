import { Pod } from '../entities/Pod';
import { Node } from '../entities/Node';

export interface IScheduler {
  schedule(pod: Pod, nodes: Node[]): Promise<Node>;
}
