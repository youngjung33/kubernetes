# Mini Kubernetes

Node.js와 TypeScript로 클린 아키텍처 패턴을 사용하여 구현한 Kubernetes 오케스트레이션 플랫폼입니다.

## 사전 요구사항

- Node.js v18 이상
- Docker (실행 중이어야 함)

Docker 확인:
```bash
docker --version
docker ps
```

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 서버 실행 (테스트용)
npm run dev
```

서버가 실행되면:
```
🚀 Mini Kubernetes API Server running on http://localhost:8080
📝 Health check: http://localhost:8080/health
```

## 라이브러리로 사용

다른 프로젝트에서 npm 패키지처럼 import하여 사용할 수 있습니다.

### 설치

```bash
npm install mini-k8s
```

### 사용 예시

```typescript
import { Container, Pod, CreatePodUseCase } from 'mini-k8s';

// Container 생성
const container = new Container();

// Pod 생성
const pod = new Pod(
  { name: 'nginx-test' },
  {
    containers: [
      { name: 'nginx', image: 'nginx:latest' }
    ]
  }
);

// UseCase 사용
const createPodUseCase = container.getCreatePodUseCase();
const createdPod = await createPodUseCase.execute(pod);
```

### Express 앱에 통합

```typescript
import express from 'express';
import { Container, setupPodRoutes } from 'mini-k8s';

const app = express();
const container = new Container();
const podController = container.getPodController();

setupPodRoutes(app, podController);
app.listen(3000);
```

## 동작 방식

### Pod 생성 흐름

```
1. API 요청 (YAML) → PodController
2. CreatePodUseCase 실행
3. PodRepository에 저장 (data.json)
4. Scheduler가 노드 선택
5. DockerRuntime이 컨테이너 실행
6. 응답 반환
```

### Pod 생성 시 실제 동작

1. **YAML 파싱**: 요청 본문의 YAML을 Pod 엔티티로 변환
2. **저장**: `data.json` 파일에 저장 (키: `pods/{namespace}/{name}`)
3. **스케줄링**: 라운드로빈 방식으로 노드 선택
4. **컨테이너 실행**: Docker API로 실제 컨테이너 생성 및 시작
5. **응답**: 생성된 Pod 정보 반환

### 데이터 저장

모든 데이터는 `data.json` 파일에 저장됩니다:
```json
{
  "pods/default/nginx-test": { ... },
  "nodes/node1": { ... }
}
```

### Docker 컨테이너

Pod 생성 시 실제 Docker 컨테이너가 실행됩니다:
```bash
docker ps
# pod-nginx-test 컨테이너가 실행 중
```

## API 사용

### Health Check
```bash
curl http://localhost:8080/health
```

### Pod 생성
```bash
curl -X POST http://localhost:8080/api/v1/pods \
  -H "Content-Type: application/yaml" \
  -d "
apiVersion: v1
kind: Pod
metadata:
  name: nginx-test
spec:
  containers:
  - name: nginx
    image: nginx:latest
"
```

**응답:**
```json
{
  "apiVersion": "v1",
  "kind": "Pod",
  "metadata": {
    "name": "nginx-test",
    "namespace": "default",
    "uid": "1706342400000-abc123def"
  },
  "spec": {
    "containers": [
      {
        "name": "nginx",
        "image": "nginx:latest"
      }
    ],
    "nodeName": "node1"
  },
  "status": {
    "phase": "Pending"
  }
}
```

### Pod 목록 조회
```bash
curl http://localhost:8080/api/v1/pods
```

### Pod 조회
```bash
curl http://localhost:8080/api/v1/pods/default/nginx-test
```

### Pod 삭제
```bash
curl -X DELETE http://localhost:8080/api/v1/pods/default/nginx-test
```

## 프로젝트 구조

```
src/
├── domain/              # 엔티티, 인터페이스
├── application/         # 유즈케이스
├── infrastructure/      # 구현체 (Store, Docker 등)
└── presentation/        # API 컨트롤러
```

## 주요 기능

- Pod 생성/조회/삭제
- YAML 파싱
- 라운드로빈 스케줄링
- Docker 컨테이너 실행
- JSON 파일 기반 저장

## 문제 해결

### Docker 연결 오류
Docker Desktop이 실행 중인지 확인

### 포트 충돌
```bash
PORT=3000 npm run dev
```

### 컨테이너 실행 실패
```bash
docker pull nginx:latest
```
