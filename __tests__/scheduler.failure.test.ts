import { RoundRobinScheduler } from '../src/infrastructure/scheduler/RoundRobinScheduler';
import { Pod } from '../src/domain/entities/Pod';
import { Node } from '../src/domain/entities/Node';

describe('RoundRobinScheduler - 실패 케이스', () => {
  let scheduler: RoundRobinScheduler;

  beforeEach(() => {
    scheduler = new RoundRobinScheduler();
  });

  it('노드가 없을 때 스케줄링 시도 시 예외 발생', async () => {
    const pod = new Pod(
      { name: 'nginx-test' },
      {
        containers: [
          { name: 'nginx', image: 'nginx:latest' }
        ]
      }
    );

    const nodes: Node[] = [];

    await expect(scheduler.schedule(pod, nodes)).rejects.toThrow('No available nodes');
  });

  it('null 노드 배열로 스케줄링 시도 시 예외 발생', async () => {
    const pod = new Pod(
      { name: 'nginx-test' },
      {
        containers: [
          { name: 'nginx', image: 'nginx:latest' }
        ]
      }
    );

    await expect(scheduler.schedule(pod, null as any)).rejects.toThrow();
  });
});
