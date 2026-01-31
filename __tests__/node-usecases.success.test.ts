/**
 * Node UseCases 성공 케이스 테스트
 */
import { Node } from '../src/domain/entities/Node';
import { CreateNodeUseCase } from '../src/application/use-cases/node/CreateNodeUseCase';
import { GetNodeUseCase } from '../src/application/use-cases/node/GetNodeUseCase';
import { ListNodesUseCase } from '../src/application/use-cases/node/ListNodesUseCase';
import { DeleteNodeUseCase } from '../src/application/use-cases/node/DeleteNodeUseCase';
import { UpdateNodeUseCase } from '../src/application/use-cases/node/UpdateNodeUseCase';
import { INodeRepository } from '../src/domain/repositories/INodeRepository';

describe('Node UseCases - 성공 케이스', () => {
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

  describe('CreateNodeUseCase', () => {
    it('Node 생성 시 repository.create 호출 후 반환', async () => {
      const node = new Node({ name: 'worker-1' }, { capacity: { cpu: '4', memory: '8Gi' } });
      mockNodeRepository.findById.mockResolvedValue(null);
      mockNodeRepository.create.mockImplementation(async (n) => n);

      const useCase = new CreateNodeUseCase(mockNodeRepository);
      const result = await useCase.execute(node);

      expect(result).toBe(node);
      expect(mockNodeRepository.create).toHaveBeenCalledWith(node);
    });
  });

  describe('GetNodeUseCase', () => {
    it('존재하는 Node 조회 시 Node 반환', async () => {
      const node = new Node({ name: 'worker-1' }, {});
      mockNodeRepository.findById.mockResolvedValue(node);

      const useCase = new GetNodeUseCase(mockNodeRepository);
      const result = await useCase.execute('worker-1');

      expect(result).toBe(node);
      expect(mockNodeRepository.findById).toHaveBeenCalledWith('worker-1');
    });
  });

  describe('ListNodesUseCase', () => {
    it('목록 조회 시 Node 배열 반환', async () => {
      const nodes = [new Node({ name: 'n1' }, {}), new Node({ name: 'n2' }, {})];
      mockNodeRepository.findAll.mockResolvedValue(nodes);

      const useCase = new ListNodesUseCase(mockNodeRepository);
      const result = await useCase.execute();

      expect(result).toEqual(nodes);
      expect(mockNodeRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('UpdateNodeUseCase', () => {
    it('존재하는 Node 업데이트 시 repository.update 호출 후 반환', async () => {
      const existing = new Node({ name: 'n1' }, {});
      const updated = new Node({ name: 'n1' }, { capacity: { cpu: '8', memory: '16Gi' } });
      mockNodeRepository.findById.mockResolvedValue(existing);
      mockNodeRepository.update.mockImplementation(async (n) => n);

      const useCase = new UpdateNodeUseCase(mockNodeRepository);
      const result = await useCase.execute('n1', updated);

      expect(result).toBe(updated);
      expect(mockNodeRepository.update).toHaveBeenCalledWith(updated);
    });
  });

  describe('DeleteNodeUseCase', () => {
    it('Node 삭제 시 repository.delete 호출', async () => {
      const node = new Node({ name: 'n1' }, {});
      mockNodeRepository.findById.mockResolvedValue(node);
      mockNodeRepository.delete.mockResolvedValue(undefined);

      const useCase = new DeleteNodeUseCase(mockNodeRepository);
      await useCase.execute('n1');

      expect(mockNodeRepository.findById).toHaveBeenCalledWith('n1');
      expect(mockNodeRepository.delete).toHaveBeenCalledWith('n1');
    });
  });
});
