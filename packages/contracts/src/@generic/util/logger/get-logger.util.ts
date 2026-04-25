import { consoleTransport } from './console-transport.util';

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

const buildMessage = (tag: string, payload?: unknown): string => (payload === undefined ? tag : `${tag} ${serializePayload(payload)}`);

export const getLogger = (context: string): NamespacedLoggerInterface => ({
    debug: (tag, payload) => {
        consoleTransport.debug(buildMessage(tag, payload), context);
    },
    error: (tag, error) => {
        consoleTransport.error(tag, error, context);
    },
    log: (tag, payload) => {
        consoleTransport.log(buildMessage(tag, payload), context);
    }
});
