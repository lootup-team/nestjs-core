import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export type ContextMiddlewareSetup = (
  store: Map<string, any>,
  req: Request,
) => void;

export type ContextInterceptorSetup = (
  store: Map<string, any>,
  executionContext: ExecutionContext,
) => void;

export type ContextModuleOptions = {
  enableDebugLogs?: boolean;
  middlewareSetup?: ContextMiddlewareSetup;
  interceptorSetup?: ContextInterceptorSetup;
};
