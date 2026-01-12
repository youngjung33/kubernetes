import { CreatePodUseCase } from '../src/application/use-cases/pod/CreatePodUseCase';
import { Pod } from '../src/domain/entities/Pod';
import { IPodRepository } from '../src/domain/repositories/IPodRepository';
import { IScheduler } from '../src/domain/services/IScheduler';
import { INodeRepository } from '../src/domain/repositories/INodeRepository';
import { IContainerRuntime } from '../src/domain/services/IContainerRuntime';

/**
 * CreatePodUseCase 실패 케이스 테스트
 * Pod 생성 과정에서 발생할 수 있는 모든 실패 케이스를 테스트
 */
describe('CreatePodUseCase - 실패 케이스', () => {
  let createPodUseCase: CreatePodUseCase;
  let mockPodRepository: jest.Mocked<IPodRepository>;
  let mockScheduler: jest.Mocked<IScheduler>;
  let mockNodeRepository: jest.Mocked<INodeRepository>;
  let mockContainerRuntime: jest.Mocked<IContainerRuntime>;

  beforeEach(() => {
    mockPodRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    mockScheduler = {
      schedule: jest.fn()
    } as any;

    mockNodeRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    mockContainerRuntime = {
      run: jest.fn(),
      stop: jest.fn(),
      getStatus: jest.fn()
    } as any;

    createPodUseCase = new CreatePodUseCase(
      mockPodRepository,
      mockScheduler,
      mockNodeRepository,
      mockContainerRuntime
    );
  });

  // ============================================
  // 스케줄링 실패 케이스
  // ============================================
  it('노드가 없을 때 스케줄링 실패 시 예외 발생', async () => {
    const pod = new Pod(
      { name: 'nginx-test' },
      {
        containers: [
          { name: 'nginx', image: 'nginx:latest' }
        ]
      }
    );

    mockPodRepository.create.mockResolvedValue(pod);
    mockNodeRepository.findAll.mockResolvedValue([]);
    mockScheduler.schedule.mockRejectedValue(new Error('No available nodes'));

    await expect(createPodUseCase.execute(pod)).rejects.toThrow('No available nodes');
    expect(mockPodRepository.create).toHaveBeenCalled();
    expect(mockNodeRepository.findAll).toHaveBeenCalled();
    expect(mockScheduler.schedule).toHaveBeenCalled();
  });

  it('스케줄러가 null 노드를 반환 시 예외 발생 가능', async () => {
    const pod = new Pod(
      { name: 'nginx-test' },
      {
        containers: [
          { name: 'nginx', image: 'nginx:latest' }
        ]
      }
    );

    mockPodRepository.create.mockResolvedValue(pod);
    mockNodeRepository.findAll.mockResolvedValue([{ metadata: { name: 'node1' } } as any]);
    mockScheduler.schedule.mockResolvedValue(null as any);

    await expect(createPodUseCase.execute(pod)).rejects.toThrow();
  });

  // ============================================
  // 컨테이너 실행 실패 케이스
  // ============================================
  it('컨테이너 실행 실패 시 예외 발생', async () => {
    const pod = new Pod(
      { name: 'nginx-test' },
      {
        containers: [
          { name: 'nginx', image: 'invalid-image:latest' }
        ]
      }
    );

    const mockNode = { metadata: { name: 'node1' } } as any;

    mockPodRepository.create.mockResolvedValue(pod);
    mockNodeRepository.findAll.mockResolvedValue([mockNode]);
    mockScheduler.schedule.mockResolvedValue(mockNode);
    mockPodRepository.update.mockResolvedValue(pod);
    mockContainerRuntime.run.mockRejectedValue(new Error('Image not found'));

    await expect(createPodUseCase.execute(pod)).rejects.toThrow('Image not found');
    expect(mockContainerRuntime.run).toHaveBeenCalled();
  });

  it('containers가 빈 배열인 Pod 실행 시도 시 컨테이너 런타임에서 실패', async () => {
    const pod = new Pod(
      { name: 'nginx-test' },
      {
        containers: []
      }
    );

    const mockNode = { metadata: { name: 'node1' } } as any;

    mockPodRepository.create.mockResolvedValue(pod);
    mockNodeRepository.findAll.mockResolvedValue([mockNode]);
    mockScheduler.schedule.mockResolvedValue(mockNode);
    mockPodRepository.update.mockResolvedValue(pod);
    mockContainerRuntime.run.mockRejectedValue(new Error('Containers array is empty'));

    await expect(createPodUseCase.execute(pod)).rejects.toThrow('Containers array is empty');
  });

  it('컨테이너 이미지가 공백만 있는 Pod 실행 시도', async () => {
    const pod = new Pod(
      { name: 'test-pod' },
      {
        containers: [
          { name: 'nginx', image: '   ' }
        ]
      }
    );

    const mockNode = { metadata: { name: 'node1' } } as any;

    mockPodRepository.create.mockResolvedValue(pod);
    mockNodeRepository.findAll.mockResolvedValue([mockNode]);
    mockScheduler.schedule.mockResolvedValue(mockNode);
    mockPodRepository.update.mockResolvedValue(pod);
    mockContainerRuntime.run.mockRejectedValue(new Error('Invalid image name'));

    await expect(createPodUseCase.execute(pod)).rejects.toThrow('Invalid image name');
  });

  // ============================================
  // 저장소 실패 케이스
  // ============================================
  it('Pod 저장 실패 시 예외 발생', async () => {
    const pod = new Pod(
      { name: 'nginx-test' },
      {
        containers: [
          { name: 'nginx', image: 'nginx:latest' }
        ]
      }
    );

    mockPodRepository.create.mockRejectedValue(new Error('Storage error'));

    await expect(createPodUseCase.execute(pod)).rejects.toThrow('Storage error');
  });

  it('Pod 업데이트 실패 시 예외 발생', async () => {
    const pod = new Pod(
      { name: 'nginx-test' },
      {
        containers: [
          { name: 'nginx', image: 'nginx:latest' }
        ]
      }
    );

    const mockNode = { metadata: { name: 'node1' } } as any;

    mockPodRepository.create.mockResolvedValue(pod);
    mockNodeRepository.findAll.mockResolvedValue([mockNode]);
    mockScheduler.schedule.mockResolvedValue(mockNode);
    mockPodRepository.update.mockRejectedValue(new Error('Update failed'));

    await expect(createPodUseCase.execute(pod)).rejects.toThrow('Update failed');
  });

  it('Pod 업데이트 후 컨테이너 실행 전에 예외 발생 시 롤백되지 않음', async () => {
    const pod = new Pod(
      { name: 'nginx-test' },
      {
        containers: [
          { name: 'nginx', image: 'nginx:latest' }
        ]
      }
    );

    const mockNode = { metadata: { name: 'node1' } } as any;

    mockPodRepository.create.mockResolvedValue(pod);
    mockNodeRepository.findAll.mockResolvedValue([mockNode]);
    mockScheduler.schedule.mockResolvedValue(mockNode);
    mockPodRepository.update.mockResolvedValue(pod);
    mockContainerRuntime.run.mockRejectedValue(new Error('Container runtime error'));

    await expect(createPodUseCase.execute(pod)).rejects.toThrow('Container runtime error');
    
    // Pod는 이미 업데이트되었지만 컨테이너는 실행되지 않음
    expect(mockPodRepository.update).toHaveBeenCalled();
  });

  // ============================================
  // 노드 조회 실패 케이스
  // ============================================
  it('노드 목록 조회 실패 시 예외 발생', async () => {
    const pod = new Pod(
      { name: 'nginx-test' },
      {
        containers: [
          { name: 'nginx', image: 'nginx:latest' }
        ]
      }
    );

    mockPodRepository.create.mockResolvedValue(pod);
    mockNodeRepository.findAll.mockRejectedValue(new Error('Failed to get nodes'));

    await expect(createPodUseCase.execute(pod)).rejects.toThrow('Failed to get nodes');
  });
});
