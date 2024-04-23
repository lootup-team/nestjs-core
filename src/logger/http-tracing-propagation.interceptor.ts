import { INestApplication, Logger } from '@nestjs/common';
import * as http from 'http';
import * as https from 'https';
import { ContextService } from '../context/context.service';

function appendContextIdToHeaders(
  options: http.RequestOptions,
  traceId: string,
) {
  if (!options.headers) {
    options.headers = {};
  }
  options.headers['x-context-id'] = traceId;
}

function mountTracingInterceptor(
  context: ContextService,
  module: typeof http | typeof https,
) {
  const withTraceId = (target: typeof module.get | typeof module.request) =>
    function (...args: any[]) {
      const traceId = context.getId();
      if (!traceId) {
        return target.apply(this, args);
      }
      const [urlOrOptions, optionsOrCallback, maybeCallback] = args;
      // http.get(url, options, callback)
      if (typeof urlOrOptions === 'string' && maybeCallback) {
        appendContextIdToHeaders(optionsOrCallback, traceId);
        return target.apply(this, [
          urlOrOptions,
          optionsOrCallback,
          maybeCallback,
        ]);
      }
      // http.get(url, callback)
      if (typeof urlOrOptions === 'string') {
        const options = {};
        appendContextIdToHeaders(options, traceId);
        return target.apply(this, [urlOrOptions, options, optionsOrCallback]);
      }
      // http.get(options, callback)
      appendContextIdToHeaders(urlOrOptions, traceId);
      return target.apply(this, [urlOrOptions, optionsOrCallback]);
    };
  const targets = [
    { target: module.get, name: 'get' },
    { target: module.request, name: 'request' },
  ];
  for (const { target, name } of targets) {
    const tracedTarget = withTraceId(target);
    Object.defineProperty(tracedTarget, 'name', {
      value: name,
      writable: false,
    });
    module[name] = tracedTarget;
  }
}

export const configureOutboundHttpTracingPropagation = (
  app: INestApplication,
) => {
  const context = app.get(ContextService);
  for (const module of [http, https]) {
    mountTracingInterceptor(context, module);
  }
  Logger.log('Http Tracing Propagation initialized', 'GedaiConfig');
  return app;
};
