import { Request, Response } from 'express';
import { CreateNodeUseCase } from '../../../application/use-cases/node/CreateNodeUseCase';
import { GetNodeUseCase } from '../../../application/use-cases/node/GetNodeUseCase';
import { ListNodesUseCase } from '../../../application/use-cases/node/ListNodesUseCase';
import { DeleteNodeUseCase } from '../../../application/use-cases/node/DeleteNodeUseCase';
import { UpdateNodeUseCase } from '../../../application/use-cases/node/UpdateNodeUseCase';
import { ListPodsUseCase } from '../../../application/use-cases/pod/ListPodsUseCase';
import { Node } from '../../../domain/entities/Node';
import * as yaml from 'js-yaml';

/**
 * NodeController
 * Node 관련 HTTP 요청을 처리하는 컨트롤러
 * REST API 엔드포인트와 유즈케이스를 연결
 */
export class NodeController {
  /**
   * NodeController 생성자
   * @param createNodeUseCase - Node 생성 유즈케이스
   * @param getNodeUseCase - Node 조회 유즈케이스
   * @param listNodesUseCase - Node 목록 조회 유즈케이스
   * @param deleteNodeUseCase - Node 삭제 유즈케이스
   * @param updateNodeUseCase - Node 업데이트 유즈케이스
   * @param listPodsUseCase - 해당 노드의 Pod 목록 조회용 (GET /nodes/:name/pods)
   */
  constructor(
    private createNodeUseCase: CreateNodeUseCase,
    private getNodeUseCase: GetNodeUseCase,
    private listNodesUseCase: ListNodesUseCase,
    private deleteNodeUseCase: DeleteNodeUseCase,
    private updateNodeUseCase: UpdateNodeUseCase,
    private listPodsUseCase: ListPodsUseCase
  ) {}

  /**
   * 해당 노드에 스케줄된 Pod 목록 조회
   * GET /api/v1/nodes/:name/pods
   * @param req - Express 요청 객체 (params.name = 노드 이름)
   * @param res - Express 응답 객체
   */
  async listPodsOnNode(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const namespace = (req.query.namespace as string) || undefined;
      const pods = await this.listPodsUseCase.execute(namespace, { nodeName: name });
      res.json(pods);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Node 생성 핸들러
   * YAML 형식의 Node 정의를 받아서 생성
   * @param req - Express 요청 객체 (body에 YAML 형식의 Node 정의)
   * @param res - Express 응답 객체
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const nodeData = yaml.load(req.body) as any;
      if (!nodeData.metadata || !nodeData.metadata.name) {
        res.status(400).json({ error: 'Node metadata.name is required' });
        return;
      }
      const node = new Node(nodeData.metadata, nodeData.spec || {});
      const created = await this.createNodeUseCase.execute(node);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Node 조회 핸들러
   * 이름으로 Node를 조회
   * @param req - Express 요청 객체 (params에 name)
   * @param res - Express 응답 객체
   */
  async get(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const node = await this.getNodeUseCase.execute(name);
      if (!node) {
        res.status(404).json({ error: 'Node not found' });
        return;
      }
      res.json(node);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Node 목록 조회 핸들러
   * 모든 Node 목록을 조회
   * @param req - Express 요청 객체
   * @param res - Express 응답 객체
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const nodes = await this.listNodesUseCase.execute();
      res.json(nodes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Node 삭제 핸들러
   * 이름으로 Node를 삭제
   * @param req - Express 요청 객체 (params에 name)
   * @param res - Express 응답 객체
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      await this.deleteNodeUseCase.execute(name);
      res.status(200).json({ status: 'deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Node 업데이트 핸들러
   * YAML 형식의 Node 정의를 받아서 업데이트
   * @param req - Express 요청 객체 (params에 name, body에 YAML 형식의 Node 정의)
   * @param res - Express 응답 객체
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const nodeData = yaml.load(req.body) as any;
      const node = new Node(nodeData.metadata || { name }, nodeData.spec || {});
      const updated = await this.updateNodeUseCase.execute(name, node);
      res.status(200).json(updated);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }
}
