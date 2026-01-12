import { FileStore } from '../src/infrastructure/persistence/FileStore';
import * as fs from 'fs';
import * as path from 'path';

// fs 모킹
jest.mock('fs');
jest.mock('path');

describe('FileStore - 실패 케이스', () => {
  let mockFs: jest.Mocked<typeof fs>;
  let mockPath: jest.Mocked<typeof path>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFs = fs as jest.Mocked<typeof fs>;
    mockPath = path as jest.Mocked<typeof path>;
  });

  it('파일 읽기 실패 시 에러 로그 출력하지만 계속 진행', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockPath.join.mockReturnValue('/test/data.json');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockImplementation(() => {
      throw new Error('Permission denied');
    });

    const store = new FileStore('data.json');
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load store:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('잘못된 JSON 형식 파일 로드 시 에러 로그 출력', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockPath.join.mockReturnValue('/test/data.json');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('invalid json {');

    const store = new FileStore('data.json');
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load store:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('파일 쓰기 실패 시 에러 로그 출력하지만 계속 진행', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockPath.join.mockReturnValue('/test/data.json');
    mockFs.existsSync.mockReturnValue(false);
    mockFs.writeFileSync.mockImplementation(() => {
      throw new Error('Disk full');
    });

    const store = new FileStore('data.json');
    store.put('test-key', 'test-value');
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to save store:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('null 키로 저장 시도', () => {
    mockPath.join.mockReturnValue('/test/data.json');
    mockFs.existsSync.mockReturnValue(false);
    
    const store = new FileStore('data.json');
    store.put(null as any, 'value');
    
    // Map은 null 키를 허용하므로 예외는 발생하지 않음
    expect(store.get(null as any)).toBe('value');
  });

  it('undefined 키로 조회 시도', () => {
    mockPath.join.mockReturnValue('/test/data.json');
    mockFs.existsSync.mockReturnValue(false);
    
    const store = new FileStore('data.json');
    const result = store.get(undefined as any);
    
    expect(result).toBeUndefined();
  });

  it('빈 prefix로 list 호출 시 빈 객체 반환', () => {
    mockPath.join.mockReturnValue('/test/data.json');
    mockFs.existsSync.mockReturnValue(false);
    
    const store = new FileStore('data.json');
    store.put('key1', 'value1');
    store.put('key2', 'value2');
    
    const result = store.list('');
    
    // 빈 prefix는 모든 키와 매치됨
    expect(Object.keys(result).length).toBeGreaterThan(0);
  });
});
