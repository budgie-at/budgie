import { consoleTransport, createLogDecorator } from '@rnw-community/log-decorator';
import { isDefined } from '@rnw-community/shared';

import type { ErrorLogInputType, GetResultType, PostLogInputType, PreLogInputType } from '@rnw-community/log-decorator';

const SYNC_NAMESPACE = 'SYNC';

const buildSyncTag = (tag: string): string => `[${SYNC_NAMESPACE}] ${tag}`;

const serializePayload = (payload: unknown): string => {
    if (typeof payload === 'string') {
        return payload;
    }

    if (typeof payload === 'number' || typeof payload === 'boolean') {
        return String(payload);
    }

    return JSON.stringify(payload);
};

export interface SyncLoggerInterface {
    readonly error: (tag: string, error?: unknown) => void;
    readonly log: (tag: string, payload?: unknown) => void;
}

export const syncLogger: SyncLoggerInterface = {
    error: (tag, error) => {
        consoleTransport.error(buildSyncTag(tag), error, '');
    },
    log: (tag, payload) => {
        consoleTransport.log(buildSyncTag(tag), serializePayload(payload));
    }
};

const BaseLogDecorator = createLogDecorator({ transport: consoleTransport });

const prefixPreTag = <TArgs extends readonly unknown[]>(tag: PreLogInputType<TArgs>): PreLogInputType<TArgs> => {
    if (typeof tag === 'string') {
        return buildSyncTag(tag);
    }

    return (...args: TArgs) => buildSyncTag(tag(...args));
};

const prefixPostTag = <TArgs extends readonly unknown[], TResult>(
    tag: PostLogInputType<TArgs, TResult> | undefined
): PostLogInputType<TArgs, TResult> | undefined => {
    if (!isDefined(tag)) {
        return tag;
    }

    if (typeof tag === 'string') {
        return buildSyncTag(tag);
    }

    return (result: TResult, ...args: TArgs) => buildSyncTag(tag(result, ...args));
};

const prefixErrorTag = <TArgs extends readonly unknown[]>(
    tag: ErrorLogInputType<TArgs> | undefined
): ErrorLogInputType<TArgs> | undefined => {
    if (!isDefined(tag)) {
        return tag;
    }

    if (typeof tag === 'string') {
        return buildSyncTag(tag);
    }

    return (error: unknown, ...args: TArgs) => buildSyncTag(tag(error, ...args));
};

export const SyncLog = <TArgs extends readonly unknown[], TResult extends GetResultType<unknown>>(
    preTag: PreLogInputType<TArgs>,
    postTag?: PostLogInputType<TArgs, TResult>,
    errorTag?: ErrorLogInputType<TArgs>
): ReturnType<ReturnType<typeof createLogDecorator>> =>
    BaseLogDecorator(prefixPreTag(preTag), prefixPostTag(postTag), prefixErrorTag(errorTag));
