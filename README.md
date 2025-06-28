## Description

Seamless asynchronous local storage management using the NodeJS Async Local Storage. This package is designed as a core component for the `gedai` project (currently supported by the `lootup` project), and offers plug-and-play functionality, empowering developers to effortlessly integrate asynchronous local storage into their applications.

## Why was this fork created?
This package was originally developed by [gedai](https://github.com/gedai-dev), however he stopped maintaining it and so this fork was created. This repo may have improvements/changes in the future.

## Getting Started

### Step 1: Installation

Install the necessary packages with your favorite Package Manager.

```bash
$ npm install @lootupteam/nestjs-core
```

### Step 2: Configuration Setup

In your `app.module.ts` import `ContextModule` and set it up.

```typescript
// app.module.ts
import { ContextModule } from '@lootupteam/nestjs-core';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Setup Context Module Here
    ContextModule.forRoot({}),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

In `main.ts` import the apply the required configuration with `configureContextWrapper`.

```typescript
// main.ts
import { configureContextWrappers } from '@lootupteam/nestjs-core';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
    // Setup Context Wrappers Here
    .then(configureContextWrappers);

  await app.listen(3000);
}
bootstrap();
```

## Step 3: Usage

In your services, add `ContextService` as an injectable dependency.

```typescript
// app.service.ts
import { ContextService } from '@lootupteam/nestjs-core';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // Injected here
  constructor(private readonly context: ContextService) {}

  getHello(): string {
    // Recover any previously set property
    const contextId = this.context.getId();
    return `[${contextId}]: Hello World!`;
  }
}
```

## Important Consideration Regarding AsyncLocalStorage and Continuation Passing Style

Implementing continuation passing style introduces complexity to systems. While it's a viable method for data sharing across layers and components, exercising caution is paramount. It's remarkably easy to lose oversight of stored data within the context, potentially leading to bugs or leaks.

### Potential Use Cases:

- **Tracking Execution Context**: Utilize to share a traceId throughout the request lifecycle, facilitating seamless monitoring and debugging.
- **Automatically Managing Database Transactions**: Implement for streamlined transaction handling, ensuring data integrity and consistency. Ability to handle the transactions without touching the business layers.
- **Tracking Tenant Shard ID**: Employ for efficient tracking and management of tenant-specific data shards, enhancing multi-tenancy support and scalability without having to pass properties everywhere in your code.

## License

@lootupteam/nestjscore is [MIT licensed](LICENSE).
