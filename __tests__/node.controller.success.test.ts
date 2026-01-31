/**
 * NodeController 성공 케이스 테스트
 * create, get, list, delete, update, listPodsOnNode 정상 흐름
 */
import { Request, Response } from 'express';
import { NodeController } from '../src/presentation/api/controllers/NodeController';
import { CreateNodeUseCase } from '../src/application/use-cases/node/CreateNodeUseCase';
import { GetNodeUseCase } from '../src/application/use-cases/node/GetNodeUseCase';
import { ListNodesUseCase } from '../src/application/use-cases/node/ListNodesUseCase';
import { DeleteNodeUseCase } from '../src/application/use-cases/node/DeleteNodeUseCase';
import { UpdateNodeUseCase } from '../src/application/use-cases/node/UpdateNodeUseCase';
import { ListPodsUseCase } from '../src/application/use-cases/pod/ListPodsUseCase';
import { Node } from '../src/domain/entities/Node';
import { Pod } from '../src/domain/entities/Pod';

describe('NodeController - 성공 케이스', () => {
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
    mockCreateNodeUseCase = { execute: jest.fn() } as any;
    mockGetNodeUseCase = { execute: jest.fn() } as any;
    mockListNodesUseCase = { execute: jest.fn() } as any;
    mockDeleteNodeUseCase = { execute: jest.fn() } as any;
    mockUpdateNodeUseCase = { execute: jest.fn() } as any;
    mockListPodsUseCase = { execute: jest.fn() } as any;

    nodeController = new NodeController(
      mockCreateNodeUseCase,
      mockGetNodeUseCase,
      mockListNodesUseCase,
      mockDeleteNodeUseCase,
      mockUpdateNodeUseCase,
      mockListPodsUseCase
    );

    mockRequest = { body: '', params: {}, query: {} };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('create', () => {
    it('유효한 YAML로 Node 생성 시 201과 생성된 Node 반환', async () => {
      const nodeYaml = `
metadata:
  name: worker-1
spec:
  capacity:
    cpu: "4"
    memory: 8Gi
`;
      const createdNode = new Node(
        { name: 'worker-1' },
        { capacity: { cpu: '4', memory: '8Gi' } }
      );
      mockRequest.body = nodeYaml;
      mockCreateNodeUseCase.execute.mockResolvedValue(createdNode);

      await nodeController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdNode);
      expect(mockCreateNodeUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('존재하는 Node 조회 시 200과 Node 반환', async () => {
      const node = new Node({ name: 'worker-1' }, { capacity: { cpu: '4', memory: '8Gi' } });
      mockRequest.params = { name: 'worker-1' };
      mockGetNodeUseCase.execute.mockResolvedValue(node);

      await nodeController.get(mockRequest as Request, mockResponse as Response);

      expect(mockGetNodeUseCase.execute).toHaveBeenCalledWith('worker-1');
      expect(mockResponse.json).toHaveBeenCalledWith(node);
      expect(mockResponse.status).not.toHaveBeenCalledWith(404);
    });
  });

  describe('list', () => {
    it('Node 목록 조회 시 200과 Node 배열 반환', async () => {
      const nodes = [
        new Node({ name: 'n1' }, {}),
        new Node({ name: 'n2' }, {})
      ];
      mockListNodesUseCase.execute.mockResolvedValue(nodes);

      await nodeController.list(mockRequest as Request, mockResponse as Response);

      expect(mockListNodesUseCase.execute).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(nodes);
    });
  });

  describe('delete', () => {
    it('Node 삭제 성공 시 200과 status deleted 반환', async () => {
      mockRequest.params = { name: 'worker-1' };
      mockDeleteNodeUseCase.execute.mockResolvedValue(undefined);

      await nodeController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockDeleteNodeUseCase.execute).toHaveBeenCalledWith('worker-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ status: 'deleted' });
    });
  });

  describe('update', () => {
    it('유효한 YAML로 Node 업데이트 시 200과 업데이트된 Node 반환', async () => {
      const nodeYaml = `
metadata:
  name: worker-1
spec:
  capacity:
    cpu: "8"
    memory: 16Gi
`;
      const updatedNode = new Node(
        { name: 'worker-1' },
        { capacity: { cpu: '8', memory: '16Gi' } }
      );
      mockRequest.params = { name: 'worker-1' };
      mockRequest.body = nodeYaml;
      mockUpdateNodeUseCase.execute.mockResolvedValue(updatedNode);

      await nodeController.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedNode);
      expect(mockUpdateNodeUseCase.execute).toHaveBeenCalledWith('worker-1', expect.any(Node));
    });
  });

  describe('listPodsOnNode', () => {
    it('노드별 Pod 목록 조회 시 200과 Pod 배열 반환', async () => {
      const pods = [
        new Pod({ name: 'p1', namespace: 'default' }, { containers: [{ name: 'c', image: 'i' }] })
      ];
      mockRequest.params = { name: 'worker-1' };
      mockRequest.query = {};
      mockListPodsUseCase.execute.mockResolvedValue(pods);

      await nodeController.listPodsOnNode(mockRequest as Request, mockResponse as Response);

      expect(mockListPodsUseCase.execute).toHaveBeenCalledWith(undefined, { nodeName: 'worker-1' });
      expect(mockResponse.json).toHaveBeenCalledWith(pods);
    });

    it('namespace 쿼리 있으면 해당 네임스페이스로 필터', async () => {
      mockRequest.params = { name: 'worker-1' };
      mockRequest.query = { namespace: 'kube-system' };
      mockListPodsUseCase.execute.mockResolvedValue([]);

      await nodeController.listPodsOnNode(mockRequest as Request, mockResponse as Response);

      expect(mockListPodsUseCase.execute).toHaveBeenCalledWith('kube-system', { nodeName: 'worker-1' });
    });
  });
});
