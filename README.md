## Description

Core package providing out of the box working implementation for using Async Local Storage with NestJS in both RPC and TPC manners. It also provides a single dependency package that comprises common utilities that most services require. For a complete list of features take a look at [features](#features) section.

## Getting Started

### Step 1: Installation

```bash
$ npm install @gedai/core
```

### Step 2: The Setup

Import the required module and create the specific setup for your needs (http/rpc/both). These setup functions are completely optional and allow for customization of the initialization process.

For HTTP apps use the middlewareSetup which applies globally to all routes, for Nest's Microservices use the interceptorSetup which will also apply globally, but as an interceptor since microservices don't have the middlewares lifecycle. If you are working with a hybrid application, you can setup both methods and Context Module will automatically determine which is better for each execution context.

```typescript
// app.module.ts
import { ContextModule } from '@gedai/core';
import { Module } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // <<-- Setup Context Module Here -->>
    ContextModule.forRoot({
      middlewareSetup: (store, req) => {
        const traceId = req.get('x-trace-id') || randomUUID();
        store.set('traceId', traceId);
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Apply global wide configuration in main.ts

```typescript
// main.ts
import { configureContextWrappers } from '@gedai/core';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // <<-- Setup Context Wrappers Here -->>
  configureContextWrappers(app);
  await app.listen(3000);
}
bootstrap();
```

## Step 3:

You can now use the ContextService to get any values that have been previously stored or even set new ones as needed.

```typescript
// app.service.ts
import { ContextService } from '@gedai/core';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // <<-- Injected here -->>
  constructor(private readonly context: ContextService) {}

  getHello(): string {
    // <<-- Used here -->>
    const traceId = this.context.get<string>('traceId');
    return `[${traceId}]: Hello World!`;
  }
}
```

## Quick note about AsyncLocalStorage and Continuation Passing Style

Continuation passing style can bring a lot of complexity to systems. Although it is safe to use this method to share data accross layers and components, it should be done with caution. It is very easy to lose track of what data is being stored in the context and even introduce bugs or leaks.

### Potential Use Cases:

- Tracking Execution Context (share a traceId through the request lifecycle)
- Automatically Managing Database Transactions
- Tracking tenant shard id

## License

Gedai is [MIT licensed](LICENSE).
