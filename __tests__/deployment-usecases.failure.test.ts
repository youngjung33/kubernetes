import { Deployment } from '../src/domain/entities/Deployment';
import { CreateDeploymentUseCase } from '../src/application/use-cases/deployment/CreateDeploymentUseCase';
import { GetDeploymentUseCase } from '../src/application/use-cases/deployment/GetDeploymentUseCase';
import { ListDeploymentsUseCase } from '../src/application/use-cases/deployment/ListDeploymentsUseCase';
import { ReconcileDeploymentUseCase } from '../src/application/use-cases/deployment/ReconcileDeploymentUseCase';
import { DeleteDeploymentUseCase } from '../src/application/use-cases/deployment/DeleteDeploymentUseCase';
import { IDeploymentRepository } from '../src/domain/repositories/IDeploymentRepository';
import { IPodRepository } from '../src/domain/repositories/IPodRepository';
import { CreatePodUseCase } from '../src/application/use-cases/pod/CreatePodUseCase';
import { DeletePodUseCase } from '../src/application/use-cases/pod/DeletePodUseCase';

/**
 * Deployment UseCases 실패 케이스 테스트
 */
describe('Deployment UseCases - 실패 케이스', () => {
  let mockDeploymentRepository: jest.Mocked<IDeploymentRepository>;
  let mockPodRepository: jest.Mocked<IPodRepository>;
  let mockCreatePodUseCase: jest.Mocked<CreatePodUseCase>;
  let mockDeletePodUseCase: jest.Mocked<DeletePodUseCase>;

  beforeEach(() => {
    mockDeploymentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;
    mockPodRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;
    mockCreatePodUseCase = { execute: jest.fn() } as any;
    mockDeletePodUseCase = { execute: jest.fn() } as any;
  });

  describe('CreateDeploymentUseCase', () => {
    it('동일 namespace/name이 이미 있으면 예외 발생', async () => {
      const deployment = new Deployment(
        { name: 'dup', namespace: 'default' },
        { replicas: 1, selector: { matchLabels: { app: 'x' } }, template: { spec: { containers: [{ name: 'c', image: 'i' }] } } }
      );
      mockDeploymentRepository.findById.mockResolvedValue(deployment as any);

      const useCase = new CreateDeploymentUseCase(mockDeploymentRepository);

      await expect(useCase.execute(deployment)).rejects.toThrow('already exists');
      expect(mockDeploymentRepository.create).not.toHaveBeenCalled();
    });

    it('Repository create에서 예외 발생 시 전파', async () => {
      mockDeploymentRepository.findById.mockResolvedValue(null);
      mockDeploymentRepository.create.mockRejectedValue(new Error('Store failed'));

      const deployment = new Deployment(
        { name: 'new', namespace: 'default' },
        { replicas: 1, selector: { matchLabels: {} }, template: { spec: { containers: [{ name: 'c', image: 'i' }] } } }
      );
      const useCase = new CreateDeploymentUseCase(mockDeploymentRepository);

      await expect(useCase.execute(deployment)).rejects.toThrow('Store failed');
    });
  });

  describe('GetDeploymentUseCase', () => {
    it('존재하지 않으면 null 반환', async () => {
      mockDeploymentRepository.findById.mockResolvedValue(null);
      const useCase = new GetDeploymentUseCase(mockDeploymentRepository);

      const result = await useCase.execute('default', 'missing');

      expect(result).toBeNull();
      expect(mockDeploymentRepository.findById).toHaveBeenCalledWith('default', 'missing');
    });
  });

  describe('ListDeploymentsUseCase', () => {
    it('Repository findAll 예외 시 전파', async () => {
      mockDeploymentRepository.findAll.mockRejectedValue(new Error('List failed'));
      const useCase = new ListDeploymentsUseCase(mockDeploymentRepository);

      await expect(useCase.execute('default')).rejects.toThrow('List failed');
    });
  });

  describe('ReconcileDeploymentUseCase', () => {
    it('Deployment가 없으면 예외 발생', async () => {
      mockDeploymentRepository.findById.mockResolvedValue(null);
      const useCase = new ReconcileDeploymentUseCase(
        mockDeploymentRepository,
        mockPodRepository,
        mockCreatePodUseCase,
        mockDeletePodUseCase
      );

      await expect(useCase.execute('default', 'missing')).rejects.toThrow('not found');
      expect(mockPodRepository.findAll).not.toHaveBeenCalled();
    });

    it('podRepository.findAll 예외 시 전파', async () => {
      const deployment = new Deployment(
        { name: 'r', namespace: 'default' },
        { replicas: 2, selector: { matchLabels: { app: 'a' } }, template: { spec: { containers: [{ name: 'c', image: 'i' }] } } }
      );
      mockDeploymentRepository.findById.mockResolvedValue(deployment as any);
      mockPodRepository.findAll.mockRejectedValue(new Error('Pod list failed'));

      const useCase = new ReconcileDeploymentUseCase(
        mockDeploymentRepository,
        mockPodRepository,
        mockCreatePodUseCase,
        mockDeletePodUseCase
      );

      await expect(useCase.execute('default', 'r')).rejects.toThrow('Pod list failed');
    });
  });

  describe('DeleteDeploymentUseCase', () => {
    it('deploymentRepository.delete 예외 시 전파', async () => {
      mockDeploymentRepository.findById.mockResolvedValue(null);
      mockDeploymentRepository.delete.mockRejectedValue(new Error('Delete failed'));

      const useCase = new DeleteDeploymentUseCase(
        mockDeploymentRepository,
        mockPodRepository,
        mockDeletePodUseCase
      );

      await expect(useCase.execute('default', 'd')).rejects.toThrow('Delete failed');
    });
  });
});
