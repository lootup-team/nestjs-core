export enum ContextKeys {
  ContextId = '__ContextId__',
  CorrelationId = '__CorrelationId__',
}

export class Context {
  constructor(private readonly state: Map<string, any>) {}

  /**
   * Creates a new context object
   */
  static createNew() {
    const state = new Map<string, any>();
    const context = new Context(state);
    return context;
  }

  /**
   * Creates a clone of the existing context object
   */
  static clone(context: Context) {
    return new Context(new Map(context.state));
  }

  /**
   * Get the context id
   */
  getId() {
    return this.get<string>(ContextKeys.ContextId);
  }

  /**
   * Get the context id
   */
  setId(id: string) {
    return this.state.set(ContextKeys.ContextId, id);
  }

  /**
   * Get the context id
   */
  getCorrelationId() {
    return this.get<string>(ContextKeys.CorrelationId);
  }

  /**
   * Get the context id
   */
  setCorrelationId(id: string) {
    return this.state.set(ContextKeys.CorrelationId, id);
  }

  /**
   * Retrieves value under a given key
   */
  get<T>(key: string): T {
    return this.state.get(key);
  }

  /**
   * Stores a given value under a given key. This method
   * is not collision free, be sure to have unique keys.
   */
  set<T>(key: string, value: T): void {
    this.state.set(key, value);
  }

  /**
   * Deletes all keys in the context
   */
  clear() {
    this.state.clear();
  }
}
