import { Global, Module, NestModule } from '@nestjs/common';
import { ContextManager } from './context.manager';
import { ConfigurableModuleClass } from './context.module-builder';
import { ContextService } from './context.service';

@Global()
@Module({
  providers: [ContextManager, ContextService],
  exports: [ContextService],
})
export class ContextModule
  extends ConfigurableModuleClass
  implements NestModule {}
