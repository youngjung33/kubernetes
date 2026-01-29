/**
 * Mini Kubernetes Library
 * 라이브러리 진입점 - 다른 프로젝트에서 import할 때 사용
 */

// Domain Entities
export { Pod } from './domain/entities/Pod';
export { Node } from './domain/entities/Node';
export type { PodMetadata, PodSpec, PodStatus, Container as PodContainer } from './domain/entities/Pod';
export type { NodeMetadata, NodeSpec, NodeStatus } from './domain/entities/Node';
export { PodPhase } from './domain/entities/Pod';
export { Deployment } from './domain/entities/Deployment';
export type { DeploymentMetadata, DeploymentSpec, DeploymentStatus, PodTemplateSpec } from './domain/entities/Deployment';

// Domain Repositories (Interfaces)
export type { IPodRepository, ListPodsOptions } from './domain/repositories/IPodRepository';
export type { INodeRepository } from './domain/repositories/INodeRepository';
export type { IDeploymentRepository } from './domain/repositories/IDeploymentRepository';

// Domain Services (Interfaces)
export type { IScheduler } from './domain/services/IScheduler';
export type { IContainerRuntime, ContainerStatus } from './domain/services/IContainerRuntime';
export type { IStore } from './domain/services/IStore';

// Application Use Cases
export { CreatePodUseCase } from './application/use-cases/pod/CreatePodUseCase';
export { GetPodUseCase } from './application/use-cases/pod/GetPodUseCase';
export { ListPodsUseCase } from './application/use-cases/pod/ListPodsUseCase';
export { DeletePodUseCase } from './application/use-cases/pod/DeletePodUseCase';
export { UpdatePodUseCase } from './application/use-cases/pod/UpdatePodUseCase';
export { GetPodStatusUseCase } from './application/use-cases/pod/GetPodStatusUseCase';
export { RestartPodUseCase } from './application/use-cases/pod/RestartPodUseCase';
export { GetPodLogsUseCase } from './application/use-cases/pod/GetPodLogsUseCase';
export { CreateNodeUseCase } from './application/use-cases/node/CreateNodeUseCase';
export { GetNodeUseCase } from './application/use-cases/node/GetNodeUseCase';
export { ListNodesUseCase } from './application/use-cases/node/ListNodesUseCase';
export { DeleteNodeUseCase } from './application/use-cases/node/DeleteNodeUseCase';
export { UpdateNodeUseCase } from './application/use-cases/node/UpdateNodeUseCase';
export { CreateDeploymentUseCase } from './application/use-cases/deployment/CreateDeploymentUseCase';
export { GetDeploymentUseCase } from './application/use-cases/deployment/GetDeploymentUseCase';
export { ListDeploymentsUseCase } from './application/use-cases/deployment/ListDeploymentsUseCase';
export { DeleteDeploymentUseCase } from './application/use-cases/deployment/DeleteDeploymentUseCase';
export { ReconcileDeploymentUseCase } from './application/use-cases/deployment/ReconcileDeploymentUseCase';
export { UpdateDeploymentUseCase } from './application/use-cases/deployment/UpdateDeploymentUseCase';

// Infrastructure
export { Container } from './infrastructure/di/container';
export { FileStore } from './infrastructure/persistence/FileStore';
export { PodRepository } from './infrastructure/persistence/PodRepository';
export { NodeRepository } from './infrastructure/persistence/NodeRepository';
export { DeploymentRepository } from './infrastructure/persistence/DeploymentRepository';
export { DockerRuntime } from './infrastructure/container/DockerRuntime';
export { RoundRobinScheduler } from './infrastructure/scheduler/RoundRobinScheduler';

// Presentation
export { PodController } from './presentation/api/controllers/PodController';
export { NodeController } from './presentation/api/controllers/NodeController';
export { DeploymentController } from './presentation/api/controllers/DeploymentController';
export { setupPodRoutes } from './presentation/api/routes/pod.routes';
export { setupNodeRoutes } from './presentation/api/routes/node.routes';
export { setupDeploymentRoutes } from './presentation/api/routes/deployment.routes';