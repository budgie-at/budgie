import { createLogDecorator } from '@rnw-community/log-decorator';

let loggingEnabled = true;

export const disableLogging = (): void => {
    loggingEnabled = false;
};

export const consoleTransport = {
    debug: (message: string, logContext: string) => {
        if (!loggingEnabled) {
            return;
        }
        // eslint-disable-next-line no-console -- Routed log sink
        console.debug(`[${logContext}]`, message);
    },
    error: (message: string, error: unknown, logContext: string) => {
        if (!loggingEnabled) {
            return;
        }
        // eslint-disable-next-line no-console -- Routed log sink
        console.error(`[${logContext}]`, message, error);
    },
    log: (message: string, logContext: string) => {
        if (!loggingEnabled) {
            return;
        }
        // eslint-disable-next-line no-console -- Routed log sink
        console.log(`[${logContext}]`, message);
    }
};

export const Log = createLogDecorator({ transport: consoleTransport });
