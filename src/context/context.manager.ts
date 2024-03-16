import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class ContextManager {
  private readonly context = new AsyncLocalStorage<Map<string, any>>();

  isActive() {
    return Boolean(this.context.getStore());
  }

  getStore(): Map<string, any> {
    const store = this.context.getStore();
    if (!store) {
      throw new Error('Context is not active!');
    }
    return store;
  }

  getStoreOrDefault(): Map<string, any> {
    return this.context.getStore() ?? new Map<string, any>();
  }

  destroy() {
    const store = this.context.getStore();
    store?.clear();
  }

  run(store: Map<string, any>, callback: () => void) {
    this.context.run(store, callback);
  }
}
