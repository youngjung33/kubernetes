import { GetPodUseCase } from '../src/application/use-cases/pod/GetPodUseCase';
import { ListPodsUseCase } from '../src/application/use-cases/pod/ListPodsUseCase';
import { DeletePodUseCase } from '../src/application/use-cases/pod/DeletePodUseCase';
import { IPodRepository } from '../src/domain/repositories/IPodRepository';

/**
 * Pod UseCases 실패 케이스 테스트
 * GetPodUseCase, ListPodsUseCase, DeletePodUseCase의 실패 케이스를 테스트
 */
describe('Pod UseCases - 실패 케이스', () => {
  let mockPodRepository: jest.Mocked<IPodRepository>;
  let mockContainerRuntime: { stop: jest.Mock };
  let getPodUseCase: GetPodUseCase;
  let listPodsUseCase: ListPodsUseCase;
  let deletePodUseCase: DeletePodUseCase;

  beforeEach(() => {
    mockPodRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;
    mockContainerRuntime = { stop: jest.fn().mockResolvedValue(undefined) };

    getPodUseCase = new GetPodUseCase(mockPodRepository);
    listPodsUseCase = new ListPodsUseCase(mockPodRepository);
    deletePodUseCase = new DeletePodUseCase(mockPodRepository, mockContainerRuntime as any);
  });

  // ============================================
  // GetPodUseCase 실패 케이스
  // ============================================
  describe('GetPodUseCase', () => {
    it('Repository에서 예외 발생 시 예외 전파', async () => {
      mockPodRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      await expect(getPodUseCase.execute('default', 'test-pod')).rejects.toThrow('Database connection failed');
    });

    it('빈 네임스페이스로 조회 시도', async () => {
      mockPodRepository.findById.mockResolvedValue(null);

      const result = await getPodUseCase.execute('', 'test-pod');

      expect(result).toBeNull();
      expect(mockPodRepository.findById).toHaveBeenCalledWith('', 'test-pod');
    });

    it('빈 이름으로 조회 시도', async () => {
      mockPodRepository.findById.mockResolvedValue(null);

      const result = await getPodUseCase.execute('default', '');

      expect(result).toBeNull();
      expect(mockPodRepository.findById).toHaveBeenCalledWith('default', '');
    });
  });

  // ============================================
  // ListPodsUseCase 실패 케이스
  // ============================================
  describe('ListPodsUseCase', () => {
    it('Repository에서 예외 발생 시 예외 전파', async () => {
      mockPodRepository.findAll.mockRejectedValue(new Error('Failed to list pods'));

      await expect(listPodsUseCase.execute('default')).rejects.toThrow('Failed to list pods');
    });

    it('빈 네임스페이스로 조회 시도', async () => {
      mockPodRepository.findAll.mockResolvedValue([]);

      const result = await listPodsUseCase.execute('');

      expect(result).toEqual([]);
      expect(mockPodRepository.findAll).toHaveBeenCalledWith('', undefined);
    });

    it('undefined 네임스페이스로 조회 시도', async () => {
      mockPodRepository.findAll.mockResolvedValue([]);

      const result = await listPodsUseCase.execute(undefined);

      expect(result).toEqual([]);
      expect(mockPodRepository.findAll).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  // ============================================
  // DeletePodUseCase 실패 케이스
  // ============================================
  describe('DeletePodUseCase', () => {
    it('Repository에서 예외 발생 시 예외 전파', async () => {
      mockPodRepository.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(deletePodUseCase.execute('default', 'test-pod')).rejects.toThrow('Delete failed');
    });

    it('빈 네임스페이스로 삭제 시도', async () => {
      mockPodRepository.delete.mockResolvedValue(undefined);

      await deletePodUseCase.execute('', 'test-pod');

      expect(mockPodRepository.delete).toHaveBeenCalledWith('', 'test-pod');
    });

    it('빈 이름으로 삭제 시도', async () => {
      mockPodRepository.delete.mockResolvedValue(undefined);

      await deletePodUseCase.execute('default', '');

      expect(mockPodRepository.delete).toHaveBeenCalledWith('default', '');
    });
  });
});
