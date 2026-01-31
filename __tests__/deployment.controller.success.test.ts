/**
 * DeploymentController 성공 케이스 테스트
 * create, get, list, update, delete, reconcile 정상 흐름
 */
import { Request, Response } from 'express';
import { DeploymentController } from '../src/presentation/api/controllers/DeploymentController';
import { CreateDeploymentUseCase } from '../src/application/use-cases/deployment/CreateDeploymentUseCase';
import { GetDeploymentUseCase } from '../src/application/use-cases/deployment/GetDeploymentUseCase';
import { ListDeploymentsUseCase } from '../src/application/use-cases/deployment/ListDeploymentsUseCase';
import { DeleteDeploymentUseCase } from '../src/application/use-cases/deployment/DeleteDeploymentUseCase';
import { UpdateDeploymentUseCase } from '../src/application/use-cases/deployment/UpdateDeploymentUseCase';
import { ReconcileDeploymentUseCase } from '../src/application/use-cases/deployment/ReconcileDeploymentUseCase';
import { Deployment } from '../src/domain/entities/Deployment';

const makeDeployment = (name = 'web', replicas = 2) =>
  new Deployment(
    { name, namespace: 'default' },
    {
      replicas,
      selector: { matchLabels: { app: 'web' } },
      template: { spec: { containers: [{ name: 'c', image: 'nginx:latest' }] } }
    }
  );

describe('DeploymentController - 성공 케이스', () => {
  let controller: DeploymentController;
  let mockCreate: jest.Mocked<CreateDeploymentUseCase>;
  let mockGet: jest.Mocked<GetDeploymentUseCase>;
  let mockList: jest.Mocked<ListDeploymentsUseCase>;
  let mockDelete: jest.Mocked<DeleteDeploymentUseCase>;
  let mockUpdate: jest.Mocked<UpdateDeploymentUseCase>;
  let mockReconcile: jest.Mocked<ReconcileDeploymentUseCase>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockCreate = { execute: jest.fn() } as any;
    mockGet = { execute: jest.fn() } as any;
    mockList = { execute: jest.fn() } as any;
    mockDelete = { execute: jest.fn() } as any;
    mockUpdate = { execute: jest.fn() } as any;
    mockReconcile = { execute: jest.fn() } as any;

    controller = new DeploymentController(
      mockCreate,
      mockGet,
      mockList,
      mockDelete,
      mockUpdate,
      mockReconcile
    );

    mockRequest = { body: '', params: {}, query: {} };
    mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  describe('create', () => {
    it('유효한 YAML로 Deployment 생성 시 201과 생성된 Deployment 반환', async () => {
      const yaml = `
metadata:
  name: web
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    spec:
      containers:
      - name: nginx
        image: nginx:latest
`;
      const deployment = makeDeployment('web', 2);
      mockRequest.body = yaml;
      mockCreate.execute.mockResolvedValue(deployment);

      await controller.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(deployment);
      expect(mockCreate.execute).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('존재하는 Deployment 조회 시 200과 Deployment 반환', async () => {
      const deployment = makeDeployment();
      mockRequest.params = { namespace: 'default', name: 'web' };
      mockGet.execute.mockResolvedValue(deployment);

      await controller.get(mockRequest as Request, mockResponse as Response);

      expect(mockGet.execute).toHaveBeenCalledWith('default', 'web');
      expect(mockResponse.json).toHaveBeenCalledWith(deployment);
      expect(mockResponse.status).not.toHaveBeenCalledWith(404);
    });
  });

  describe('list', () => {
    it('Deployment 목록 조회 시 200과 배열 반환', async () => {
      const list = [makeDeployment('d1'), makeDeployment('d2')];
      mockRequest.query = { namespace: 'default' };
      mockList.execute.mockResolvedValue(list);

      await controller.list(mockRequest as Request, mockResponse as Response);

      expect(mockList.execute).toHaveBeenCalledWith('default');
      expect(mockResponse.json).toHaveBeenCalledWith(list);
    });

    it('namespace 없으면 default로 조회', async () => {
      mockRequest.query = {};
      mockList.execute.mockResolvedValue([]);

      await controller.list(mockRequest as Request, mockResponse as Response);

      expect(mockList.execute).toHaveBeenCalledWith('default');
    });
  });

  describe('update', () => {
    it('유효한 YAML로 Deployment 수정 시 200과 수정된 Deployment 반환', async () => {
      const yaml = `
metadata:
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    spec:
      containers:
      - name: nginx
        image: nginx:1.19
`;
      const updated = makeDeployment('web', 3);
      mockRequest.params = { namespace: 'default', name: 'web' };
      mockRequest.body = yaml;
      mockUpdate.execute.mockResolvedValue(updated);

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(updated);
      expect(mockUpdate.execute).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('Deployment 삭제 성공 시 200과 status deleted 반환', async () => {
      mockRequest.params = { namespace: 'default', name: 'web' };
      mockDelete.execute.mockResolvedValue(undefined);

      await controller.delete(mockRequest as Request, mockResponse as Response);

      expect(mockDelete.execute).toHaveBeenCalledWith('default', 'web');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ status: 'deleted' });
    });
  });

  describe('reconcile', () => {
    it('Reconcile 성공 시 200과 status reconciled 반환', async () => {
      mockRequest.params = { namespace: 'default', name: 'web' };
      mockReconcile.execute.mockResolvedValue(undefined);

      await controller.reconcile(mockRequest as Request, mockResponse as Response);

      expect(mockReconcile.execute).toHaveBeenCalledWith('default', 'web');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ status: 'reconciled' });
    });
  });
});
