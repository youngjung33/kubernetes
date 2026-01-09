# Kubernetes 구현 계획 (Node.js + TypeScript + Clean Architecture)

## 1. 클린 아키텍처 구조

```
mini-k8s/
├── package.json
├── tsconfig.json
├── .env
│
├── src/
│   ├── domain/                    # 도메인 레이어 (비즈니스 로직)
│   │   ├── entities/              # 엔티티
│   │   │   ├── Pod.ts
│   │   │   ├── Deployment.ts
│   │   │   ├── Service.ts
│   │   │   └── Node.ts
│   │   │
│   │   ├── repositories/          # 리포지토리 인터페이스
│   │   │   ├── IPodRepository.ts
│   │   │   ├── IDeploymentRepository.ts
│   │   │   └── INodeRepository.ts
│   │   │
│   │   └── services/              # 도메인 서비스 인터페이스
│   │       ├── IScheduler.ts
│   │       ├── IContainerRuntime.ts
│   │       └── IStore.ts
│   │
│   ├── application/               # 애플리케이션 레이어 (유즈케이스)
│   │   ├── use-cases/            # 유즈케이스
│   │   │   ├── pod/
│   │   │   │   ├── CreatePodUseCase.ts
│   │   │   │   ├── GetPodUseCase.ts
│   │   │   │   ├── DeletePodUseCase.ts
│   │   │   │   └── ListPodsUseCase.ts
│   │   │   │
│   │   │   ├── deployment/
│   │   │   │   ├── CreateDeploymentUseCase.ts
│   │   │   │   └── ReconcileDeploymentUseCase.ts
│   │   │   │
│   │   │   └── scheduler/
│   │   │       └── SchedulePodUseCase.ts
│   │   │
│   │   └── services/              # 애플리케이션 서비스
│   │       ├── DeploymentController.ts
│   │       └── ReplicaSetController.ts
│   │
│   ├── infrastructure/            # 인프라 레이어 (구현체)
│   │   ├── persistence/          # 영속성
│   │   │   ├── FileStore.ts      # Store 구현
│   │   │   └── PodRepository.ts  # Repository 구현
│   │   │
│   │   ├── container/            # 컨테이너 런타임
│   │   │   └── DockerRuntime.ts  # Docker 구현
│   │   │
│   │   ├── scheduler/            # 스케줄러 구현
│   │   │   └── RoundRobinScheduler.ts
│   │   │
│   │   └── http/                 # HTTP 클라이언트
│   │       └── AxiosHttpClient.ts
│   │
│   ├── presentation/             # 프레젠테이션 레이어 (API)
│   │   ├── api/                  # REST API
│   │   │   ├── server.ts
│   │   │   ├── routes/
│   │   │   │   ├── pod.routes.ts
│   │   │   │   ├── deployment.routes.ts
│   │   │   │   └── node.routes.ts
│   │   │   │
│   │   │   └── controllers/
│   │   │       ├── PodController.ts
│   │   │       ├── DeploymentController.ts
│   │   │       └── NodeController.ts
│   │   │
│   │   └── middleware/
│   │       ├── error-handler.ts
│   │       └── yaml-parser.ts
│   │
│   └── shared/                   # 공유 유틸리티
│       ├── types/
│       ├── errors/
│       └── utils/
│
├── cmd/                          # 실행 진입점
│   ├── api-server.ts
│   ├── scheduler.ts
│   ├── controller.ts
│   └── kubelet.ts
│
└── dist/                         # 컴파일된 JavaScript
```

## 2. 의존성 규칙 (Clean Architecture)

```
Presentation → Application → Domain ← Infrastructure
     ↓              ↓            ↑            ↑
     └──────────────┴────────────┴────────────┘
```

- **Domain**: 가장 안쪽, 다른 레이어에 의존하지 않음
- **Application**: Domain에만 의존
- **Infrastructure**: Domain과 Application 인터페이스를 구현
- **Presentation**: Application 유즈케이스를 호출

## 3. 핵심 컴포넌트 구현

### 3.1 Domain Layer

**entities/Pod.ts**
```typescript
export enum PodPhase {
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
  Failed = 'Failed',
  Unknown = 'Unknown'
}

export interface Container {
  name: string;
  image: string;
  ports?: Array<{
    containerPort: number;
    protocol?: string;
  }>;
  env?: Array<{
    name: string;
    value: string;
  }>;
}

export interface PodMetadata {
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
  uid?: string;
}

export interface PodSpec {
  containers: Container[];
  nodeName?: string;
}

export interface PodStatus {
  phase: PodPhase;
  containerStatuses?: Array<{
    name: string;
    state: {
      running?: { startedAt: string };
      waiting?: { reason: string };
      terminated?: { exitCode: number };
    };
  }>;
}

export class Pod {
  apiVersion: string = 'v1';
  kind: string = 'Pod';
  metadata: PodMetadata;
  spec: PodSpec;
  status?: PodStatus;

  constructor(metadata: PodMetadata, spec: PodSpec) {
    this.metadata = {
      namespace: 'default',
      uid: this.generateUID(),
      ...metadata
    };
    this.spec = spec;
    this.status = {
      phase: PodPhase.Pending
    };
  }

  getKey(): string {
    return `pods/${this.metadata.namespace}/${this.metadata.name}`;
  }

  private generateUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

**repositories/IPodRepository.ts**
```typescript
import { Pod } from '../entities/Pod';

