import { INestApplication, Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ContextManager } from './context.manager';
import { MODULE_OPTIONS_TOKEN } from './context.module-builder';
import { ContextModuleOptions } from './context.options';
import { ContextWrapper } from './context.wrapper';

export const configureContextWrappers = () => (app: INestApplication) => {
  const context = app.get(ContextManager);
  const options = app.get<ContextModuleOptions>(MODULE_OPTIONS_TOKEN);
  const wrapper = new ContextWrapper(context, options);
  app.useGlobalInterceptors(wrapper);
  app.use((req: Request, res: Response, next: NextFunction) =>
    wrapper.use(req, res, next),
  );
  Logger.log(`${ContextWrapper.name} was initialized`, '@gedai/core');
  return app;
};
