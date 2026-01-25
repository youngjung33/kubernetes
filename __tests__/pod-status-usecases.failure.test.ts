import { GetPodStatusUseCase } from '../src/application/use-cases/pod/GetPodStatusUseCase';
import { RestartPodUseCase } from '../src/application/use-cases/pod/RestartPodUseCase';
import { GetPodLogsUseCase } from '../src/application/use-cases/pod/GetPodLogsUseCase';
import { IPodRepository } from '../src/domain/repositories/IPodRepository';
import { IContainerRuntime } from '../src/domain/services/IContainerRuntime';
import { Pod } from '../src/domain/entities/Pod';
import { PodPhase } from '../src/domain/entities/Pod';

/**
 * Pod 상태 관리 UseCase 실패 케이스 테스트
 */
describe('Pod 상태 관리 UseCases - 실패 케이스', () => {
  let mockPodRepository: jest.Mocked<IPodRepository>;
  let mockContainerRuntime: jest.Mocked<IContainerRuntime>;
  let getPodStatusUseCase: GetPodStatusUseCase;
  let restartPodUseCase: RestartPodUseCase;
  let getPodLogsUseCase: GetPodLogsUseCase;

  beforeEach(() => {
    mockPodRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockContainerRuntime = {
      run: jest.fn(),
      stop: jest.fn(),
      getStatus: jest.fn(),
      getLogs: jest.fn(),
    } as any;

    getPodStatusUseCase = new GetPodStatusUseCase(mockPodRepository, mockContainerRuntime);
    restartPodUseCase = new RestartPodUseCase(mockPodRepository, mockContainerRuntime);
    getPodLogsUseCase = new GetPodLogsUseCase(mockPodRepository, mockContainerRuntime);
  });

  // ============================================
  // GetPodStatusUseCase 실패 케이스
  // ============================================
  describe('GetPodStatusUseCase', () => {
    it('존재하지 않는 Pod 상태 조회 시 예외 발생', async () => {
      mockPodRepository.findById.mockResolvedValue(null);

      await expect(getPodStatusUseCase.execute('default', 'non-existent-pod')).rejects.toThrow(
        'Pod non-existent-pod not found in namespace default'
      );
      expect(mockPodRepository.findById).toHaveBeenCalledWith('default', 'non-existent-pod');
    });

    it('PodRepository.findById에서 예외 발생 시 예외 전파', async () => {
      mockPodRepository.findById.mockRejectedValue(new Error('DB connection error'));

      await expect(getPodStatusUseCase.execute('default', 'test-pod')).rejects.toThrow('DB connection error');
      expect(mockPodRepository.findById).toHaveBeenCalledWith('default', 'test-pod');
    });

    it('Pod에 컨테이너 ID가 없을 때 예외 발생', async () => {
      const pod = new Pod({ name: 'test-pod' }, { containers: [{ name: 'c1', image: 'img1' }] });
      pod.status = { phase: PodPhase.Running };
      mockPodRepository.findById.mockResolvedValue(pod);

      await expect(getPodStatusUseCase.execute('default', 'test-pod')).rejects.toThrow(
        'Container ID not found for pod test-pod'
      );
    });

    it('ContainerRuntime.getStatus에서 예외 발생 시 예외 전파', async () => {
      const pod = new Pod({ name: 'test-pod' }, { containers: [{ name: 'c1', image: 'img1' }] });
      pod.status = {
        phase: PodPhase.Running,
        containerStatuses: [{ name: 'c1', state: { running: { startedAt: '2024-01-01' } } }]
      };
      (pod as any).containerId = 'container-123';
      mockPodRepository.findById.mockResolvedValue(pod);
      mockContainerRuntime.getStatus.mockRejectedValue(new Error('Container not found'));

      await expect(getPodStatusUseCase.execute('default', 'test-pod')).rejects.toThrow('Container not found');
    });

    it('빈 이름으로 상태 조회 시도 시 예외 발생', async () => {
      mockPodRepository.findById.mockResolvedValue(null);

      await expect(getPodStatusUseCase.execute('default', '')).rejects.toThrow('Pod  not found in namespace default');
    });
  });

  // ============================================
  // RestartPodUseCase 실패 케이스
  // ============================================
  describe('RestartPodUseCase', () => {
    it('존재하지 않는 Pod 재시작 시도 시 예외 발생', async () => {
      mockPodRepository.findById.mockResolvedValue(null);

      await expect(restartPodUseCase.execute('default', 'non-existent-pod')).rejects.toThrow(
        'Pod non-existent-pod not found in namespace default'
      );
      expect(mockPodRepository.findById).toHaveBeenCalledWith('default', 'non-existent-pod');
    });

    it('PodRepository.findById에서 예외 발생 시 예외 전파', async () => {
      mockPodRepository.findById.mockRejectedValue(new Error('DB connection error'));

      await expect(restartPodUseCase.execute('default', 'test-pod')).rejects.toThrow('DB connection error');
    });

    it('Pod에 컨테이너 ID가 없을 때 예외 발생', async () => {
      const pod = new Pod({ name: 'test-pod' }, { containers: [{ name: 'c1', image: 'img1' }] });
      mockPodRepository.findById.mockResolvedValue(pod);

      await expect(restartPodUseCase.execute('default', 'test-pod')).rejects.toThrow(
        'Container ID not found for pod test-pod'
      );
    });

    it('ContainerRuntime.stop에서 예외 발생 시 예외 전파', async () => {
      const pod = new Pod({ name: 'test-pod' }, { containers: [{ name: 'c1', image: 'img1' }] });
      (pod as any).containerId = 'container-123';
      mockPodRepository.findById.mockResolvedValue(pod);
      mockContainerRuntime.stop.mockRejectedValue(new Error('Stop failed'));

      await expect(restartPodUseCase.execute('default', 'test-pod')).rejects.toThrow('Stop failed');
      expect(mockContainerRuntime.stop).toHaveBeenCalledWith('container-123');
    });

    it('ContainerRuntime.run에서 예외 발생 시 예외 전파', async () => {
      const pod = new Pod({ name: 'test-pod' }, { containers: [{ name: 'c1', image: 'img1' }] });
      (pod as any).containerId = 'container-123';
      mockPodRepository.findById.mockResolvedValue(pod);
      mockContainerRuntime.stop.mockResolvedValue(undefined);
      mockContainerRuntime.run.mockRejectedValue(new Error('Run failed'));

      await expect(restartPodUseCase.execute('default', 'test-pod')).rejects.toThrow('Run failed');
    });

    it('PodRepository.update에서 예외 발생 시 예외 전파', async () => {
      const pod = new Pod({ name: 'test-pod' }, { containers: [{ name: 'c1', image: 'img1' }] });
      (pod as any).containerId = 'container-123';
      mockPodRepository.findById.mockResolvedValue(pod);
      mockContainerRuntime.stop.mockResolvedValue(undefined);
      mockContainerRuntime.run.mockResolvedValue({ id: 'new-container-123', status: 'running', running: true });
      mockPodRepository.update.mockRejectedValue(new Error('Update failed'));

      await expect(restartPodUseCase.execute('default', 'test-pod')).rejects.toThrow('Update failed');
    });

    it('빈 이름으로 재시작 시도 시 예외 발생', async () => {
      mockPodRepository.findById.mockResolvedValue(null);

      await expect(restartPodUseCase.execute('default', '')).rejects.toThrow('Pod  not found in namespace default');
    });
  });

  // ============================================
  // GetPodLogsUseCase 실패 케이스
  // ============================================
  describe('GetPodLogsUseCase', () => {
    it('존재하지 않는 Pod 로그 조회 시 예외 발생', async () => {
      mockPodRepository.findById.mockResolvedValue(null);

      await expect(getPodLogsUseCase.execute('default', 'non-existent-pod')).rejects.toThrow(
        'Pod non-existent-pod not found in namespace default'
      );
      expect(mockPodRepository.findById).toHaveBeenCalledWith('default', 'non-existent-pod');
    });

    it('PodRepository.findById에서 예외 발생 시 예외 전파', async () => {
      mockPodRepository.findById.mockRejectedValue(new Error('DB connection error'));

      await expect(getPodLogsUseCase.execute('default', 'test-pod')).rejects.toThrow('DB connection error');
    });

    it('Pod에 컨테이너 ID가 없을 때 예외 발생', async () => {
      const pod = new Pod({ name: 'test-pod' }, { containers: [{ name: 'c1', image: 'img1' }] });
      mockPodRepository.findById.mockResolvedValue(pod);

      await expect(getPodLogsUseCase.execute('default', 'test-pod')).rejects.toThrow(
        'Container ID not found for pod test-pod'
      );
    });

    it('ContainerRuntime.getLogs에서 예외 발생 시 예외 전파', async () => {
      const pod = new Pod({ name: 'test-pod' }, { containers: [{ name: 'c1', image: 'img1' }] });
      (pod as any).containerId = 'container-123';
      mockPodRepository.findById.mockResolvedValue(pod);
      mockContainerRuntime.getLogs.mockRejectedValue(new Error('Logs not available'));

      await expect(getPodLogsUseCase.execute('default', 'test-pod')).rejects.toThrow('Logs not available');
      expect(mockContainerRuntime.getLogs).toHaveBeenCalledWith('container-123');
    });

    it('빈 이름으로 로그 조회 시도 시 예외 발생', async () => {
      mockPodRepository.findById.mockResolvedValue(null);

      await expect(getPodLogsUseCase.execute('default', '')).rejects.toThrow('Pod  not found in namespace default');
    });
  });
});
