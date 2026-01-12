import { DockerRuntime } from '../src/infrastructure/container/DockerRuntime';
import { Pod } from '../src/domain/entities/Pod';
import Docker from 'dockerode';

jest.mock('dockerode');

/**
 * DockerRuntime 실패 케이스 테스트
 * Docker 컨테이너 실행 및 관리 중 발생할 수 있는 모든 실패 케이스를 테스트
 */
describe('DockerRuntime - 실패 케이스', () => {
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
  // 컨테이너 실행 실패 케이스
  // ============================================
  describe('run - 컨테이너 실행 실패', () => {
    it('잘못된 이미지로 Pod 실행 시도 시 예외 발생', async () => {
      const pod = new Pod(
        { name: 'nginx-test' },
        {
          containers: [
            { name: 'nginx', image: 'invalid-image:not-exists' }
          ]
        }
      );

      mockDocker.createContainer.mockRejectedValue(new Error('Image not found'));

      await expect(dockerRuntime.run(pod)).rejects.toThrow('Image not found');
    });

    it('containers가 빈 배열인 Pod 실행 시도 시 예외 발생', async () => {
      const pod = new Pod(
        { name: 'nginx-test' },
        {
          containers: []
        }
      );

      await expect(dockerRuntime.run(pod)).rejects.toThrow();
    });

    it('컨테이너 생성은 성공했지만 시작 실패 시 예외 발생', async () => {
      const pod = new Pod(
        { name: 'nginx-test' },
        {
          containers: [
            { name: 'nginx', image: 'nginx:latest' }
          ]
        }
      );

      const mockContainer = {
        start: jest.fn().mockRejectedValue(new Error('Failed to start container'))
      };

      mockDocker.createContainer.mockResolvedValue(mockContainer as any);

      await expect(dockerRuntime.run(pod)).rejects.toThrow('Failed to start container');
    });

    it('매우 긴 이름의 Pod 실행 시도', async () => {
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

    it('특수문자가 포함된 Pod 이름으로 실행 시도', async () => {
      const pod = new Pod(
        { name: 'pod-!@#$%' },
        {
          containers: [
            { name: 'nginx', image: 'nginx:latest' }
          ]
        }
      );

      mockDocker.createContainer.mockRejectedValue(new Error('Invalid container name'));

      await expect(dockerRuntime.run(pod)).rejects.toThrow('Invalid container name');
    });

    it('env 배열에 잘못된 형식의 데이터가 있을 때', async () => {
      const pod = new Pod(
        { name: 'nginx-test' },
        {
          containers: [
            {
              name: 'nginx',
              image: 'nginx:latest',
              env: [
                { name: null as any, value: 'test' },
                { name: 'VALID', value: 'test' }
              ]
            }
          ]
        }
      );

      mockDocker.createContainer.mockRejectedValue(new Error('Invalid environment variable'));

      await expect(dockerRuntime.run(pod)).rejects.toThrow('Invalid environment variable');
    });

    it('ports 배열에 잘못된 형식의 데이터가 있을 때', async () => {
      const pod = new Pod(
        { name: 'nginx-test' },
        {
          containers: [
            {
              name: 'nginx',
              image: 'nginx:latest',
              ports: [
                { containerPort: null as any, protocol: 'tcp' }
              ]
            }
          ]
        }
      );

      mockDocker.createContainer.mockRejectedValue(new Error('Invalid port configuration'));

      await expect(dockerRuntime.run(pod)).rejects.toThrow('Invalid port configuration');
    });

    it('포트 번호가 음수인 Pod 실행 시도', async () => {
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

    it('환경 변수 이름이 null인 Pod 실행 시도', async () => {
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
  });

  // ============================================
  // 컨테이너 중지 실패 케이스
  // ============================================
  describe('stop - 컨테이너 중지 실패', () => {
    it('존재하지 않는 컨테이너 ID로 중지 시도 시 예외 발생', async () => {
      const mockContainer = {
        stop: jest.fn().mockRejectedValue(new Error('Container not found')),
        remove: jest.fn()
      };
      mockDocker.getContainer.mockReturnValue(mockContainer as any);

      await expect(dockerRuntime.stop('invalid-container-id')).rejects.toThrow('Container not found');
    });

    it('컨테이너 중지는 성공했지만 삭제 실패 시 예외 발생', async () => {
      const mockContainer = {
        stop: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockRejectedValue(new Error('Failed to remove container'))
      };
      mockDocker.getContainer.mockReturnValue(mockContainer as any);

      await expect(dockerRuntime.stop('container-id')).rejects.toThrow('Failed to remove container');
    });

    it('빈 컨테이너 ID로 중지 시도', async () => {
      const mockContainer = {
        stop: jest.fn().mockRejectedValue(new Error('Invalid container ID')),
        remove: jest.fn()
      };
      mockDocker.getContainer.mockReturnValue(mockContainer as any);

      await expect(dockerRuntime.stop('')).rejects.toThrow();
    });
  });

  // ============================================
  // 컨테이너 상태 조회 실패 케이스
  // ============================================
  describe('getStatus - 컨테이너 상태 조회 실패', () => {
    it('존재하지 않는 컨테이너 ID로 상태 조회 시 예외 발생', async () => {
      const mockContainer = {
        inspect: jest.fn().mockRejectedValue(new Error('Container not found'))
      };
      mockDocker.getContainer.mockReturnValue(mockContainer as any);

      await expect(dockerRuntime.getStatus('invalid-container-id')).rejects.toThrow('Container not found');
    });

    it('null 컨테이너 ID로 상태 조회 시도', async () => {
      const mockContainer = {
        inspect: jest.fn().mockRejectedValue(new Error('Invalid container ID'))
      };
      mockDocker.getContainer.mockReturnValue(mockContainer as any);

      await expect(dockerRuntime.getStatus(null as any)).rejects.toThrow();
    });
  });
});
