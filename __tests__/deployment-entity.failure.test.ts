import { Deployment } from '../src/domain/entities/Deployment';

/**
 * Deployment 엔티티 실패 케이스 테스트
 * createPodFromTemplate 등 경계/예외 상황
 */
describe('Deployment Entity - 실패 케이스', () => {
  it('template.spec.containers가 빈 배열이면 createPodFromTemplate로 만든 Pod는 실행 시 실패할 수 있음', () => {
    const deployment = new Deployment(
      { name: 'test-deploy', namespace: 'default' },
      {
        replicas: 1,
        selector: { matchLabels: { app: 'web' } },
        template: {
          spec: { containers: [] }
        }
      }
    );
    const pod = deployment.createPodFromTemplate('abc123');
    expect(pod.spec.containers).toHaveLength(0);
    expect(pod.metadata.labels).toEqual({ app: 'web' });
  });

  it('selector.matchLabels가 비어 있으면 createPodFromTemplate는 template 라벨만 사용', () => {
    const deployment = new Deployment(
      { name: 'deploy2' },
      {
        replicas: 2,
        selector: { matchLabels: {} },
        template: {
          metadata: { labels: { tier: 'front' } },
          spec: { containers: [{ name: 'c', image: 'nginx' }] }
        }
      }
    );
    const pod = deployment.createPodFromTemplate('xyz');
    expect(pod.metadata.labels).toEqual({ tier: 'front' });
    expect(pod.metadata.name).toBe('deploy2-xyz');
  });
});
