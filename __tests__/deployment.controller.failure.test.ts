import { Request, Response } from 'express';
import { DeploymentController } from '../src/presentation/api/controllers/DeploymentController';
import { CreateDeploymentUseCase } from '../src/application/use-cases/deployment/CreateDeploymentUseCase';
import { GetDeploymentUseCase } from '../src/application/use-cases/deployment/GetDeploymentUseCase';
import { ListDeploymentsUseCase } from '../src/application/use-cases/deployment/ListDeploymentsUseCase';
import { DeleteDeploymentUseCase } from '../src/application/use-cases/deployment/DeleteDeploymentUseCase';
import { ReconcileDeploymentUseCase } from '../src/application/use-cases/deployment/ReconcileDeploymentUseCase';

/**
 * DeploymentController 실패 케이스 테스트
 */
describe('DeploymentController - 실패 케이스', () => {
  let controller: DeploymentController;
  let mockCreate: jest.Mocked<CreateDeploymentUseCase>;
  let mockGet: jest.Mocked<GetDeploymentUseCase>;
  let mockList: jest.Mocked<ListDeploymentsUseCase>;
  let mockDelete: jest.Mocked<DeleteDeploymentUseCase>;
  let mockReconcile: jest.Mocked<ReconcileDeploymentUseCase>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockCreate = { execute: jest.fn() } as any;
    mockGet = { execute: jest.fn() } as any;
    mockList = { execute: jest.fn() } as any;
    mockDelete = { execute: jest.fn() } as any;
    mockReconcile = { execute: jest.fn() } as any;

    controller = new DeploymentController(
      mockCreate,
      mockGet,
      mockList,
      mockDelete,
      mockReconcile
    );

    mockRequest = { body: '', params: {}, query: {} };
    mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  describe('create', () => {
    it('유효하지 않은 YAML이면 400 반환', async () => {
      mockRequest.body = 'invalid: yaml: content';

      await controller.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
      expect(mockCreate.execute).not.toHaveBeenCalled();
    });

    it('metadata.name 없으면 400 반환', async () => {
      mockRequest.body = 'spec:\n  replicas: 1\n  selector:\n    matchLabels: {}\n  template:\n    spec:\n      containers: []';

      await controller.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockCreate.execute).not.toHaveBeenCalled();
    });

    it('UseCase에서 예외 발생 시 400 반환', async () => {
      mockRequest.body = 'metadata:\n  name: dup\nspec:\n  replicas: 1\n  selector:\n    matchLabels: {}\n  template:\n    spec:\n      containers: [{ name: c, image: i }]';
      mockCreate.execute.mockRejectedValue(new Error('Deployment dup already exists'));

      await controller.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('already exists') }));
    });
  });

  describe('get', () => {
    it('존재하지 않는 Deployment면 404 반환', async () => {
      mockRequest.params = { namespace: 'default', name: 'missing' };
      mockGet.execute.mockResolvedValue(null);

      await controller.get(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Deployment not found' });
    });

    it('UseCase 예외 시 500 반환', async () => {
      mockRequest.params = { namespace: 'default', name: 'x' };
      mockGet.execute.mockRejectedValue(new Error('DB error'));

      await controller.get(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('list', () => {
    it('UseCase 예외 시 500 반환', async () => {
      mockList.execute.mockRejectedValue(new Error('List failed'));

      await controller.list(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('delete', () => {
    it('UseCase 예외 시 500 반환', async () => {
      mockRequest.params = { namespace: 'default', name: 'd' };
      mockDelete.execute.mockRejectedValue(new Error('Delete failed'));

      await controller.delete(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('reconcile', () => {
    it('Deployment 없으면 404 반환', async () => {
      mockRequest.params = { namespace: 'default', name: 'missing' };
      mockReconcile.execute.mockRejectedValue(new Error('Deployment missing not found in namespace default'));

      await controller.reconcile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('UseCase 예외(not found) 시 404 반환', async () => {
      mockRequest.params = { namespace: 'ns', name: 'n' };
      mockReconcile.execute.mockRejectedValue(new Error('Deployment n not found in namespace ns'));

      await controller.reconcile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('그 외 예외 시 500 반환', async () => {
      mockRequest.params = { namespace: 'default', name: 'x' };
      mockReconcile.execute.mockRejectedValue(new Error('Pod list failed'));

      await controller.reconcile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });
});
