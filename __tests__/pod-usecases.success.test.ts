/**
 * Pod UseCases 성공 케이스 테스트
 * GetPodUseCase, ListPodsUseCase, DeletePodUseCase의 정상 흐름
 */
import { Pod } from '../src/domain/entities/Pod';
import { GetPodUseCase } from '../src/application/use-cases/pod/GetPodUseCase';
import { ListPodsUseCase } from '../src/application/use-cases/pod/ListPodsUseCase';
import { DeletePodUseCase } from '../src/application/use-cases/pod/DeletePodUseCase';
import { IPodRepository } from '../src/domain/repositories/IPodRepository';

describe('Pod UseCases - 성공 케이스', () => {
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

  describe('GetPodUseCase', () => {
    it('존재하는 Pod 조회 시 Pod 반환', async () => {
      const pod = new Pod(
        { name: 'my-pod', namespace: 'default' },
        { containers: [{ name: 'nginx', image: 'nginx:latest' }] }
      );
      mockPodRepository.findById.mockResolvedValue(pod);

      const result = await getPodUseCase.execute('default', 'my-pod');

      expect(result).toBe(pod);
      expect(mockPodRepository.findById).toHaveBeenCalledWith('default', 'my-pod');
    });
  });

  describe('ListPodsUseCase', () => {
    it('네임스페이스 지정 시 해당 Pod 목록 반환', async () => {
      const pods = [
        new Pod({ name: 'p1', namespace: 'default' }, { containers: [{ name: 'c', image: 'i' }] })
      ];
      mockPodRepository.findAll.mockResolvedValue(pods);

      const result = await listPodsUseCase.execute('default');

      expect(result).toEqual(pods);
      expect(mockPodRepository.findAll).toHaveBeenCalledWith('default', undefined);
    });

    it('options로 labelSelector 전달 시 findAll에 전달', async () => {
      mockPodRepository.findAll.mockResolvedValue([]);

      await listPodsUseCase.execute('default', { labelSelector: { app: 'web' } });

      expect(mockPodRepository.findAll).toHaveBeenCalledWith('default', { labelSelector: { app: 'web' } });
    });
  });

  describe('DeletePodUseCase', () => {
    it('containerId 없을 때 삭제 시 repository.delete만 호출', async () => {
      mockPodRepository.findById.mockResolvedValue(null);

      await deletePodUseCase.execute('default', 'my-pod');

      expect(mockPodRepository.findById).toHaveBeenCalledWith('default', 'my-pod');
      expect(mockContainerRuntime.stop).not.toHaveBeenCalled();
      expect(mockPodRepository.delete).toHaveBeenCalledWith('default', 'my-pod');
    });

    it('containerId 있을 때 삭제 시 stop 후 delete 호출', async () => {
      const pod = new Pod(
        { name: 'my-pod', namespace: 'default' },
        { containers: [{ name: 'c', image: 'i' }] }
      );
      (pod as any).containerId = 'abc123';
      mockPodRepository.findById.mockResolvedValue(pod);

      await deletePodUseCase.execute('default', 'my-pod');

      expect(mockContainerRuntime.stop).toHaveBeenCalledWith('abc123');
      expect(mockPodRepository.delete).toHaveBeenCalledWith('default', 'my-pod');
    });
  });
});
