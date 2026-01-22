import { CreateNodeUseCase } from '../src/application/use-cases/node/CreateNodeUseCase';
import { GetNodeUseCase } from '../src/application/use-cases/node/GetNodeUseCase';
import { ListNodesUseCase } from '../src/application/use-cases/node/ListNodesUseCase';
import { DeleteNodeUseCase } from '../src/application/use-cases/node/DeleteNodeUseCase';
import { UpdateNodeUseCase } from '../src/application/use-cases/node/UpdateNodeUseCase';
import { Node } from '../src/domain/entities/Node';
import { INodeRepository } from '../src/domain/repositories/INodeRepository';

/**
 * Node UseCase 실패 케이스 테스트
 * Node 생성, 조회, 목록 조회, 삭제, 업데이트 과정에서 발생할 수 있는 모든 실패 케이스를 테스트
 */
describe('Node UseCases - 실패 케이스', () => {
  let mockNodeRepository: jest.Mocked<INodeRepository>;

  beforeEach(() => {
    mockNodeRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;
  });

  // ============================================
  // CreateNodeUseCase - 실패 케이스
  // ============================================
  describe('CreateNodeUseCase - 실패 케이스', () => {
    it('null Node로 생성 시도 시 예외 발생', async () => {
      const createNodeUseCase = new CreateNodeUseCase(mockNodeRepository);

      await expect(
        createNodeUseCase.execute(null as any)
      ).rejects.toThrow();
    });

    it('Repository에서 Node 생성 실패 시 예외 발생', async () => {
      const node = new Node(
        { name: 'worker-1' },
        { capacity: { cpu: '4', memory: '8Gi' } }
      );

      mockNodeRepository.create.mockRejectedValue(new Error('Storage write failed'));

      const createNodeUseCase = new CreateNodeUseCase(mockNodeRepository);

      await expect(
        createNodeUseCase.execute(node)
      ).rejects.toThrow('Storage write failed');
    });

    it('중복된 이름의 Node 생성 시도 시 예외 발생', async () => {
      const node = new Node(
        { name: 'worker-1' },
        { capacity: { cpu: '4', memory: '8Gi' } }
      );

      mockNodeRepository.findById.mockResolvedValue(node);
      mockNodeRepository.create.mockRejectedValue(new Error('Node already exists'));

      const createNodeUseCase = new CreateNodeUseCase(mockNodeRepository);

      await expect(
        createNodeUseCase.execute(node)
      ).rejects.toThrow('Node already exists');
    });
  });

  // ============================================
  // GetNodeUseCase - 실패 케이스
  // ============================================
  describe('GetNodeUseCase - 실패 케이스', () => {
    it('존재하지 않는 Node 조회 시 null 반환', async () => {
      mockNodeRepository.findById.mockResolvedValue(null);

      const getNodeUseCase = new GetNodeUseCase(mockNodeRepository);

      const result = await getNodeUseCase.execute('non-existent-node');

      expect(result).toBeNull();
    });

    it('빈 이름으로 Node 조회 시도', async () => {
      mockNodeRepository.findById.mockResolvedValue(null);

      const getNodeUseCase = new GetNodeUseCase(mockNodeRepository);

      const result = await getNodeUseCase.execute('');

      expect(result).toBeNull();
      expect(mockNodeRepository.findById).toHaveBeenCalledWith('');
    });

    it('Repository에서 Node 조회 실패 시 예외 발생', async () => {
      mockNodeRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      const getNodeUseCase = new GetNodeUseCase(mockNodeRepository);

      await expect(
        getNodeUseCase.execute('worker-1')
      ).rejects.toThrow('Database connection failed');
    });
  });

  // ============================================
  // ListNodesUseCase - 실패 케이스
  // ============================================
  describe('ListNodesUseCase - 실패 케이스', () => {
    it('Repository에서 Node 목록 조회 실패 시 예외 발생', async () => {
      mockNodeRepository.findAll.mockRejectedValue(new Error('Failed to list nodes'));

      const listNodesUseCase = new ListNodesUseCase(mockNodeRepository);

      await expect(
        listNodesUseCase.execute()
      ).rejects.toThrow('Failed to list nodes');
    });

    it('Node가 없을 때 빈 배열 반환', async () => {
      mockNodeRepository.findAll.mockResolvedValue([]);

      const listNodesUseCase = new ListNodesUseCase(mockNodeRepository);

      const result = await listNodesUseCase.execute();

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // DeleteNodeUseCase - 실패 케이스
  // ============================================
  describe('DeleteNodeUseCase - 실패 케이스', () => {
    it('존재하지 않는 Node 삭제 시도 시 예외 발생', async () => {
      mockNodeRepository.findById.mockResolvedValue(null);
      mockNodeRepository.delete.mockRejectedValue(new Error('Node not found'));

      const deleteNodeUseCase = new DeleteNodeUseCase(mockNodeRepository);

      await expect(
        deleteNodeUseCase.execute('non-existent-node')
      ).rejects.toThrow('Node not found');
    });

    it('빈 이름으로 Node 삭제 시도', async () => {
      mockNodeRepository.findById.mockResolvedValue(null);
      mockNodeRepository.delete.mockRejectedValue(new Error('Node not found'));

      const deleteNodeUseCase = new DeleteNodeUseCase(mockNodeRepository);

      await expect(
        deleteNodeUseCase.execute('')
      ).rejects.toThrow('Node not found');
    });

    it('Repository에서 Node 삭제 실패 시 예외 발생', async () => {
      const node = new Node(
        { name: 'worker-1' },
        { capacity: { cpu: '4', memory: '8Gi' } }
      );

      mockNodeRepository.findById.mockResolvedValue(node);
      mockNodeRepository.delete.mockRejectedValue(new Error('Delete operation failed'));

      const deleteNodeUseCase = new DeleteNodeUseCase(mockNodeRepository);

      await expect(
        deleteNodeUseCase.execute('worker-1')
      ).rejects.toThrow('Delete operation failed');
    });
  });

  // ============================================
  // UpdateNodeUseCase - 실패 케이스
  // ============================================
  describe('UpdateNodeUseCase - 실패 케이스', () => {
    it('존재하지 않는 Node 업데이트 시도 시 예외 발생', async () => {
      const node = new Node(
        { name: 'worker-1' },
        { capacity: { cpu: '4', memory: '8Gi' } }
      );

      mockNodeRepository.findById.mockResolvedValue(null);

      const updateNodeUseCase = new UpdateNodeUseCase(mockNodeRepository);

      await expect(
        updateNodeUseCase.execute('worker-1', node)
      ).rejects.toThrow('Node not found');
    });

    it('null Node로 업데이트 시도 시 예외 발생', async () => {
      const existingNode = new Node(
        { name: 'worker-1' },
        { capacity: { cpu: '4', memory: '8Gi' } }
      );

      mockNodeRepository.findById.mockResolvedValue(existingNode);

      const updateNodeUseCase = new UpdateNodeUseCase(mockNodeRepository);

      await expect(
        updateNodeUseCase.execute('worker-1', null as any)
      ).rejects.toThrow();
    });

    it('Repository에서 Node 업데이트 실패 시 예외 발생', async () => {
      const existingNode = new Node(
        { name: 'worker-1' },
        { capacity: { cpu: '4', memory: '8Gi' } }
      );

      const updatedNode = new Node(
        { name: 'worker-1' },
        { capacity: { cpu: '8', memory: '16Gi' } }
      );

      mockNodeRepository.findById.mockResolvedValue(existingNode);
      mockNodeRepository.update.mockRejectedValue(new Error('Storage write failed'));

      const updateNodeUseCase = new UpdateNodeUseCase(mockNodeRepository);

      await expect(
        updateNodeUseCase.execute('worker-1', updatedNode)
      ).rejects.toThrow('Storage write failed');
    });

    it('빈 이름으로 Node 업데이트 시도', async () => {
      const node = new Node(
        { name: 'worker-1' },
        { capacity: { cpu: '4', memory: '8Gi' } }
      );

      mockNodeRepository.findById.mockResolvedValue(null);

      const updateNodeUseCase = new UpdateNodeUseCase(mockNodeRepository);

      await expect(
        updateNodeUseCase.execute('', node)
      ).rejects.toThrow('Node not found');
    });
  });
});
