import { Pod } from '../../../domain/entities/Pod';
import { IPodRepository } from '../../../domain/repositories/IPodRepository';
import { IScheduler } from '../../../domain/services/IScheduler';
import { INodeRepository } from '../../../domain/repositories/INodeRepository';
import { IContainerRuntime } from '../../../domain/services/IContainerRuntime';

/**
 * CreatePodUseCase
 * Pod 생성 유즈케이스
 * Pod를 생성하고 스케줄링하여 노드에 배치한 후 컨테이너를 실행
 */
export class CreatePodUseCase {
  /**
   * CreatePodUseCase 생성자
   * @param podRepository - Pod 리포지토리
   * @param scheduler - 스케줄러
   * @param nodeRepository - Node 리포지토리
   * @param containerRuntime - 컨테이너 런타임
   */
  constructor(
    private podRepository: IPodRepository,
    private scheduler: IScheduler,
    private nodeRepository: INodeRepository,
    private containerRuntime: IContainerRuntime
  ) {}

  /**
   * Pod 생성 실행
   * 1. Pod를 저장소에 저장
   * 2. 사용 가능한 노드 목록 조회
   * 3. 스케줄러를 통해 적절한 노드 선택
   * 4. Pod에 노드 정보 할당 및 업데이트
   * 5. 컨테이너 런타임을 통해 컨테이너 실행
   * @param pod - 생성할 Pod 엔티티
   * @returns 생성 및 배치된 Pod 엔티티
   * @throws 스케줄링 실패 또는 컨테이너 실행 실패 시 예외 발생
   */
  async execute(pod: Pod): Promise<Pod> {
    // 1. Pod 저장
    const savedPod = await this.podRepository.create(pod);

    // 2. 노드 목록 가져오기
    const nodes = await this.nodeRepository.findAll();

    // 3. 스케줄링
    const selectedNode = await this.scheduler.schedule(savedPod, nodes);

    // 4. 노드에 Pod 배치
    savedPod.spec.nodeName = selectedNode.metadata.name;
    await this.podRepository.update(savedPod);

    // 5. 컨테이너 실행
    await this.containerRuntime.run(savedPod);

    return savedPod;
  }
}
