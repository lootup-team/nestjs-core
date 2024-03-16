## Description

Core package providing out of the box working implementation for using async local storage with NestJS in both RPC and TPC manners.

## Installation

```bash
$ npm install @gedai/core
```

## Running the app

### Step 1:

Import the required module and create the specific setup for your needs. These setup functions are completely optional and allow for customization of the initialization process.

For HTTP apps use the middlewareSetup which applies globally to all routes, for Nest's Microservices use the interceptorSetup which will also apply globally, but as an interceptor since microservices don't have the middlewares layer. If you are working with a hybrid application, you can setup both methods and Context Module will automatically determine which is better for each execution context.

```typescript
// app.module.ts
import { ContextModule } from '@gedai/core';
import { Module } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
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

### Step 2:

Apply global wide configuration in main.ts

```typescript
// app.module.ts
import { configureContextWrappers } from '@gedai/core';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureContextWrappers(app);
  await app.listen(3000);
}
bootstrap();
```

## Step 3:

You can now use the ContextService to get any values that have been previously stored or event set new ones.

```typescript
// app.service.ts
import { ContextService } from '@gedai/core';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly context: ContextService) {}

  getHello(): string {
    const traceId = this.context.get<string>('traceId');
    return `[${traceId}]: Hello World!`;
  }
}
```

## Quick note about AsyncLocalStorage and Continuation Passing Style

Continuation passing style can bring a lot of complexity to systems. Although it is safe to use this method to share data accross layers and components, it should be done with caution. It is very easy to lose track of what data is being stored in the context, therefore business related data should never be passed around using this technique. On the other hand, this feature can serve metadata usecases with great easy and power.

### Potential Use Cases:

- Tracking Execution Context (share a traceId thorugh the request)
- Managing Database Transactions

## License

Gedai is [MIT licensed](LICENSE).
