import { createLogDecorator } from '@rnw-community/log-decorator';

import { isLoggingEnabled } from './is-logging-enabled.util';

import type { LogTransportInterface } from '@rnw-community/log-decorator';

export const consoleTransport: LogTransportInterface = {
    debug: (message, logContext) => {
        if (!isLoggingEnabled()) {
            return;
        }
        // eslint-disable-next-line no-console -- Routed log sink
        console.debug(`[${logContext}]`, message);
    },
    error: (message, error, logContext) => {
        if (!isLoggingEnabled()) {
            return;
        }
        // eslint-disable-next-line no-console -- Routed log sink
        console.error(`[${logContext}]`, message, error);
    },
    log: (message, logContext) => {
        if (!isLoggingEnabled()) {
            return;
        }
        // eslint-disable-next-line no-console -- Routed log sink
        console.log(`[${logContext}]`, message);
    }
};

export const Log: ReturnType<typeof createLogDecorator> = createLogDecorator({ transport: consoleTransport });
