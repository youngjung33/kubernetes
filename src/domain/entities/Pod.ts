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

/**
 * Pod 엔티티
 * Kubernetes에서 실행되는 최소 단위로, 하나 이상의 컨테이너를 포함하는 그룹
 * containerId는 CreatePod 시 run() 반환값으로 설정·저장되며, 상태/재시작/로그 조회에 사용
 */
export class Pod {
  apiVersion: string = 'v1';
  kind: string = 'Pod';
  metadata: PodMetadata;
  spec: PodSpec;
  status?: PodStatus;
  /** 컨테이너 런타임 ID (CreatePod 시 run() 반환값으로 설정, 저장됨) */
  containerId?: string;

  /**
   * Pod 생성자
   * @param metadata - Pod 메타데이터 (이름, 네임스페이스, 레이블 등)
   * @param spec - Pod 스펙 (컨테이너 정의 등)
   */
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

  /**
   * Store에 저장할 키 생성
   * @returns 저장소 키 (형식: pods/{namespace}/{name})
   */
  getKey(): string {
    return `pods/${this.metadata.namespace}/${this.metadata.name}`;
  }

  /**
   * 고유 ID 생성
   * @returns 타임스탬프와 랜덤 문자열을 조합한 UID
   */
  private generateUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
