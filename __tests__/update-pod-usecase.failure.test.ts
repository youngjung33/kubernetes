import { UpdatePodUseCase } from '../src/application/use-cases/pod/UpdatePodUseCase';
import { Pod } from '../src/domain/entities/Pod';
import { IPodRepository } from '../src/domain/repositories/IPodRepository';

/**
 * UpdatePodUseCase 실패 케이스 테스트
 * Pod 업데이트 과정에서 발생할 수 있는 모든 실패 케이스를 테스트
 */
describe('UpdatePodUseCase - 실패 케이스', () => {
  let updatePodUseCase: UpdatePodUseCase;
  let mockPodRepository: jest.Mocked<IPodRepository>;

  beforeEach(() => {
    mockPodRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    updatePodUseCase = new UpdatePodUseCase(mockPodRepository);
  });

  // ============================================
  // Pod 조회 실패 케이스
  // ============================================
  it('존재하지 않는 Pod 업데이트 시도 시 예외 발생', async () => {
    const pod = new Pod(
      { name: 'nginx-test' },
      {
        containers: [
          { name: 'nginx', image: 'nginx:latest' }
        ]
      }
    );

    mockPodRepository.findById.mockResolvedValue(null);

    await expect(
      updatePodUseCase.execute('default', 'nginx-test', pod)
    ).rejects.toThrow('Pod not found');
  });

  it('Repository에서 Pod 조회 실패 시 예외 발생', async () => {
    const pod = new Pod(
      { name: 'nginx-test' },
      {
        containers: [
          { name: 'nginx', image: 'nginx:latest' }
        ]
      }
    );

    mockPodRepository.findById.mockRejectedValue(new Error('Database connection failed'));

    await expect(
      updatePodUseCase.execute('default', 'nginx-test', pod)
    ).rejects.toThrow('Database connection failed');
  });

  // ============================================
  // Pod 업데이트 실패 케이스
  // ============================================
  it('Pod 업데이트 저장 실패 시 예외 발생', async () => {
    const existingPod = new Pod(
      { name: 'nginx-test' },
      {
        containers: [
          { name: 'nginx', image: 'nginx:latest' }
        ]
      }
    );

    const updatedPod = new Pod(
      { name: 'nginx-test' },
      {
        containers: [
          { name: 'nginx', image: 'nginx:1.21' }
        ]
      }
    );

    mockPodRepository.findById.mockResolvedValue(existingPod);
    mockPodRepository.update.mockRejectedValue(new Error('Storage write failed'));

    await expect(
      updatePodUseCase.execute('default', 'nginx-test', updatedPod)
    ).rejects.toThrow('Storage write failed');
  });

  // ============================================
  // 잘못된 입력 케이스
  // ============================================
  it('null Pod로 업데이트 시도 시 예외 발생', async () => {
    const existingPod = new Pod(
      { name: 'nginx-test' },
      {
        containers: [
          { name: 'nginx', image: 'nginx:latest' }
        ]
      }
    );

    mockPodRepository.findById.mockResolvedValue(existingPod);

    await expect(
      updatePodUseCase.execute('default', 'nginx-test', null as any)
    ).rejects.toThrow();
  });

  it('빈 네임스페이스로 업데이트 시도', async () => {
    const pod = new Pod(
      { name: 'nginx-test' },
      {
        containers: [
          { name: 'nginx', image: 'nginx:latest' }
        ]
      }
    );

    mockPodRepository.findById.mockResolvedValue(null);

    await expect(
      updatePodUseCase.execute('', 'nginx-test', pod)
    ).rejects.toThrow('Pod not found');
  });

  it('빈 이름으로 업데이트 시도', async () => {
    const pod = new Pod(
      { name: 'nginx-test' },
      {
        containers: [
          { name: 'nginx', image: 'nginx:latest' }
        ]
      }
    );

    mockPodRepository.findById.mockResolvedValue(null);

    await expect(
      updatePodUseCase.execute('default', '', pod)
    ).rejects.toThrow('Pod not found');
  });
});
