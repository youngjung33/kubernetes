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

/**
 * PodController 실패 케이스 테스트
 * HTTP 요청 처리 중 발생할 수 있는 모든 실패 케이스를 테스트
 */
describe('PodController - 실패 케이스', () => {
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
    mockCreatePodUseCase = {
      execute: jest.fn()
    } as any;

    mockGetPodUseCase = {
      execute: jest.fn()
    } as any;

    mockListPodsUseCase = {
      execute: jest.fn()
    } as any;

    mockDeletePodUseCase = {
      execute: jest.fn()
    } as any;

    mockUpdatePodUseCase = {
      execute: jest.fn()
    } as any;

    mockGetPodStatusUseCase = {
      execute: jest.fn()
    } as any;

    mockRestartPodUseCase = {
      execute: jest.fn()
    } as any;

    mockGetPodLogsUseCase = {
      execute: jest.fn()
    } as any;

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

    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  // ============================================
  // create - Pod 생성 실패 케이스
  // ============================================
  describe('create - 실패 케이스', () => {
    it('잘못된 YAML 형식으로 Pod 생성 시도 시 400 에러 반환', async () => {
      mockRequest.body = 'invalid: yaml: format: [';

      await podController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
    });

    it('빈 YAML로 Pod 생성 시도 시 400 에러 반환', async () => {
      mockRequest.body = '';

      await podController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
    });

    it('null body로 Pod 생성 시도 시 400 에러 반환', async () => {
      mockRequest.body = null;

      await podController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
    });

    it('undefined body로 Pod 생성 시도 시 YAML 파싱 실패로 400 에러 반환 가능', async () => {
      mockRequest.body = undefined;

      await podController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalled();
    });

    it('containers가 빈 배열인 YAML로 Pod 생성 시도 시 UseCase에서 실패 가능', async () => {
      mockRequest.body = `
apiVersion: v1
kind: Pod
metadata:
  name: nginx-test
spec:
  containers: []
`;

      mockCreatePodUseCase.execute.mockRejectedValue(new Error('Containers cannot be empty'));

      await podController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Containers cannot be empty' })
      );
    });

    it('UseCase에서 예외 발생 시 400 에러 반환', async () => {
      mockRequest.body = `
apiVersion: v1
kind: Pod
metadata:
  name: nginx-test
spec:
  containers:
  - name: nginx
    image: nginx:latest
`;

      mockCreatePodUseCase.execute.mockRejectedValue(new Error('No available nodes'));

      await podController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'No available nodes' })
      );
    });
  });

  // ============================================
  // get - Pod 조회 실패 케이스
  // ============================================
  describe('get - 실패 케이스', () => {
    it('존재하지 않는 Pod 조회 시 404 에러 반환', async () => {
      mockRequest.params = { namespace: 'default', name: 'non-existent-pod' };
      mockGetPodUseCase.execute.mockResolvedValue(null);

      await podController.get(mockRequest as Request, mockResponse as Response);

      expect(mockGetPodUseCase.execute).toHaveBeenCalledWith('default', 'non-existent-pod');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Pod not found' });
    });

    it('빈 네임스페이스로 Pod 조회 시도', async () => {
      mockRequest.params = { namespace: '', name: 'test-pod' };
      mockGetPodUseCase.execute.mockResolvedValue(null);

      await podController.get(mockRequest as Request, mockResponse as Response);

      expect(mockGetPodUseCase.execute).toHaveBeenCalledWith('', 'test-pod');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('빈 이름으로 Pod 조회 시도', async () => {
      mockRequest.params = { namespace: 'default', name: '' };
      mockGetPodUseCase.execute.mockResolvedValue(null);

      await podController.get(mockRequest as Request, mockResponse as Response);

      expect(mockGetPodUseCase.execute).toHaveBeenCalledWith('default', '');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('undefined 네임스페이스로 Pod 조회 시도', async () => {
      mockRequest.params = { namespace: undefined as any, name: 'test-pod' };
      mockGetPodUseCase.execute.mockResolvedValue(null);

      await podController.get(mockRequest as Request, mockResponse as Response);

      expect(mockGetPodUseCase.execute).toHaveBeenCalledWith(undefined, 'test-pod');
    });

    it('UseCase에서 예외 발생 시 500 에러 반환', async () => {
      mockRequest.params = { namespace: 'default', name: 'test-pod' };
      mockGetPodUseCase.execute.mockRejectedValue(new Error('Database error'));

      await podController.get(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Database error' })
      );
    });
  });

  // ============================================
  // list - Pod 목록 조회 실패 케이스
  // ============================================
  describe('list - 실패 케이스', () => {
    it('빈 문자열 네임스페이스로 조회 시도 시 기본값 default 사용', async () => {
      mockRequest.query = { namespace: '' };
      mockListPodsUseCase.execute.mockResolvedValue([]);

      await podController.list(mockRequest as Request, mockResponse as Response);

      expect(mockListPodsUseCase.execute).toHaveBeenCalledWith('default', undefined);
    });

    it('UseCase에서 예외 발생 시 500 에러 반환', async () => {
      mockRequest.query = { namespace: 'default' };
      mockListPodsUseCase.execute.mockRejectedValue(new Error('Failed to list pods'));

      await podController.list(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Failed to list pods' })
      );
    });
  });

  // ============================================
  // delete - Pod 삭제 실패 케이스
  // ============================================
  describe('delete - 실패 케이스', () => {
    it('존재하지 않는 Pod 삭제 시도 시 UseCase에서 예외 발생하면 500 에러 반환', async () => {
      mockRequest.params = { namespace: 'default', name: 'non-existent-pod' };
      mockDeletePodUseCase.execute.mockRejectedValue(new Error('Pod not found'));

      await podController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Pod not found' })
      );
    });

    it('빈 네임스페이스로 Pod 삭제 시도', async () => {
      mockRequest.params = { namespace: '', name: 'test-pod' };
      mockDeletePodUseCase.execute.mockResolvedValue(undefined);

      await podController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockDeletePodUseCase.execute).toHaveBeenCalledWith('', 'test-pod');
    });

    it('빈 이름으로 Pod 삭제 시도', async () => {
      mockRequest.params = { namespace: 'default', name: '' };
      mockDeletePodUseCase.execute.mockResolvedValue(undefined);

      await podController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockDeletePodUseCase.execute).toHaveBeenCalledWith('default', '');
    });

    it('UseCase에서 예외 발생 시 500 에러 반환', async () => {
      mockRequest.params = { namespace: 'default', name: 'test-pod' };
      mockDeletePodUseCase.execute.mockRejectedValue(new Error('Delete failed'));

      await podController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Delete failed' })
      );
    });
  });

  // ============================================
  // update - Pod 업데이트 실패 케이스
  // ============================================
  describe('update - 실패 케이스', () => {
    it('잘못된 YAML 형식으로 Pod 업데이트 시도 시 400 에러 반환', async () => {
      mockRequest.params = { namespace: 'default', name: 'nginx-test' };
      mockRequest.body = 'invalid: yaml: {';

      await podController.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('존재하지 않는 Pod 업데이트 시도 시 404 에러 반환', async () => {
      mockRequest.params = { namespace: 'default', name: 'non-existent-pod' };
      mockRequest.body = `
apiVersion: v1
kind: Pod
metadata:
  name: non-existent-pod
spec:
  containers:
  - name: nginx
    image: nginx:latest
`;

      mockUpdatePodUseCase.execute.mockRejectedValue(new Error('Pod not found'));

      await podController.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Pod not found' })
      );
    });

    it('UseCase에서 예외 발생 시 400 에러 반환', async () => {
      mockRequest.params = { namespace: 'default', name: 'nginx-test' };
      mockRequest.body = `
apiVersion: v1
kind: Pod
metadata:
  name: nginx-test
spec:
  containers:
  - name: nginx
    image: nginx:latest
`;

      mockUpdatePodUseCase.execute.mockRejectedValue(new Error('Storage error'));

      await podController.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Storage error' })
      );
    });

    it('null Pod로 업데이트 시도 시 400 에러 반환', async () => {
      mockRequest.params = { namespace: 'default', name: 'nginx-test' };
      mockRequest.body = null;

      await podController.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('빈 네임스페이스로 Pod 업데이트 시도', async () => {
      mockRequest.params = { namespace: '', name: 'nginx-test' };
      mockRequest.body = `
apiVersion: v1
kind: Pod
metadata:
  name: nginx-test
spec:
  containers:
  - name: nginx
    image: nginx:latest
`;

      mockUpdatePodUseCase.execute.mockRejectedValue(new Error('Pod not found'));

      await podController.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('빈 이름으로 Pod 업데이트 시도', async () => {
      mockRequest.params = { namespace: 'default', name: '' };
      mockRequest.body = `
apiVersion: v1
kind: Pod
metadata:
  name: nginx-test
spec:
  containers:
  - name: nginx
    image: nginx:latest
`;

      mockUpdatePodUseCase.execute.mockRejectedValue(new Error('Pod not found'));

      await podController.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });
});
