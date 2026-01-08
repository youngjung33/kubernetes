# Kubernetes 구현 계획

## 1. 아키텍처

```
┌─────────────────────────────────────────┐
│         Kubernetes Cluster              │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │     Control Plane (마스터)        │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │  API Server                │  │  │
│  │  │  - REST API 엔드포인트      │  │  │
│  │  └────────────────────────────┘  │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │  etcd                      │  │  │
│  │  │  - 클러스터 상태 저장      │  │  │
│  │  └────────────────────────────┘  │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │  Scheduler                 │  │  │
│  │  │  - Pod를 노드에 배치       │  │  │
│  │  └────────────────────────────┘  │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │  Controller Manager         │  │  │
│  │  │  - 원하는 상태 유지         │  │  │
│  │  └────────────────────────────┘  │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────┐  ┌──────────┐          │
│  │  Node 1  │  │  Node 2  │          │
│  │  ┌────┐  │  │  ┌────┐  │          │
│  │  │kube│  │  │  │kube│  │          │
│  │  │let │  │  │  │let │  │          │
│  │  └────┘  │  │  └────┘  │          │
│  │  ┌────┐  │  │  ┌────┐  │          │
│  │  │kube│  │  │  │kube│  │          │
│  │  │proxy│  │  │  │proxy│ │          │
│  │  └────┘  │  │  └────┘  │          │
│  └──────────┘  └──────────┘          │
└─────────────────────────────────────────┘
```

## 2. 컴포넌트 구현

### 2.1 API Server

**역할:**
- 모든 요청의 중앙 엔드포인트
- REST API 제공
- YAML 파일을 받아서 etcd에 저장

**구현:**
```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/v1/pods', methods=['POST'])
def create_pod():
    # YAML을 받아서 파싱
    # etcd에 저장
    pass

@app.route('/api/v1/pods', methods=['GET'])
def list_pods():
    # etcd에서 읽어서 반환
    pass
```

**핵심 기능:**
- YAML 파싱
- REST API 엔드포인트
- etcd와 통신

### 2.2 etcd (상태 저장소)

**역할:**
- 클러스터의 모든 상태 저장
- Key-Value 저장소
- Watch 기능 (변경 감지)

**구현:**
```python
class SimpleStore:
    def __init__(self):
        self.data = {}
    
    def put(self, key, value):
        self.data[key] = value
    
    def get(self, key):
        return self.data.get(key)
    
    def list(self, prefix):
        return {k: v for k, v in self.data.items() if k.startswith(prefix)}
```

**핵심 기능:**
- Key-Value 저장
- Watch (변경 감지)
- 트랜잭션 지원

### 2.3 Scheduler

**역할:**
- Pod를 어떤 노드에 배치할지 결정
- 노드의 리소스 상태 확인
- 스케줄링 알고리즘 적용

**구현:**
```python
class Scheduler:
    def schedule_pod(self, pod, nodes):
        available_nodes = [n for n in nodes if n.has_resources(pod)]
        if not available_nodes:
            raise Exception("No available nodes")
        
        # 간단한 라운드로빈
        return available_nodes[0]
```

**핵심 기능:**
- 노드 리소스 확인
- 스케줄링 알고리즘
- 노드 선택

### 2.4 Controller Manager

**역할:**
- 원하는 상태(Desired State)와 현재 상태(Current State) 비교
- 차이가 있으면 조정
- Deployment Controller: Pod 수 유지
- ReplicaSet Controller: Replica 수 유지

**구현:**
```python
class DeploymentController:
    def __init__(self, store, kubelet_client):
        self.store = store
        self.kubelet = kubelet_client
    
    def reconcile(self):
        deployments = self.store.list('deployments/')
        
        for deployment in deployments:
            desired = deployment.spec.replicas
            current = self.count_pods(deployment.name)
            
            if current < desired:
                self.create_pod(deployment)
            elif current > desired:
                self.delete_pod(deployment)
```

**핵심 기능:**
- 상태 비교 (Desired vs Current)
- 자동 조정
- 루프 실행 (주기적으로 확인)

### 2.5 kubelet (노드 에이전트)

**역할:**
- 노드에서 Pod를 실제로 실행
- Docker/containerd와 통신
- Pod 상태를 API Server에 보고

**구현:**
```python
import docker

class Kubelet:
    def __init__(self, node_name, docker_client):
        self.node_name = node_name
        self.docker = docker_client
    
    def run_pod(self, pod_spec):
        container = self.docker.containers.run(
            image=pod_spec.image,
            name=pod_spec.name,
            detach=True
        )
        return container
    
    def stop_pod(self, pod_name):
        container = self.docker.containers.get(pod_name)
        container.stop()
    
    def get_pod_status(self, pod_name):
        container = self.docker.containers.get(pod_name)
        return {
            'status': container.status,
            'running': container.status == 'running'
        }
```

**핵심 기능:**
- Docker 컨테이너 실행/중지
- Pod 상태 모니터링
- API Server에 상태 보고

