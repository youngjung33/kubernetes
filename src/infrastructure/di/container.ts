import { FileStore } from '../persistence/FileStore';
import { PodRepository } from '../persistence/PodRepository';
import { NodeRepository } from '../persistence/NodeRepository';
import { DockerRuntime } from '../container/DockerRuntime';
import { RoundRobinScheduler } from '../scheduler/RoundRobinScheduler';
import { CreatePodUseCase } from '../../application/use-cases/pod/CreatePodUseCase';
import { GetPodUseCase } from '../../application/use-cases/pod/GetPodUseCase';
import { ListPodsUseCase } from '../../application/use-cases/pod/ListPodsUseCase';
import { DeletePodUseCase } from '../../application/use-cases/pod/DeletePodUseCase';
import { UpdatePodUseCase } from '../../application/use-cases/pod/UpdatePodUseCase';
import { CreateNodeUseCase } from '../../application/use-cases/node/CreateNodeUseCase';
import { GetNodeUseCase } from '../../application/use-cases/node/GetNodeUseCase';
import { ListNodesUseCase } from '../../application/use-cases/node/ListNodesUseCase';
import { DeleteNodeUseCase } from '../../application/use-cases/node/DeleteNodeUseCase';
import { UpdateNodeUseCase } from '../../application/use-cases/node/UpdateNodeUseCase';
import { PodController } from '../../presentation/api/controllers/PodController';

/**
 * Container
 * 의존성 주입 컨테이너
 * 모든 의존성을 생성하고 관리하는 IoC 컨테이너
 */
export class Container {
  // Infrastructure
  private store = new FileStore();
  private podRepository = new PodRepository(this.store);
  private nodeRepository = new NodeRepository(this.store);
  private containerRuntime = new DockerRuntime();
  private scheduler = new RoundRobinScheduler();

  // Use Cases
  private createPodUseCase = new CreatePodUseCase(
    this.podRepository,
    this.scheduler,
    this.nodeRepository,
    this.containerRuntime
  );
  private getPodUseCase = new GetPodUseCase(this.podRepository);
  private listPodsUseCase = new ListPodsUseCase(this.podRepository);
  private deletePodUseCase = new DeletePodUseCase(this.podRepository);
  private updatePodUseCase = new UpdatePodUseCase(this.podRepository);

  // Node Use Cases
  private createNodeUseCase = new CreateNodeUseCase(this.nodeRepository);
  private getNodeUseCase = new GetNodeUseCase(this.nodeRepository);
  private listNodesUseCase = new ListNodesUseCase(this.nodeRepository);
  private deleteNodeUseCase = new DeleteNodeUseCase(this.nodeRepository);
  private updateNodeUseCase = new UpdateNodeUseCase(this.nodeRepository);

  /**
   * PodController 인스턴스 반환
   * 필요한 유즈케이스들을 주입하여 컨트롤러 생성
   * @returns PodController 인스턴스
   */
  getPodController(): PodController {
    return new PodController(
      this.createPodUseCase,
      this.getPodUseCase,
      this.listPodsUseCase,
      this.deletePodUseCase,
      this.updatePodUseCase
    );
  }

  /**
   * CreatePodUseCase 인스턴스 반환
   * @returns CreatePodUseCase 인스턴스
   */
  getCreatePodUseCase(): CreatePodUseCase {
    return this.createPodUseCase;
  }

  /**
   * GetPodUseCase 인스턴스 반환
   * @returns GetPodUseCase 인스턴스
   */
  getGetPodUseCase(): GetPodUseCase {
    return this.getPodUseCase;
  }

  /**
   * ListPodsUseCase 인스턴스 반환
   * @returns ListPodsUseCase 인스턴스
   */
  getListPodsUseCase(): ListPodsUseCase {
    return this.listPodsUseCase;
  }

  /**
   * DeletePodUseCase 인스턴스 반환
   * @returns DeletePodUseCase 인스턴스
   */
  getDeletePodUseCase(): DeletePodUseCase {
    return this.deletePodUseCase;
  }

  /**
   * UpdatePodUseCase 인스턴스 반환
   * @returns UpdatePodUseCase 인스턴스
   */
  getUpdatePodUseCase(): UpdatePodUseCase {
    return this.updatePodUseCase;
  }

  /**
   * CreateNodeUseCase 인스턴스 반환
   * @returns CreateNodeUseCase 인스턴스
   */
  getCreateNodeUseCase(): CreateNodeUseCase {
    return this.createNodeUseCase;
  }

  /**
   * GetNodeUseCase 인스턴스 반환
   * @returns GetNodeUseCase 인스턴스
   */
  getGetNodeUseCase(): GetNodeUseCase {
    return this.getNodeUseCase;
  }

  /**
   * ListNodesUseCase 인스턴스 반환
   * @returns ListNodesUseCase 인스턴스
   */
  getListNodesUseCase(): ListNodesUseCase {
    return this.listNodesUseCase;
  }

  /**
   * DeleteNodeUseCase 인스턴스 반환
   * @returns DeleteNodeUseCase 인스턴스
   */
  getDeleteNodeUseCase(): DeleteNodeUseCase {
    return this.deleteNodeUseCase;
  }

  /**
   * UpdateNodeUseCase 인스턴스 반환
   * @returns UpdateNodeUseCase 인스턴스
   */
  getUpdateNodeUseCase(): UpdateNodeUseCase {
    return this.updateNodeUseCase;
  }
}
