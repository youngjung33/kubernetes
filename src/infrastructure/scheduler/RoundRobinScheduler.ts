import { IScheduler } from '../../domain/services/IScheduler';
import { Pod } from '../../domain/entities/Pod';
import { Node } from '../../domain/entities/Node';

/**
 * RoundRobinScheduler
 * 라운드로빈 알고리즘을 사용한 Pod 스케줄러 구현체
 * 사용 가능한 노드에 순차적으로 Pod를 배치
 */
export class RoundRobinScheduler implements IScheduler {
  private lastNodeIndex: number = 0;

  /**
   * Pod를 노드에 스케줄링
   * 라운드로빈 방식으로 노드를 순차적으로 선택
   * @param pod - 스케줄링할 Pod 엔티티
   * @param nodes - 사용 가능한 Node 배열
   * @returns 선택된 Node 엔티티
   * @throws 사용 가능한 노드가 없을 시 예외 발생
   */
  async schedule(pod: Pod, nodes: Node[]): Promise<Node> {
    if (!nodes || nodes.length === 0) {
      throw new Error('No available nodes');
    }

    // 간단한 라운드로빈 스케줄링
    const selectedNode = nodes[this.lastNodeIndex % nodes.length];
    this.lastNodeIndex++;
    
    return selectedNode;
  }
}
