import { Request, Response } from 'express';
import { CreatePodUseCase } from '../../../application/use-cases/pod/CreatePodUseCase';
import { GetPodUseCase } from '../../../application/use-cases/pod/GetPodUseCase';
import { ListPodsUseCase } from '../../../application/use-cases/pod/ListPodsUseCase';
import { DeletePodUseCase } from '../../../application/use-cases/pod/DeletePodUseCase';
import { UpdatePodUseCase } from '../../../application/use-cases/pod/UpdatePodUseCase';
import { GetPodStatusUseCase } from '../../../application/use-cases/pod/GetPodStatusUseCase';
import { RestartPodUseCase } from '../../../application/use-cases/pod/RestartPodUseCase';
import { GetPodLogsUseCase } from '../../../application/use-cases/pod/GetPodLogsUseCase';
import { Pod } from '../../../domain/entities/Pod';
import * as yaml from 'js-yaml';

/**
 * PodController
 * Pod 관련 HTTP 요청을 처리하는 컨트롤러
 * REST API 엔드포인트와 유즈케이스를 연결
 */
export class PodController {
  /**
   * PodController 생성자
   * @param createPodUseCase - Pod 생성 유즈케이스
   * @param getPodUseCase - Pod 조회 유즈케이스
   * @param listPodsUseCase - Pod 목록 조회 유즈케이스
   * @param deletePodUseCase - Pod 삭제 유즈케이스
   * @param updatePodUseCase - Pod 업데이트 유즈케이스
   * @param getPodStatusUseCase - Pod 상태 조회 유즈케이스
   * @param restartPodUseCase - Pod 재시작 유즈케이스
   * @param getPodLogsUseCase - Pod 로그 조회 유즈케이스
   */
  constructor(
    private createPodUseCase: CreatePodUseCase,
    private getPodUseCase: GetPodUseCase,
    private listPodsUseCase: ListPodsUseCase,
    private deletePodUseCase: DeletePodUseCase,
    private updatePodUseCase: UpdatePodUseCase,
    private getPodStatusUseCase: GetPodStatusUseCase,
    private restartPodUseCase: RestartPodUseCase,
    private getPodLogsUseCase: GetPodLogsUseCase
  ) {}

  /**
   * Pod 생성 핸들러
   * YAML 형식의 Pod 정의를 받아서 생성
   * @param req - Express 요청 객체 (body에 YAML 형식의 Pod 정의)
   * @param res - Express 응답 객체
   */
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

  /**
   * Pod 조회 핸들러
   * 네임스페이스와 이름으로 Pod를 조회
   * @param req - Express 요청 객체 (params에 namespace, name)
   * @param res - Express 응답 객체
   */
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

  /**
   * Pod 목록 조회 핸들러
   * 네임스페이스별 또는 전체 Pod 목록을 조회
   * @param req - Express 요청 객체 (query에 namespace 선택사항)
   * @param res - Express 응답 객체
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const namespace = req.query.namespace as string || 'default';
      const pods = await this.listPodsUseCase.execute(namespace);
      res.json(pods);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Pod 삭제 핸들러
   * 네임스페이스와 이름으로 Pod를 삭제
   * @param req - Express 요청 객체 (params에 namespace, name)
   * @param res - Express 응답 객체
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, name } = req.params;
      await this.deletePodUseCase.execute(namespace, name);
      res.status(200).json({ status: 'deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Pod 업데이트 핸들러
   * YAML 형식의 Pod 정의를 받아서 업데이트
   * @param req - Express 요청 객체 (params에 namespace, name, body에 YAML 형식의 Pod 정의)
   * @param res - Express 응답 객체
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, name } = req.params;
      const podData = yaml.load(req.body) as any;
      const pod = new Pod(podData.metadata, podData.spec);
      const updated = await this.updatePodUseCase.execute(namespace, name, pod);
      res.status(200).json(updated);
    } catch (error: any) {
      if (error.message === 'Pod not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  /**
   * Pod 상태 조회 핸들러
   * 네임스페이스와 이름으로 Pod 상태를 조회
   * @param req - Express 요청 객체 (params에 namespace, name)
   * @param res - Express 응답 객체
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, name } = req.params;
      const pod = await this.getPodStatusUseCase.execute(namespace, name);
      res.json(pod);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  /**
   * Pod 재시작 핸들러
   * 네임스페이스와 이름으로 Pod를 재시작
   * @param req - Express 요청 객체 (params에 namespace, name)
   * @param res - Express 응답 객체
   */
  async restart(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, name } = req.params;
      const pod = await this.restartPodUseCase.execute(namespace, name);
      res.status(200).json(pod);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  /**
   * Pod 로그 조회 핸들러
   * 네임스페이스와 이름으로 Pod 로그를 조회
   * @param req - Express 요청 객체 (params에 namespace, name)
   * @param res - Express 응답 객체
   */
  async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, name } = req.params;
      const logs = await this.getPodLogsUseCase.execute(namespace, name);
      res.status(200).json({ logs });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
}
