import * as fs from 'fs';
import * as path from 'path';
import { IStore } from '../../domain/services/IStore';

/**
 * FileStore
 * JSON 파일 기반의 Key-Value 저장소 구현체
 * etcd를 대체하는 간단한 영속성 레이어
 */
export class FileStore implements IStore {
  private data: Map<string, any> = new Map();
  private dataFile: string;

  /**
   * FileStore 생성자
   * @param dataFile - 데이터를 저장할 JSON 파일 경로 (기본값: data.json)
   */
  constructor(dataFile: string = 'data.json') {
    this.dataFile = path.join(process.cwd(), dataFile);
    this.load();
  }

  /**
   * 파일에서 데이터 로드
   * 파일이 존재하면 JSON을 파싱하여 메모리에 로드
   */
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

  /**
   * 메모리 데이터를 파일에 저장
   * Map을 JSON으로 변환하여 파일에 쓰기
   */
  private save(): void {
    try {
      const data = Object.fromEntries(this.data);
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save store:', error);
    }
  }

  /**
   * 키-값 쌍 저장
   * @param key - 저장할 키
   * @param value - 저장할 값
   */
  put(key: string, value: any): void {
    this.data.set(key, value);
    this.save();
  }

  /**
   * 키로 값 조회
   * @param key - 조회할 키
   * @returns 저장된 값 또는 undefined
   */
  get(key: string): any {
    return this.data.get(key);
  }

  /**
   * prefix로 시작하는 모든 키-값 쌍 조회
   * @param prefix - 검색할 키의 접두사
   * @returns prefix로 시작하는 모든 키-값 쌍
   */
  list(prefix: string): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.data.entries()) {
      if (key.startsWith(prefix)) {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * 키로 값 삭제
   * @param key - 삭제할 키
   */
  delete(key: string): void {
    this.data.delete(key);
    this.save();
  }
}
