import { Pod } from '../src/domain/entities/Pod';
import { DockerRuntime } from '../src/infrastructure/container/DockerRuntime';
import Docker from 'dockerode';

jest.mock('dockerode');

/**
 * Pod Entity 실패 케이스 테스트
 * 실제로 예외가 발생하거나 에러가 반환되는 케이스만 테스트
 */
describe('Pod Entity - 실패 케이스', () => {
  let dockerRuntime: DockerRuntime;
  let mockDocker: jest.Mocked<Docker>;

  beforeEach(() => {
    mockDocker = {
      createContainer: jest.fn(),
      getContainer: jest.fn()
    } as any;

    (Docker as jest.MockedClass<typeof Docker>).mockImplementation(() => mockDocker);
    dockerRuntime = new DockerRuntime();
  });

  // ============================================
  // containers가 빈 배열일 때 실제 실패 케이스
  // ============================================
  it('containers가 빈 배열인 Pod를 DockerRuntime에서 실행 시도 시 예외 발생', async () => {
    const pod = new Pod(
      { name: 'test-pod' },
      {
        containers: []
      }
    );

    // DockerRuntime.run()에서 pod.spec.containers[0]에 접근 시 undefined로 인해 에러 발생
    await expect(dockerRuntime.run(pod)).rejects.toThrow();
  });

  // ============================================
  // 컨테이너 이미지가 빈 문자열일 때 실제 실패 케이스
  // ============================================
  it('컨테이너 이미지가 빈 문자열인 Pod 실행 시도 시 Docker에서 예외 발생', async () => {
    const pod = new Pod(
      { name: 'test-pod' },
      {
        containers: [
          { name: 'nginx', image: '' }
        ]
      }
    );

    mockDocker.createContainer.mockRejectedValue(new Error('Invalid image name'));

    await expect(dockerRuntime.run(pod)).rejects.toThrow('Invalid image name');
  });

  // ============================================
  // 컨테이너 이름이 빈 문자열일 때 실제 실패 케이스
  // ============================================
  it('컨테이너 이름이 빈 문자열인 Pod 실행 시도 시 Docker에서 예외 발생 가능', async () => {
    const pod = new Pod(
      { name: 'test-pod' },
      {
        containers: [
          { name: '', image: 'nginx:latest' }
        ]
      }
    );

    mockDocker.createContainer.mockRejectedValue(new Error('Invalid container name'));

    await expect(dockerRuntime.run(pod)).rejects.toThrow('Invalid container name');
  });
});
