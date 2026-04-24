import { LoggerNamespaceEnum } from '../../enum/logger-namespace.enum';

import { buildLogTag, consoleTransport } from './console-transport.util';

export interface NamespacedLoggerInterface {
    readonly debug: (tag: string, payload?: unknown) => void;
    readonly error: (tag: string, error?: unknown) => void;
    readonly log: (tag: string, payload?: unknown) => void;
}

const serializePayload = (payload: unknown): string => {
    if (typeof payload === 'string') {
        return payload;
    }

    if (typeof payload === 'number' || typeof payload === 'boolean') {
        return String(payload);
    }

    return JSON.stringify(payload);
};

export const getLogger = (namespace: LoggerNamespaceEnum): NamespacedLoggerInterface => ({
    debug: (tag, payload) => {
        consoleTransport.debug(buildLogTag(namespace, tag), serializePayload(payload));
    },
    error: (tag, error) => {
        consoleTransport.error(buildLogTag(namespace, tag), error, '');
    },
    log: (tag, payload) => {
        consoleTransport.log(buildLogTag(namespace, tag), serializePayload(payload));
    }
});
