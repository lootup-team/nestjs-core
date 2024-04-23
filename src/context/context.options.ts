import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Context } from './context.model';

export type ContextMiddlewareSetup = (context: Context, req: Request) => void;

export type ContextInterceptorSetup = (
  context: Context,
  executionContext: ExecutionContext,
) => void;

export type ContextModuleOptions = {
  enableDebugLogs?: boolean;
  middlewareSetup?: ContextMiddlewareSetup;
  interceptorSetup?: ContextInterceptorSetup;
};
