import Docker from 'dockerode';
import { IContainerRuntime, ContainerStatus } from '../../domain/services/IContainerRuntime';
import { Pod } from '../../domain/entities/Pod';

/**
 * DockerRuntime
 * Docker를 사용한 컨테이너 런타임 구현체
 * Pod를 Docker 컨테이너로 실행하고 관리
 */
export class DockerRuntime implements IContainerRuntime {
  private docker: Docker;
  private containers: Map<string, Docker.Container> = new Map();

  /**
   * DockerRuntime 생성자
   * Docker 클라이언트 초기화
   */
  constructor() {
    this.docker = new Docker();
  }

  /**
   * Pod를 Docker 컨테이너로 실행
   * @param pod - 실행할 Pod 엔티티
   * @returns 컨테이너 상태 정보
   * @throws Docker API 오류 시 예외 발생
   */
  async run(pod: Pod): Promise<ContainerStatus> {
    const containerSpec = pod.spec.containers[0];
    
    const container = await this.docker.createContainer({
      Image: containerSpec.image,
      name: `pod-${pod.metadata.name}`,
      Env: containerSpec.env?.map(e => `${e.name}=${e.value}`) || [],
      ExposedPorts: containerSpec.ports?.reduce((acc, p) => {
        acc[`${p.containerPort}/tcp`] = {};
        return acc;
      }, {} as Record<string, {}>) || {}
    });

    await container.start();
    this.containers.set(pod.metadata.name, container);

    return {
      id: container.id,
      status: 'running',
      running: true
    };
  }

  /**
   * 컨테이너 중지 및 제거
   * @param containerId - 중지할 컨테이너 ID
   * @throws 컨테이너를 찾을 수 없거나 중지 실패 시 예외 발생
   */
  async stop(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.stop();
    await container.remove();
  }

  /**
   * 컨테이너 상태 조회
   * @param containerId - 조회할 컨테이너 ID
   * @returns 컨테이너 상태 정보
   * @throws 컨테이너를 찾을 수 없을 시 예외 발생
   */
  async getStatus(containerId: string): Promise<ContainerStatus> {
    const container = this.docker.getContainer(containerId);
    const info = await container.inspect();
    
    return {
      id: containerId,
      status: info.State.Status,
      running: info.State.Running || false
    };
  }
}
