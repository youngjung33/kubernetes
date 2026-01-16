export interface NodeMetadata {
  name: string;
  labels?: Record<string, string>;
}

export interface NodeSpec {
  capacity?: {
    cpu: string;
    memory: string;
  };
}

export interface NodeStatus {
  conditions?: Array<{
    type: string;
    status: string;
  }>;
  allocatable?: {
    cpu: string;
    memory: string;
  };
}

/**
 * Node 엔티티
 * Kubernetes 클러스터의 워커 노드를 나타내는 엔티티
 */
export class Node {
  apiVersion: string = 'v1';
  kind: string = 'Node';
  metadata: NodeMetadata;
  spec: NodeSpec;
  status?: NodeStatus;

  /**
   * Node 생성자
   * @param metadata - Node 메타데이터 (이름, 레이블 등)
   * @param spec - Node 스펙 (리소스 용량 등)
   */
  constructor(metadata: NodeMetadata, spec: NodeSpec = {}) {
    this.metadata = metadata;
    this.spec = spec;
    this.status = {
      conditions: [
        { type: 'Ready', status: 'True' }
      ]
    };
  }

  /**
   * Store에 저장할 키 생성
   * @returns 저장소 키 (형식: nodes/{name})
   */
  getKey(): string {
    return `nodes/${this.metadata.name}`;
  }
}
