import { LoggerNamespaceEnum } from '../../enum/logger-namespace.enum';

import type { LogTransportInterface } from '@rnw-community/log-decorator';

// eslint-disable-next-line no-underscore-dangle -- React Native global injected by Metro bundler
declare const __DEV__: boolean | undefined;

const isDevBuild = (): boolean => (typeof __DEV__ === 'undefined' ? true : __DEV__);

export const buildLogTag = (namespace: LoggerNamespaceEnum, tag: string): string => `[${namespace}] ${tag}`;

export const consoleTransport: LogTransportInterface = {
    debug: (message, logContext) => {
        if (!isDevBuild()) {
            return;
        }
        // eslint-disable-next-line no-console -- Routed log sink (preserves prior aiLog/bankSyncLog behavior)
        console.debug(message, logContext);
    },
    error: (message, error, logContext) => {
        // eslint-disable-next-line no-console -- Routed log sink (errors always emitted)
        console.error(message, error, logContext);
    },
    log: (message, logContext) => {
        if (!isDevBuild()) {
            return;
        }
        // eslint-disable-next-line no-console -- Routed log sink (preserves prior aiLog/bankSyncLog behavior)
        console.log(message, logContext);
    }
};