### 2.6 kube-proxy

**역할:**
- Service의 로드밸런싱
- 네트워크 프록시

**구현:**
```python
from flask import Flask, request
import requests

class KubeProxy:
    def __init__(self, service_store):
        self.services = service_store
        self.app = Flask(__name__)
    
    def proxy_request(self, service_name, path):
        pods = self.services.get_pods(service_name)
        pod = self.select_pod(pods)
        response = requests.get(f"http://{pod.ip}:{pod.port}{path}")
        return response
```

**핵심 기능:**
- Service → Pod 매핑
- 로드밸런싱
- 요청 프록시

## 3. 구현 단계

### Phase 1: 기본 인프라

**목표:** 가장 간단한 버전 구현

1. **간단한 저장소 (etcd 대체)**
   - 인메모리 Key-Value 저장소
   - JSON 파일 기반 영속성

2. **API Server (최소 기능)**
   - Pod 생성/조회/삭제
   - YAML 파싱

3. **kubelet (단일 노드)**
   - Docker 컨테이너 실행
   - Pod 상태 확인

**결과물:**
- Pod 생성 가능

### Phase 2: 스케줄링

**목표:** 여러 노드에 Pod 배치

1. **노드 등록**
   - 노드 정보 저장
   - 노드 상태 확인

2. **Scheduler 구현**
   - 간단한 라운드로빈 스케줄링
   - 리소스 확인

3. **kubelet 통신**
   - API Server → kubelet 통신
   - 원격 노드에 Pod 배치

**결과물:**
- 여러 노드에 Pod 자동 배치

### Phase 3: Controller

**목표:** 자동 복구 및 스케일링

1. **Deployment Controller**
   - 원하는 Pod 수 유지
   - Pod가 죽으면 재생성

2. **ReplicaSet Controller**
   - Replica 수 관리

3. **Watch 기능**
   - 상태 변경 감지

**결과물:**
- Pod가 죽으면 자동 재시작
- `replicas: 3` 설정 시 자동으로 3개 유지

### Phase 4: Service & 네트워킹

**목표:** 로드밸런싱 및 서비스 디스커버리

1. **Service 구현**
   - Pod 그룹에 대한 엔드포인트
   - 로드밸런싱

2. **kube-proxy 구현**
   - 요청 프록시
   - 라운드로빈 로드밸런싱

3. **네트워크 격리**
   - Pod 간 통신
   - Service IP 할당

**결과물:**
- Service를 통한 로드밸런싱
- 여러 Pod에 요청 분산

### Phase 5: 고급 기능

1. **Ingress**
   - 도메인 라우팅
   - HTTP/HTTPS 처리

2. **ConfigMap & Secret**
   - 설정 관리
   - 환경 변수 주입

3. **Health Check**
   - Liveness Probe
   - Readiness Probe

## 4. 기술 스택

### 언어 선택

**Python**
- 장점: 빠른 프로토타이핑, Docker SDK 사용 용이
- 단점: 성능이 상대적으로 낮음

**Go**
- 장점: 실제 Kubernetes와 동일한 언어, 성능 우수
- 단점: 학습 곡선이 있음

### 필수 라이브러리

**Python:**
- `flask` 또는 `fastapi`: API Server
- `docker`: Docker 컨테이너 제어
- `pyyaml`: YAML 파싱
- `requests`: HTTP 클라이언트

**Go:**
- `net/http`: HTTP 서버
- `docker/client`: Docker 클라이언트
- `gopkg.in/yaml.v3`: YAML 파싱

## 5. 프로젝트 구조

```
mini-k8s/
├── api-server/          # API Server
│   ├── server.py
│   ├── handlers.py
│   └── yaml_parser.py
├── scheduler/           # Scheduler
│   └── scheduler.py
├── controller/          # Controller Manager
│   ├── deployment_controller.py
│   └── replicaset_controller.py
├── kubelet/            # kubelet
│   └── kubelet.py
├── kube-proxy/         # kube-proxy
│   └── proxy.py
├── store/              # 저장소 (etcd 대체)
│   └── store.py
├── models/             # 데이터 모델
│   ├── pod.py
│   ├── deployment.py
│   └── service.py
└── client/             # kubectl 클라이언트
    └── kubectl.py
```

## 6. 시작하기

### Step 1: 가장 간단한 버전부터

```python
# 1. 저장소 생성
store = SimpleStore()

# 2. API Server 시작
api_server = APIServer(store)
api_server.start()

# 3. kubelet 시작
kubelet = Kubelet('node1', docker_client)
kubelet.start()

# 4. Pod 생성
pod_yaml = """
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - name: nginx
    image: nginx:latest
"""

api_server.create_pod(pod_yaml)
```

### Step 2: 점진적으로 기능 추가

1. Pod 생성 → Pod 조회 → Pod 삭제
2. 여러 노드 지원
3. 스케줄링
4. Controller 추가
5. Service 추가

---

**작성일**: 2025-01-27

