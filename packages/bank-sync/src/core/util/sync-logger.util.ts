import { createLogDecorator } from '@rnw-community/log-decorator';
import { isDefined } from '@rnw-community/shared';

import { isLoggingEnabled } from './is-logging-enabled.util';

import type { LogTransportInterface } from '@rnw-community/log-decorator';

const SYNC_NAMESPACE = 'SYNC';

const serializePayload = (payload: unknown): string => {
    if (typeof payload === 'string') {
        return payload;
    }

    if (typeof payload === 'number' || typeof payload === 'boolean') {
        return String(payload);
    }

    return JSON.stringify(payload);
};

const consoleTransport: LogTransportInterface = {
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

interface SyncLoggerInterface {
    readonly error: (tag: string, error?: unknown) => void;
    readonly log: (tag: string, payload?: unknown) => void;
}

export const syncLogger: SyncLoggerInterface = {
    error: (tag, error) => {
        consoleTransport.error(serializePayload(tag), error, SYNC_NAMESPACE);
    },
    log: (tag, payload) => {
        const message = isDefined(payload) ? `${tag} ${serializePayload(payload)}` : tag;
        consoleTransport.log(message, SYNC_NAMESPACE);
    }
};
