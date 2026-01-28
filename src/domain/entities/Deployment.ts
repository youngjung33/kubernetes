import { Pod, PodMetadata, PodSpec } from './Pod';

/** Deployment 메타데이터 */
export interface DeploymentMetadata {
  name: string;
  namespace?: string;
  uid?: string;
}

/** Pod 템플릿 (Deployment가 생성할 Pod의 뼈대) */
export interface PodTemplateSpec {
  metadata?: { labels?: Record<string, string> };
  spec: PodSpec;
}

/** Deployment 스펙 */
export interface DeploymentSpec {
  /** 목표 레플리카 수 */
  replicas: number;
  /** 생성된 Pod를 선택할 라벨 셀렉터 */
  selector: { matchLabels: Record<string, string> };
  /** Pod 생성 시 사용할 템플릿 */
  template: PodTemplateSpec;
}

/** Deployment 상태 */
export interface DeploymentStatus {
  availableReplicas?: number;
  readyReplicas?: number;
}

/**
 * Deployment 엔티티
 * replicas 수만큼 Pod를 유지하기 위한 리소스. Reconcile 시 selector로 매칭된 Pod 수를 맞춤
 */
export class Deployment {
  apiVersion: string = 'apps/v1';
  kind: string = 'Deployment';
  metadata: DeploymentMetadata;
  spec: DeploymentSpec;
  status?: DeploymentStatus;

  constructor(metadata: DeploymentMetadata, spec: DeploymentSpec) {
    this.metadata = {
      namespace: 'default',
      uid: this.generateUID(),
      ...metadata
    };
    this.spec = spec;
  }

  /**
   * Store에 저장할 키 생성
   * @returns 저장소 키 (형식: deployments/{namespace}/{name})
   */
  getKey(): string {
    return `deployments/${this.metadata.namespace}/${this.metadata.name}`;
  }

  /**
   * 템플릿으로 새 Pod 인스턴스 생성 (Reconcile 시 호출)
   * selector.matchLabels와 template.metadata.labels를 합쳐 Pod 라벨로 사용
   * @param uniqueSuffix - Pod 이름 충돌 방지용 접미사 (예: 랜덤 문자열)
   * @returns 생성할 Pod (아직 저장/실행 전)
   */
  createPodFromTemplate(uniqueSuffix: string): Pod {
    const name = `${this.metadata.name}-${uniqueSuffix}`;
    const labels: Record<string, string> = {
      ...(this.spec.selector?.matchLabels || {}),
      ...(this.spec.template?.metadata?.labels || {})
    };
    const metadata: PodMetadata = {
      name,
      namespace: this.metadata.namespace,
      labels: Object.keys(labels).length ? labels : undefined
    };
    return new Pod(metadata, this.spec.template.spec);
  }

  private generateUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
