import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestMiddleware,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { Observable } from 'rxjs';
import { ContextManager } from './context.manager';
import { Context } from './context.model';
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

  private addContextIdOrDefault(
    store: Context,
    existingId: string = randomUUID(),
  ) {
    const id = store.getId();
    if (!id) {
      store.setId(existingId);
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.debug('Context was initialized');
    const { middlewareSetup: mountMiddleware = () => null } = this.options;
    const store = this.context.getContextOrDefault();
    const id = req.get('x-context-id');
    mountMiddleware(store, req);
    this.addContextIdOrDefault(store, id);
    this.context.run(store, async () => next());
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
    const context = this.context.getContextOrDefault();
    mountInterceptor(context, executionContext);
    /** TODO: reload context id from AMQP */
    this.addContextIdOrDefault(context);
    return new Observable((subscriber) => {
      this.context.run(context, async () =>
        next
          .handle()
          .pipe()
          .subscribe({
            next: (d) => subscriber.next(d),
            complete: () => subscriber.complete(),
            error: (e) => {
              e.context = Context.clone(context);
              return subscriber.error(e);
            },
          }),
      );
    });
  }
}
