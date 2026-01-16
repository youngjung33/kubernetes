import { Pod } from '../entities/Pod';

export interface ContainerStatus {
  id: string;
  status: string;
  running: boolean;
}

export interface IContainerRuntime {
  run(pod: Pod): Promise<ContainerStatus>;
  stop(containerId: string): Promise<void>;
  getStatus(containerId: string): Promise<ContainerStatus>;
}
