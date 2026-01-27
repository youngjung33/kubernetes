import { Request, Response } from 'express';
import { NodeController } from '../src/presentation/api/controllers/NodeController';
import { CreateNodeUseCase } from '../src/application/use-cases/node/CreateNodeUseCase';
import { GetNodeUseCase } from '../src/application/use-cases/node/GetNodeUseCase';
import { ListNodesUseCase } from '../src/application/use-cases/node/ListNodesUseCase';
import { DeleteNodeUseCase } from '../src/application/use-cases/node/DeleteNodeUseCase';
import { UpdateNodeUseCase } from '../src/application/use-cases/node/UpdateNodeUseCase';
import { ListPodsUseCase } from '../src/application/use-cases/pod/ListPodsUseCase';

/**
 * NodeController 실패 케이스 테스트
 * HTTP 요청 처리 중 발생할 수 있는 모든 실패 케이스를 테스트
 */
describe('NodeController - 실패 케이스', () => {
  let nodeController: NodeController;
  let mockCreateNodeUseCase: jest.Mocked<CreateNodeUseCase>;
  let mockGetNodeUseCase: jest.Mocked<GetNodeUseCase>;
  let mockListNodesUseCase: jest.Mocked<ListNodesUseCase>;
  let mockDeleteNodeUseCase: jest.Mocked<DeleteNodeUseCase>;
  let mockUpdateNodeUseCase: jest.Mocked<UpdateNodeUseCase>;
  let mockListPodsUseCase: jest.Mocked<ListPodsUseCase>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockCreateNodeUseCase = {
      execute: jest.fn()
    } as any;

    mockGetNodeUseCase = {
      execute: jest.fn()
    } as any;

    mockListNodesUseCase = {
      execute: jest.fn()
    } as any;

    mockDeleteNodeUseCase = {
      execute: jest.fn()
    } as any;

    mockUpdateNodeUseCase = {
      execute: jest.fn()
    } as any;

    mockListPodsUseCase = {
      execute: jest.fn()
    } as any;

    nodeController = new NodeController(
      mockCreateNodeUseCase,
      mockGetNodeUseCase,
      mockListNodesUseCase,
      mockDeleteNodeUseCase,
      mockUpdateNodeUseCase,
      mockListPodsUseCase
    );

    mockRequest = {
      body: {},
      params: {},
      query: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  // ============================================
  // Create Node 실패 케이스
  // ============================================
  describe('create', () => {
    it('유효하지 않은 YAML 형식으로 Node 생성 시도 시 400 에러 반환', async () => {
      mockRequest.body = 'invalid: yaml: content';

      await nodeController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
      expect(mockCreateNodeUseCase.execute).not.toHaveBeenCalled();
    });

    it('metadata가 없는 Node 생성 시도 시 400 에러 반환', async () => {
      mockRequest.body = 'spec:\n  capacity:\n    cpu: "2"';

      await nodeController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
    });

    it('UseCase에서 예외 발생 시 400 에러 반환', async () => {
      mockRequest.body = 'metadata:\n  name: worker-1';
      mockCreateNodeUseCase.execute.mockRejectedValue(new Error('Node creation failed'));

      await nodeController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Node creation failed' });
    });

    it('빈 body로 Node 생성 시도 시 400 에러 반환', async () => {
      mockRequest.body = '';

      await nodeController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  // ============================================
  // Get Node 실패 케이스
  // ============================================
  describe('get', () => {
    it('존재하지 않는 Node 조회 시 404 에러 반환', async () => {
      mockRequest.params = { name: 'non-existent-node' };
      mockGetNodeUseCase.execute.mockResolvedValue(null);

      await nodeController.get(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Node not found' });
      expect(mockGetNodeUseCase.execute).toHaveBeenCalledWith('non-existent-node');
    });

    it('UseCase에서 예외 발생 시 500 에러 반환', async () => {
      mockRequest.params = { name: 'worker-1' };
      mockGetNodeUseCase.execute.mockRejectedValue(new Error('DB connection failed'));

      await nodeController.get(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'DB connection failed' });
    });

    it('빈 이름으로 Node 조회 시도', async () => {
      mockRequest.params = { name: '' };
      mockGetNodeUseCase.execute.mockResolvedValue(null);

      await nodeController.get(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockGetNodeUseCase.execute).toHaveBeenCalledWith('');
    });
  });

  // ============================================
  // List Nodes 실패 케이스
  // ============================================
  describe('list', () => {
    it('UseCase에서 예외 발생 시 500 에러 반환', async () => {
      mockListNodesUseCase.execute.mockRejectedValue(new Error('Failed to list nodes'));

      await nodeController.list(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to list nodes' });
    });
  });

  // ============================================
  // Delete Node 실패 케이스
  // ============================================
  describe('delete', () => {
    it('UseCase에서 예외 발생 시 500 에러 반환', async () => {
      mockRequest.params = { name: 'worker-1' };
      mockDeleteNodeUseCase.execute.mockRejectedValue(new Error('Delete failed'));

      await nodeController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Delete failed' });
    });

    it('빈 이름으로 Node 삭제 시도', async () => {
      mockRequest.params = { name: '' };
      mockDeleteNodeUseCase.execute.mockResolvedValue(undefined);

      await nodeController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockDeleteNodeUseCase.execute).toHaveBeenCalledWith('');
    });
  });

  // ============================================
  // Update Node 실패 케이스
  // ============================================
  describe('update', () => {
    it('유효하지 않은 YAML 형식으로 Node 업데이트 시도 시 400 에러 반환', async () => {
      mockRequest.params = { name: 'worker-1' };
      mockRequest.body = 'invalid: yaml: content';

      await nodeController.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockUpdateNodeUseCase.execute).not.toHaveBeenCalled();
    });

    it('존재하지 않는 Node 업데이트 시도 시 404 에러 반환', async () => {
      mockRequest.params = { name: 'non-existent-node' };
      mockRequest.body = 'metadata:\n  name: worker-1';
      mockUpdateNodeUseCase.execute.mockRejectedValue(new Error('Node non-existent-node not found'));

      await nodeController.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('not found') })
      );
    });

    it('UseCase에서 예외 발생 시 400 에러 반환', async () => {
      mockRequest.params = { name: 'worker-1' };
      mockRequest.body = 'metadata:\n  name: worker-1';
      mockUpdateNodeUseCase.execute.mockRejectedValue(new Error('Update failed'));

      await nodeController.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Update failed' });
    });

    it('빈 이름으로 Node 업데이트 시도', async () => {
      mockRequest.params = { name: '' };
      mockRequest.body = 'metadata:\n  name: worker-1';
      mockUpdateNodeUseCase.execute.mockRejectedValue(new Error('Node  not found'));

      await nodeController.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });
});
