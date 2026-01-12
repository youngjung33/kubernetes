import { Pod } from '../src/domain/entities/Pod';
import { DockerRuntime } from '../src/infrastructure/container/DockerRuntime';
import Docker from 'dockerode';

jest.mock('dockerode');

/**
 * Edge Cases 및 Validation 실패 케이스 테스트
 * 실제로 예외가 발생하거나 에러가 반환되는 케이스만 테스트
 */
describe('Edge Cases & Validation - 실패 케이스', () => {
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
  // Pod Entity - 실제 실패 케이스
  // ============================================
  describe('Pod Entity - 실제 실패 케이스', () => {
    it('containers가 null인 spec으로 Pod 생성 후 DockerRuntime 실행 시도 시 예외 발생', async () => {
      const pod = new Pod(
        { name: 'test-pod' },
        {
          containers: null as any
        }
      );

      // DockerRuntime.run()에서 pod.spec.containers[0]에 접근 시 에러 발생
      await expect(dockerRuntime.run(pod)).rejects.toThrow();
    });

    it('spec이 null인 Pod 생성 후 DockerRuntime 실행 시도 시 예외 발생', async () => {
      const pod = new Pod(
        { name: 'test-pod' },
        null as any
      );

      // DockerRuntime.run()에서 pod.spec.containers에 접근 시 에러 발생
      await expect(dockerRuntime.run(pod)).rejects.toThrow();
    });

    it('매우 긴 이름으로 Pod 생성 후 DockerRuntime 실행 시도 시 Docker에서 예외 발생 가능', async () => {
      const longName = 'a'.repeat(200);
      const pod = new Pod(
        { name: longName },
        {
          containers: [
            { name: 'nginx', image: 'nginx:latest' }
          ]
        }
      );

      mockDocker.createContainer.mockRejectedValue(new Error('Container name too long'));

      await expect(dockerRuntime.run(pod)).rejects.toThrow('Container name too long');
    });

    it('특수문자가 포함된 이름으로 Pod 생성 후 DockerRuntime 실행 시도 시 Docker에서 예외 발생 가능', async () => {
      const specialName = 'pod-!@#$%^&*()_+-=[]{}|;:,.<>?';
      const pod = new Pod(
        { name: specialName },
        {
          containers: [
            { name: 'nginx', image: 'nginx:latest' }
          ]
        }
      );

      mockDocker.createContainer.mockRejectedValue(new Error('Invalid container name'));

      await expect(dockerRuntime.run(pod)).rejects.toThrow('Invalid container name');
    });

    it('컨테이너 이미지가 공백만 있는 Pod 실행 시도 시 Docker에서 예외 발생', async () => {
      const pod = new Pod(
        { name: 'test-pod' },
        {
          containers: [
            { name: 'nginx', image: '   ' }
          ]
        }
      );

      mockDocker.createContainer.mockRejectedValue(new Error('Invalid image name'));

      await expect(dockerRuntime.run(pod)).rejects.toThrow('Invalid image name');
    });

    it('포트 번호가 음수인 Pod 실행 시도 시 Docker에서 예외 발생', async () => {
      const pod = new Pod(
        { name: 'test-pod' },
        {
          containers: [
            {
              name: 'nginx',
              image: 'nginx:latest',
              ports: [
                { containerPort: -1 }
              ]
            }
          ]
        }
      );

      mockDocker.createContainer.mockRejectedValue(new Error('Invalid port number'));

      await expect(dockerRuntime.run(pod)).rejects.toThrow('Invalid port number');
    });

    it('포트 번호가 매우 큰 값인 Pod 실행 시도 시 Docker에서 예외 발생 가능', async () => {
      const pod = new Pod(
        { name: 'test-pod' },
        {
          containers: [
            {
              name: 'nginx',
              image: 'nginx:latest',
              ports: [
                { containerPort: 999999 }
              ]
            }
          ]
        }
      );

      mockDocker.createContainer.mockRejectedValue(new Error('Port number out of range'));

      await expect(dockerRuntime.run(pod)).rejects.toThrow('Port number out of range');
    });

    it('환경 변수 이름이 null인 Pod 실행 시도 시 Docker에서 예외 발생', async () => {
      const pod = new Pod(
        { name: 'test-pod' },
        {
          containers: [
            {
              name: 'nginx',
              image: 'nginx:latest',
              env: [
                { name: null as any, value: 'test' }
              ]
            }
          ]
        }
      );

      mockDocker.createContainer.mockRejectedValue(new Error('Invalid environment variable name'));

      await expect(dockerRuntime.run(pod)).rejects.toThrow('Invalid environment variable name');
    });

    it('환경 변수 값이 null인 Pod 실행 시도 시 Docker에서 예외 발생 가능', async () => {
      const pod = new Pod(
        { name: 'test-pod' },
        {
          containers: [
            {
              name: 'nginx',
              image: 'nginx:latest',
              env: [
                { name: 'VAR', value: null as any }
              ]
            }
          ]
        }
      );

      mockDocker.createContainer.mockRejectedValue(new Error('Invalid environment variable value'));

      await expect(dockerRuntime.run(pod)).rejects.toThrow('Invalid environment variable value');
    });
  });
});