export interface IPodRepository {
  create(pod: Pod): Promise<Pod>;
  findById(namespace: string, name: string): Promise<Pod | null>;
  findAll(namespace?: string): Promise<Pod[]>;
  update(pod: Pod): Promise<Pod>;
  delete(namespace: string, name: string): Promise<void>;
}
```

**services/IScheduler.ts**
```typescript
import { Pod } from '../entities/Pod';
import { Node } from '../entities/Node';

export interface IScheduler {
  schedule(pod: Pod, nodes: Node[]): Promise<Node>;
}
```

**services/IContainerRuntime.ts**
```typescript
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
```

### 3.2 Application Layer

**use-cases/pod/CreatePodUseCase.ts**
```typescript
import { Pod } from '../../domain/entities/Pod';
import { IPodRepository } from '../../domain/repositories/IPodRepository';
import { IScheduler } from '../../domain/services/IScheduler';
import { INodeRepository } from '../../domain/repositories/INodeRepository';
import { IContainerRuntime } from '../../domain/services/IContainerRuntime';

export class CreatePodUseCase {
  constructor(
    private podRepository: IPodRepository,
    private scheduler: IScheduler,
    private nodeRepository: INodeRepository,
    private containerRuntime: IContainerRuntime
  ) {}

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

    // 5. 컨테이너 실행 (kubelet이 처리)
    // 실제로는 kubelet이 API Server를 watch하여 처리

    return savedPod;
  }
}
```

**use-cases/deployment/ReconcileDeploymentUseCase.ts**
```typescript
import { Deployment } from '../../domain/entities/Deployment';
import { IDeploymentRepository } from '../../domain/repositories/IDeploymentRepository';
import { IPodRepository } from '../../domain/repositories/IPodRepository';
import { CreatePodUseCase } from '../pod/CreatePodUseCase';

export class ReconcileDeploymentUseCase {
  constructor(
    private deploymentRepository: IDeploymentRepository,
    private podRepository: IPodRepository,
    private createPodUseCase: CreatePodUseCase
  ) {}

  async execute(deploymentName: string, namespace: string): Promise<void> {
    const deployment = await this.deploymentRepository.findById(namespace, deploymentName);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    // 현재 Pod 수 확인
    const pods = await this.podRepository.findAll(namespace);
    const matchingPods = pods.filter(pod => 
      this.matchLabels(pod.metadata.labels || {}, deployment.spec.selector.matchLabels)
    );

    const desired = deployment.spec.replicas;
    const current = matchingPods.length;

    if (current < desired) {
      // Pod 생성
      const podsToCreate = desired - current;
      for (let i = 0; i < podsToCreate; i++) {
        const pod = deployment.createPodFromTemplate();
        await this.createPodUseCase.execute(pod);
      }
    } else if (current > desired) {
      // Pod 삭제
      const podsToDelete = current - desired;
      for (let i = 0; i < podsToDelete; i++) {
        await this.podRepository.delete(namespace, matchingPods[i].metadata.name);
      }
    }
  }

  private matchLabels(podLabels: Record<string, string>, selectorLabels: Record<string, string>): boolean {
    for (const [key, value] of Object.entries(selectorLabels)) {
      if (podLabels[key] !== value) {
        return false;
      }
    }
    return true;
  }
}
```

### 3.3 Infrastructure Layer

**persistence/FileStore.ts**
```typescript
import * as fs from 'fs';
import * as path from 'path';
import { IStore } from '../../domain/services/IStore';

export class FileStore implements IStore {
  private data: Map<string, any> = new Map();
  private dataFile: string;

  constructor(dataFile: string = 'data.json') {
    this.dataFile = path.join(process.cwd(), dataFile);
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = fs.readFileSync(this.dataFile, 'utf-8');
        const parsed = JSON.parse(data);
        this.data = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Failed to load store:', error);
    }
  }

  private save(): void {
    try {
      const data = Object.fromEntries(this.data);
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save store:', error);
    }
  }

  put(key: string, value: any): void {
    this.data.set(key, value);
    this.save();
  }

  get(key: string): any {
    return this.data.get(key);
  }

  list(prefix: string): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.data.entries()) {
      if (key.startsWith(prefix)) {
        result[key] = value;
      }
    }
    return result;
  }

  delete(key: string): void {
    this.data.delete(key);
    this.save();
  }
}
```

**container/DockerRuntime.ts**
```typescript
import Docker from 'dockerode';
import { IContainerRuntime, ContainerStatus } from '../../domain/services/IContainerRuntime';
import { Pod } from '../../domain/entities/Pod';

