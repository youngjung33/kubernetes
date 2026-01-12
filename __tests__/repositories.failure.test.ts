import { PodRepository } from '../src/infrastructure/persistence/PodRepository';
import { NodeRepository } from '../src/infrastructure/persistence/NodeRepository';
import { Pod } from '../src/domain/entities/Pod';
import { Node } from '../src/domain/entities/Node';
import { IStore } from '../src/domain/services/IStore';

/**
 * Repositories 실패 케이스 테스트
 * PodRepository와 NodeRepository의 실패 케이스를 테스트
 */
describe('Repositories - 실패 케이스', () => {
  // ============================================
  // PodRepository 실패 케이스
  // ============================================
  describe('PodRepository', () => {
    let podRepository: PodRepository;
    let mockStore: jest.Mocked<IStore>;

    beforeEach(() => {
      mockStore = {
        put: jest.fn(),
        get: jest.fn(),
        list: jest.fn(),
        delete: jest.fn()
      } as any;

      podRepository = new PodRepository(mockStore);
    });

    it('존재하지 않는 Pod 조회 시 null 반환', async () => {
      mockStore.get.mockReturnValue(undefined);

      const result = await podRepository.findById('default', 'non-existent-pod');

      expect(result).toBeNull();
      expect(mockStore.get).toHaveBeenCalledWith('pods/default/non-existent-pod');
    });

    it('잘못된 데이터 형식으로 저장된 Pod 조회 시 예외 발생 가능', async () => {
      mockStore.get.mockReturnValue({ invalid: 'data' });

      const result = await podRepository.findById('default', 'invalid-pod');

      expect(result).toBeDefined();
    });

    it('metadata가 없는 데이터로 Pod 조회 시 예외 발생 가능', async () => {
      mockStore.get.mockReturnValue({
        spec: {
          containers: [{ name: 'nginx', image: 'nginx:latest' }]
        }
      });

      const result = await podRepository.findById('default', 'no-metadata-pod');
      
      expect(result).toBeDefined();
    });

    it('spec이 없는 데이터로 Pod 조회 시 예외 발생 가능', async () => {
      mockStore.get.mockReturnValue({
        metadata: { name: 'test-pod' }
      });

      const result = await podRepository.findById('default', 'no-spec-pod');
      
      expect(result).toBeDefined();
    });

    it('빈 네임스페이스로 Pod 조회 시도', async () => {
      mockStore.get.mockReturnValue(undefined);

      const result = await podRepository.findById('', 'test-pod');

      expect(result).toBeNull();
      expect(mockStore.get).toHaveBeenCalledWith('pods//test-pod');
    });

    it('빈 이름으로 Pod 조회 시도', async () => {
      mockStore.get.mockReturnValue(undefined);

      const result = await podRepository.findById('default', '');

      expect(result).toBeNull();
      expect(mockStore.get).toHaveBeenCalledWith('pods/default/');
    });

    it('null 네임스페이스로 Pod 조회 시도', async () => {
      mockStore.get.mockReturnValue(undefined);

      const result = await podRepository.findById(null as any, 'test-pod');

      expect(result).toBeNull();
      expect(mockStore.get).toHaveBeenCalledWith('pods/null/test-pod');
    });

    it('null 이름으로 Pod 조회 시도', async () => {
      mockStore.get.mockReturnValue(undefined);

      const result = await podRepository.findById('default', null as any);

      expect(result).toBeNull();
      expect(mockStore.get).toHaveBeenCalledWith('pods/default/null');
    });

    it('list에서 잘못된 데이터 형식 반환 시 예외 발생 가능', async () => {
      mockStore.list.mockReturnValue({
        'pods/default/pod1': { invalid: 'data' },
        'pods/default/pod2': { metadata: { name: 'pod2' }, noSpec: true }
      });

      const result = await podRepository.findAll('default');
      
      expect(result).toBeDefined();
    });

    it('매우 긴 네임스페이스로 Pod 조회 시도', async () => {
      const longNamespace = 'a'.repeat(500);
      mockStore.get.mockReturnValue(undefined);

      const result = await podRepository.findById(longNamespace, 'test-pod');

      expect(result).toBeNull();
      expect(mockStore.get).toHaveBeenCalledWith(`pods/${longNamespace}/test-pod`);
    });

    it('특수문자가 포함된 키로 저장된 Pod 조회', async () => {
      mockStore.get.mockReturnValue({
        metadata: { name: 'test!@#pod' },
        spec: {
          containers: [{ name: 'nginx', image: 'nginx:latest' }]
        }
      });

      const result = await podRepository.findById('default', 'test!@#pod');
      expect(result).toBeDefined();
    });
  });

  // ============================================
  // NodeRepository 실패 케이스
  // ============================================
  describe('NodeRepository', () => {
    let nodeRepository: NodeRepository;
    let mockStore: jest.Mocked<IStore>;

    beforeEach(() => {
      mockStore = {
        put: jest.fn(),
        get: jest.fn(),
        list: jest.fn(),
        delete: jest.fn()
      } as any;

      nodeRepository = new NodeRepository(mockStore);
    });

    it('존재하지 않는 Node 조회 시 null 반환', async () => {
      mockStore.get.mockReturnValue(undefined);

      const result = await nodeRepository.findById('non-existent-node');

      expect(result).toBeNull();
      expect(mockStore.get).toHaveBeenCalledWith('nodes/non-existent-node');
    });

    it('잘못된 데이터 형식으로 저장된 Node 조회 시 예외 발생 가능', async () => {
      mockStore.get.mockReturnValue({
        invalid: 'data',
        noMetadata: true
      });

      const result = await nodeRepository.findById('invalid-node');
      
      expect(result).toBeDefined();
    });

    it('metadata가 없는 데이터로 Node 조회 시 예외 발생 가능', async () => {
      mockStore.get.mockReturnValue({
        spec: {}
      });

      const result = await nodeRepository.findById('no-metadata-node');
      
      expect(result).toBeDefined();
    });

    it('빈 이름으로 Node 조회 시도', async () => {
      mockStore.get.mockReturnValue(undefined);

      const result = await nodeRepository.findById('');

      expect(result).toBeNull();
      expect(mockStore.get).toHaveBeenCalledWith('nodes/');
    });

    it('null 이름으로 Node 조회 시도', async () => {
      mockStore.get.mockReturnValue(undefined);

      const result = await nodeRepository.findById(null as any);

      expect(result).toBeNull();
      expect(mockStore.get).toHaveBeenCalledWith('nodes/null');
    });

    it('list에서 잘못된 데이터 형식 반환 시 예외 발생 가능', async () => {
      mockStore.list.mockReturnValue({
        'nodes/node1': { invalid: 'data' },
        'nodes/node2': { metadata: { name: 'node2' } }
      });

      const result = await nodeRepository.findAll();
      
      expect(result).toBeDefined();
    });
  });
});
