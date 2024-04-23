import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WinstonModule,
  WinstonModuleOptions,
  utilities as nestWinstonUtils,
} from 'nest-winston';
import { config, format, transports } from 'winston';
import { Context } from '../context/context.model';
import { ContextService } from '../context/context.service';
import { Anonymizer, RegExpAnonymizer } from './anonymizer';
import { configureHttpInspectorInbound } from './http-inspector-inbound.middleware';
import { configureHttpInspectorOutbound } from './http-inspector-outbound.interceptor';
import { configureOutboundHttpTracingPropagation } from './http-tracing-propagation.interceptor';
import { configureExceptionLogger } from './log-exception.filter';

let contextService: ContextService;
let anonymizer: Anonymizer;
let env: string;
let serviceName: string;

const { Console } = transports;
const { combine, timestamp, json } = format;
const { nestLike } = nestWinstonUtils.format;

const contextify = format((info) => {
  const context: Context = info.error?.context ?? contextService.getContext();
  const contextId = context.getId();
  return { ...info, contextId };
});

const commonSensitiveKeys = [
  /authorization/i,
  /password/i,
  /access.*token/i,
  /client.*secret/i,
  /.*api.*key/i,
];

let extraSensitiveKeys: (string | RegExp)[];

const sensitive = () =>
  format((info) => {
    const anonymized = anonymizer.maskFields(info, [
      ...(extraSensitiveKeys ?? []),
      ...commonSensitiveKeys,
    ]);
    return anonymized;
  })();

const environment = () =>
  format((info) => {
    return { ...info, env };
  })();

const service = () =>
  format((info) => {
    return { ...info, service: serviceName };
  })();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const treatError = format(({ stack: _stack, ...info }) => {
  if (!info.error) {
    return info;
  }

  const { error } = info;
  const res = error.response;

  const response = res
    ? { response: { status: res.status, data: res.data } }
    : {};

  return {
    ...info,
    error: { message: error.message, stack: error.stack, ...response },
  };
});

const remoteFormat = () =>
  combine(
    timestamp(),
    environment(),
    service(),
    contextify(),
    treatError(),
    sensitive(),
    json(),
  );

const localFormat = () =>
  combine(
    timestamp(),
    environment(),
    service(),
    contextify(),
    treatError(),
    sensitive(),
    nestLike(serviceName),
  );

export type LoggerOptions = {
  silent?: boolean;
  anonymizer?: Anonymizer;
  anonymizeKeys?: (string | RegExp)[];
};

export const configureLogger =
  (options?: LoggerOptions) => (app: INestApplication) => {
    const {
      anonymizer: _anonymizer = new RegExpAnonymizer(),
      silent = false,
      anonymizeKeys,
    } = options || {};
    const configService = app.get(ConfigService);
    contextService = app.get(ContextService);
    extraSensitiveKeys = anonymizeKeys;
    anonymizer = _anonymizer;

    const [_env, appName, logLevel, httpInspection, logFormat] = [
      configService.get('NODE_ENV', 'production'),
      configService.get('SERVICE_NAME', 'nest-app'),
      configService.get('LOG_LEVEL', 'info'),
      configService.get('INSPECT_HTTP_TRAFFIC', 'all'),
      configService.get('LOG_FORMAT', 'json'),
    ];
    const useLocalFormat = logFormat === 'pretty';
    env = _env;
    serviceName = appName;
    const loggerConfig: WinstonModuleOptions = {
      silent,
      levels: config.npm.levels,
      level: logLevel,
      format: useLocalFormat ? localFormat() : remoteFormat(),
      transports: [new Console()],
    };
    const logger = WinstonModule.createLogger(loggerConfig);
    app.useLogger(logger);
    configureExceptionLogger(app);
    configureOutboundHttpTracingPropagation(app);
    if (['all', 'inbound'].includes(httpInspection)) {
      configureHttpInspectorInbound(app);
    }
    if (['all', 'outbound'].includes(httpInspection)) {
      configureHttpInspectorOutbound(app);
    }
    Logger.log('Logger initialized', 'GedaiConfig');
    return app;
  };
