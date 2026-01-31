/**
 * PodController 성공 케이스 테스트
 * create, get, list, delete, update, getStatus, restart, getLogs 정상 흐름
 */
import { Request, Response } from 'express';
import { PodController } from '../src/presentation/api/controllers/PodController';
import { CreatePodUseCase } from '../src/application/use-cases/pod/CreatePodUseCase';
import { GetPodUseCase } from '../src/application/use-cases/pod/GetPodUseCase';
import { ListPodsUseCase } from '../src/application/use-cases/pod/ListPodsUseCase';
import { DeletePodUseCase } from '../src/application/use-cases/pod/DeletePodUseCase';
import { UpdatePodUseCase } from '../src/application/use-cases/pod/UpdatePodUseCase';
import { GetPodStatusUseCase } from '../src/application/use-cases/pod/GetPodStatusUseCase';
import { RestartPodUseCase } from '../src/application/use-cases/pod/RestartPodUseCase';
import { GetPodLogsUseCase } from '../src/application/use-cases/pod/GetPodLogsUseCase';
import { Pod } from '../src/domain/entities/Pod';

describe('PodController - 성공 케이스', () => {
  let podController: PodController;
  let mockCreatePodUseCase: jest.Mocked<CreatePodUseCase>;
  let mockGetPodUseCase: jest.Mocked<GetPodUseCase>;
  let mockListPodsUseCase: jest.Mocked<ListPodsUseCase>;
  let mockDeletePodUseCase: jest.Mocked<DeletePodUseCase>;
  let mockUpdatePodUseCase: jest.Mocked<UpdatePodUseCase>;
  let mockGetPodStatusUseCase: jest.Mocked<GetPodStatusUseCase>;
  let mockRestartPodUseCase: jest.Mocked<RestartPodUseCase>;
  let mockGetPodLogsUseCase: jest.Mocked<GetPodLogsUseCase>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockCreatePodUseCase = { execute: jest.fn() } as any;
    mockGetPodUseCase = { execute: jest.fn() } as any;
    mockListPodsUseCase = { execute: jest.fn() } as any;
    mockDeletePodUseCase = { execute: jest.fn() } as any;
    mockUpdatePodUseCase = { execute: jest.fn() } as any;
    mockGetPodStatusUseCase = { execute: jest.fn() } as any;
    mockRestartPodUseCase = { execute: jest.fn() } as any;
    mockGetPodLogsUseCase = { execute: jest.fn() } as any;

    podController = new PodController(
      mockCreatePodUseCase,
      mockGetPodUseCase,
      mockListPodsUseCase,
      mockDeletePodUseCase,
      mockUpdatePodUseCase,
      mockGetPodStatusUseCase,
      mockRestartPodUseCase,
      mockGetPodLogsUseCase
    );

    mockRequest = { body: '', params: {}, query: {} };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('create', () => {
    it('유효한 YAML로 Pod 생성 시 201과 생성된 Pod 반환', async () => {
      const podYaml = `
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  namespace: default
spec:
  containers:
  - name: nginx
    image: nginx:latest
`;
      const createdPod = new Pod(
        { name: 'nginx-pod', namespace: 'default' },
        { containers: [{ name: 'nginx', image: 'nginx:latest' }] }
      );
      mockRequest.body = podYaml;
      mockCreatePodUseCase.execute.mockResolvedValue(createdPod);

      await podController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdPod);
      expect(mockCreatePodUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('존재하는 Pod 조회 시 200과 Pod 반환', async () => {
      const pod = new Pod(
        { name: 'my-pod', namespace: 'default' },
        { containers: [{ name: 'c', image: 'i' }] }
      );
      mockRequest.params = { namespace: 'default', name: 'my-pod' };
      mockGetPodUseCase.execute.mockResolvedValue(pod);

      await podController.get(mockRequest as Request, mockResponse as Response);

      expect(mockGetPodUseCase.execute).toHaveBeenCalledWith('default', 'my-pod');
      expect(mockResponse.json).toHaveBeenCalledWith(pod);
      expect(mockResponse.status).not.toHaveBeenCalledWith(404);
    });
  });

  describe('list', () => {
    it('네임스페이스로 목록 조회 시 200과 Pod 배열 반환', async () => {
      const pods = [
        new Pod({ name: 'p1', namespace: 'default' }, { containers: [{ name: 'c', image: 'i' }] })
      ];
      mockRequest.query = { namespace: 'default' };
      mockListPodsUseCase.execute.mockResolvedValue(pods);

      await podController.list(mockRequest as Request, mockResponse as Response);

      expect(mockListPodsUseCase.execute).toHaveBeenCalledWith('default', undefined);
      expect(mockResponse.json).toHaveBeenCalledWith(pods);
    });

    it('labelSelector 쿼리 전달 시 options에 포함해 호출', async () => {
      mockRequest.query = { namespace: 'default', labelSelector: 'app=web' };
      mockListPodsUseCase.execute.mockResolvedValue([]);

      await podController.list(mockRequest as Request, mockResponse as Response);

      expect(mockListPodsUseCase.execute).toHaveBeenCalledWith(
        'default',
        expect.objectContaining({ labelSelector: { app: 'web' } })
      );
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    it('node 쿼리 전달 시 nodeName 옵션으로 호출', async () => {
      mockRequest.query = { namespace: 'default', node: 'worker-1' };
      mockListPodsUseCase.execute.mockResolvedValue([]);

      await podController.list(mockRequest as Request, mockResponse as Response);

      expect(mockListPodsUseCase.execute).toHaveBeenCalledWith(
        'default',
        expect.objectContaining({ nodeName: 'worker-1' })
      );
    });
  });

  describe('delete', () => {
    it('Pod 삭제 성공 시 200과 status deleted 반환', async () => {
      mockRequest.params = { namespace: 'default', name: 'my-pod' };
      mockDeletePodUseCase.execute.mockResolvedValue(undefined);

      await podController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockDeletePodUseCase.execute).toHaveBeenCalledWith('default', 'my-pod');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ status: 'deleted' });
    });
  });

  describe('update', () => {
    it('유효한 YAML로 Pod 업데이트 시 200과 업데이트된 Pod 반환', async () => {
      const podYaml = `
metadata:
  name: nginx-pod
  namespace: default
spec:
  containers:
  - name: nginx
    image: nginx:1.19
`;
      const updatedPod = new Pod(
        { name: 'nginx-pod', namespace: 'default' },
        { containers: [{ name: 'nginx', image: 'nginx:1.19' }] }
      );
      mockRequest.params = { namespace: 'default', name: 'nginx-pod' };
      mockRequest.body = podYaml;
      mockUpdatePodUseCase.execute.mockResolvedValue(updatedPod);

      await podController.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedPod);
      expect(mockUpdatePodUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('Pod 상태 조회 성공 시 200과 상태 객체 반환', async () => {
      const status = { phase: 'Running', containerStatuses: [] };
      mockRequest.params = { namespace: 'default', name: 'my-pod' };
      mockGetPodStatusUseCase.execute.mockResolvedValue(status as any);

      await podController.getStatus(mockRequest as Request, mockResponse as Response);

      expect(mockGetPodStatusUseCase.execute).toHaveBeenCalledWith('default', 'my-pod');
      expect(mockResponse.json).toHaveBeenCalledWith(status);
    });
  });

  describe('restart', () => {
    it('Pod 재시작 성공 시 200과 Pod 반환', async () => {
      const pod = new Pod(
        { name: 'my-pod', namespace: 'default' },
        { containers: [{ name: 'c', image: 'i' }] }
      );
      mockRequest.params = { namespace: 'default', name: 'my-pod' };
      mockRestartPodUseCase.execute.mockResolvedValue(pod);

      await podController.restart(mockRequest as Request, mockResponse as Response);

      expect(mockRestartPodUseCase.execute).toHaveBeenCalledWith('default', 'my-pod');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(pod);
    });
  });

  describe('getLogs', () => {
    it('Pod 로그 조회 성공 시 200과 logs 반환', async () => {
      const logs = 'log line 1\nlog line 2';
      mockRequest.params = { namespace: 'default', name: 'my-pod' };
      mockGetPodLogsUseCase.execute.mockResolvedValue(logs);

      await podController.getLogs(mockRequest as Request, mockResponse as Response);

      expect(mockGetPodLogsUseCase.execute).toHaveBeenCalledWith('default', 'my-pod');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ logs });
    });
  });
});
