export interface IStore {
  put(key: string, value: any): void;
  get(key: string): any;
  list(prefix: string): Record<string, any>;
  delete(key: string): void;
}
