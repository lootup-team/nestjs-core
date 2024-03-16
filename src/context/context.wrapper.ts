import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { Observable } from 'rxjs';
import { ContextManager } from './context.manager';
import { MODULE_OPTIONS_TOKEN } from './context.module-builder';
import { ContextModuleOptions } from './context.options';

@Injectable()
export class ContextWrapper implements NestMiddleware, NestMiddleware {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly context: ContextManager,
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly options: ContextModuleOptions,
  ) {
    if (!options.enableDebugLogs) {
      this.logger.debug = () => null;
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.debug('Context was initialized');
    const { middlewareSetup: mountMiddleware = () => null } = this.options;
    const store = this.context.getStoreOrDefault();
    mountMiddleware(store, req);
    this.context.run(store, async () => next());
    res.on('finish', () => {
      this.context.destroy();
      this.logger.debug('Context was cleared');
    });
  }

  intercept(
    executionContext: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    if (this.context.isActive()) {
      return next.handle();
    }
    this.logger.debug('Context was initialized');
    const { interceptorSetup: mountInterceptor = () => null } = this.options;
    const store = this.context.getStoreOrDefault();
    mountInterceptor(store, executionContext);
    return new Observable((subscriber) => {
      this.context.run(store, async () =>
        next
          .handle()
          .pipe()
          .subscribe({
            next: (d) => subscriber.next(d),
            complete: () => {
              this.context.destroy();
              return subscriber.complete();
            },
            error: (e) => {
              e.context = new Map(store);
              this.context.destroy();
              this.logger.debug('Context was cleared');
              return subscriber.error(e);
            },
          }),
      );
    });
  }
}