export class DockerRuntime implements IContainerRuntime {
  private docker: Docker;
  private containers: Map<string, Docker.Container> = new Map();

  constructor() {
    this.docker = new Docker();
  }

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

  async stop(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.stop();
    await container.remove();
  }

  async getStatus(containerId: string): Promise<ContainerStatus> {
    const container = this.docker.getContainer(containerId);
    await container.inspect();
    const info = await container.inspect();
    
    return {
      id: containerId,
      status: info.State.Status,
      running: info.State.Running
    };
  }
}
```

### 3.4 Presentation Layer

**api/controllers/PodController.ts**
```typescript
import { Request, Response } from 'express';
import { CreatePodUseCase } from '../../application/use-cases/pod/CreatePodUseCase';
import { GetPodUseCase } from '../../application/use-cases/pod/GetPodUseCase';
import { ListPodsUseCase } from '../../application/use-cases/pod/ListPodsUseCase';
import { DeletePodUseCase } from '../../application/use-cases/pod/DeletePodUseCase';
import { Pod } from '../../domain/entities/Pod';
import * as yaml from 'js-yaml';

export class PodController {
  constructor(
    private createPodUseCase: CreatePodUseCase,
    private getPodUseCase: GetPodUseCase,
    private listPodsUseCase: ListPodsUseCase,
    private deletePodUseCase: DeletePodUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const podData = yaml.load(req.body) as any;
      const pod = new Pod(podData.metadata, podData.spec);
      const created = await this.createPodUseCase.execute(pod);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, name } = req.params;
      const pod = await this.getPodUseCase.execute(namespace, name);
      if (!pod) {
        res.status(404).json({ error: 'Pod not found' });
        return;
      }
      res.json(pod);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const namespace = req.query.namespace as string || 'default';
      const pods = await this.listPodsUseCase.execute(namespace);
      res.json(pods);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, name } = req.params;
      await this.deletePodUseCase.execute(namespace, name);
      res.status(200).json({ status: 'deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

## 4. 의존성 주입 설정

**src/infrastructure/di/container.ts**
```typescript
import { FileStore } from '../persistence/FileStore';
import { PodRepository } from '../persistence/PodRepository';
import { DockerRuntime } from '../container/DockerRuntime';
import { RoundRobinScheduler } from '../scheduler/RoundRobinScheduler';
import { CreatePodUseCase } from '../../application/use-cases/pod/CreatePodUseCase';
import { PodController } from '../../presentation/api/controllers/PodController';

export class Container {
  // Infrastructure
  private store = new FileStore();
  private podRepository = new PodRepository(this.store);
  private containerRuntime = new DockerRuntime();
  private scheduler = new RoundRobinScheduler();

  // Use Cases
  private createPodUseCase = new CreatePodUseCase(
    this.podRepository,
    this.scheduler,
    // ... other dependencies
    this.containerRuntime
  );

  // Controllers
  getPodController(): PodController {
    return new PodController(
      this.createPodUseCase,
      // ... other use cases
    );
  }
}
```

## 5. 실행 진입점

**cmd/api-server.ts**
```typescript
import express from 'express';
import { Container } from '../src/infrastructure/di/container';
import { setupPodRoutes } from '../src/presentation/api/routes/pod.routes';

const app = express();
const container = new Container();

app.use(express.text({ type: 'application/yaml' }));
app.use(express.json());

setupPodRoutes(app, container);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API Server running on http://localhost:${PORT}`);
});
```

## 6. package.json

```json
{
  "name": "mini-k8s",
  "version": "1.0.0",
  "description": "Kubernetes implementation in TypeScript with Clean Architecture",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/cmd/api-server.js",
    "dev": "ts-node-dev --respawn --transpile-only cmd/api-server.ts",
    "scheduler": "ts-node-dev --respawn cmd/scheduler.ts",
    "controller": "ts-node-dev --respawn cmd/controller.ts",
    "kubelet": "ts-node-dev --respawn cmd/kubelet.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dockerode": "^3.3.5",
    "js-yaml": "^4.1.0",
    "axios": "^1.5.0",
    "winston": "^3.10.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^20.5.0",
    "@types/js-yaml": "^4.0.5",
    "@types/dockerode": "^3.3.0",
    "typescript": "^5.1.6",
    "ts-node-dev": "^2.0.0"
  }
}
```

## 7. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*", "cmd/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

**작성일**: 2025-01-27
