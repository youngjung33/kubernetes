/**
 * Deployment UseCases 성공 케이스 테스트
 */
import { Deployment } from '../src/domain/entities/Deployment';
import { CreateDeploymentUseCase } from '../src/application/use-cases/deployment/CreateDeploymentUseCase';
import { GetDeploymentUseCase } from '../src/application/use-cases/deployment/GetDeploymentUseCase';
import { ListDeploymentsUseCase } from '../src/application/use-cases/deployment/ListDeploymentsUseCase';
import { UpdateDeploymentUseCase } from '../src/application/use-cases/deployment/UpdateDeploymentUseCase';
import { DeleteDeploymentUseCase } from '../src/application/use-cases/deployment/DeleteDeploymentUseCase';
import { ReconcileDeploymentUseCase } from '../src/application/use-cases/deployment/ReconcileDeploymentUseCase';
import { IDeploymentRepository } from '../src/domain/repositories/IDeploymentRepository';
import { IPodRepository } from '../src/domain/repositories/IPodRepository';
import { CreatePodUseCase } from '../src/application/use-cases/pod/CreatePodUseCase';
import { DeletePodUseCase } from '../src/application/use-cases/pod/DeletePodUseCase';

const makeDeployment = (name = 'd1') =>
  new Deployment(
    { name, namespace: 'default' },
    {
      replicas: 2,
      selector: { matchLabels: { app: 'web' } },
      template: { spec: { containers: [{ name: 'c', image: 'nginx:latest' }] } }
    }
  );

describe('Deployment UseCases - 성공 케이스', () => {
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
    it('Deployment 생성 시 repository.create 호출 후 반환', async () => {
      const deployment = makeDeployment();
      mockDeploymentRepository.findById.mockResolvedValue(null);
      mockDeploymentRepository.create.mockImplementation(async (d) => d);

      const useCase = new CreateDeploymentUseCase(mockDeploymentRepository);
      const result = await useCase.execute(deployment);

      expect(result).toBe(deployment);
      expect(mockDeploymentRepository.create).toHaveBeenCalledWith(deployment);
    });
  });

  describe('GetDeploymentUseCase', () => {
    it('존재하는 Deployment 조회 시 반환', async () => {
      const deployment = makeDeployment();
      mockDeploymentRepository.findById.mockResolvedValue(deployment);

      const useCase = new GetDeploymentUseCase(mockDeploymentRepository);
      const result = await useCase.execute('default', 'd1');

      expect(result).toBe(deployment);
      expect(mockDeploymentRepository.findById).toHaveBeenCalledWith('default', 'd1');
    });
  });

  describe('ListDeploymentsUseCase', () => {
    it('목록 조회 시 Deployment 배열 반환', async () => {
      const list = [makeDeployment('d1'), makeDeployment('d2')];
      mockDeploymentRepository.findAll.mockResolvedValue(list);

      const useCase = new ListDeploymentsUseCase(mockDeploymentRepository);
      const result = await useCase.execute('default');

      expect(result).toEqual(list);
      expect(mockDeploymentRepository.findAll).toHaveBeenCalledWith('default');
    });
  });

  describe('UpdateDeploymentUseCase', () => {
    it('존재하는 Deployment 수정 시 repository.update 호출 후 반환', async () => {
      const existing = makeDeployment();
      const updated = makeDeployment();
      (updated as any).spec.replicas = 3;
      mockDeploymentRepository.findById.mockResolvedValue(existing);
      mockDeploymentRepository.update.mockImplementation(async (d) => d);

      const useCase = new UpdateDeploymentUseCase(mockDeploymentRepository);
      const result = await useCase.execute('default', 'd1', updated);

      expect(result).toBe(updated);
      expect(mockDeploymentRepository.update).toHaveBeenCalled();
    });
  });

  describe('ReconcileDeploymentUseCase', () => {
    it('current === desired 이면 create/delete 호출 없음', async () => {
      const deployment = makeDeployment();
      deployment.spec.replicas = 2;
      mockDeploymentRepository.findById.mockResolvedValue(deployment);
      mockPodRepository.findAll.mockResolvedValue([
        { metadata: { name: 'd1-1' } } as any,
        { metadata: { name: 'd1-2' } } as any
      ]);

      const useCase = new ReconcileDeploymentUseCase(
        mockDeploymentRepository,
        mockPodRepository,
        mockCreatePodUseCase,
        mockDeletePodUseCase
      );
      await useCase.execute('default', 'd1');

      expect(mockCreatePodUseCase.execute).not.toHaveBeenCalled();
      expect(mockDeletePodUseCase.execute).not.toHaveBeenCalled();
    });

    it('current < desired 이면 부족한 수만큼 Pod 생성', async () => {
      const deployment = makeDeployment();
      deployment.spec.replicas = 3;
      mockDeploymentRepository.findById.mockResolvedValue(deployment);
      mockPodRepository.findAll.mockResolvedValue([{ metadata: { name: 'd1-1' } } as any]);

      const useCase = new ReconcileDeploymentUseCase(
        mockDeploymentRepository,
        mockPodRepository,
        mockCreatePodUseCase,
        mockDeletePodUseCase
      );
      await useCase.execute('default', 'd1');

      expect(mockCreatePodUseCase.execute).toHaveBeenCalledTimes(2);
    });

    it('current > desired 이면 초과 Pod 삭제', async () => {
      const deployment = makeDeployment();
      deployment.spec.replicas = 1;
      mockDeploymentRepository.findById.mockResolvedValue(deployment);
      mockPodRepository.findAll.mockResolvedValue([
        { metadata: { name: 'd1-a' } } as any,
        { metadata: { name: 'd1-b' } } as any
      ]);

      const useCase = new ReconcileDeploymentUseCase(
        mockDeploymentRepository,
        mockPodRepository,
        mockCreatePodUseCase,
        mockDeletePodUseCase
      );
      await useCase.execute('default', 'd1');

      expect(mockDeletePodUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockDeletePodUseCase.execute).toHaveBeenCalledWith('default', 'd1-a');
    });
  });

  describe('DeleteDeploymentUseCase', () => {
    it('Deployment 없어도 repository.delete 호출', async () => {
      mockDeploymentRepository.findById.mockResolvedValue(null);
      mockDeploymentRepository.delete.mockResolvedValue(undefined);

      const useCase = new DeleteDeploymentUseCase(
        mockDeploymentRepository,
        mockPodRepository,
        mockDeletePodUseCase
      );
      await useCase.execute('default', 'd1');

      expect(mockDeploymentRepository.delete).toHaveBeenCalledWith('default', 'd1');
    });
  });
});
