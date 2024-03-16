import { Injectable } from '@nestjs/common';
import { ContextManager } from './context.manager';

@Injectable()
export class ContextService {
  constructor(private readonly context: ContextManager) {}

  /**
   * Retrieves a previously stored value under the specified key.
   */
  get<T>(key: string, strict = false): T {
    const store = strict
      ? this.context.getStore()
      : this.context.getStoreOrDefault();
    return store.get(key);
  }

  /**
   * Stores a given value under a given key. This method
   * is not collision free, be sure to have unique keys.
   */
  set<T>(key: string, value: T): void {
    const store = this.context.getStore();
    store.set(key, value);
  }
}
