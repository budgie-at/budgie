import { createLogDecorator } from '@rnw-community/log-decorator';
import { isDefined } from '@rnw-community/shared';


import { LoggerNamespaceEnum } from '../../enum/logger-namespace.enum';

import { buildLogTag, consoleTransport } from './console-transport.util';

import type { ErrorLogInputType, GetResultType, PostLogInputType, PreLogInputType } from '@rnw-community/log-decorator';

// Explicit type annotation avoids TS2742 "cannot be named without reference to private package"
const BaseLog: ReturnType<typeof createLogDecorator> = createLogDecorator({ transport: consoleTransport });

const prefixPreTag = <TArgs extends readonly unknown[]>(
    namespace: LoggerNamespaceEnum,
    tag: PreLogInputType<TArgs>
): PreLogInputType<TArgs> => {
    if (typeof tag === 'string') {
        return buildLogTag(namespace, tag);
    }

    return (...args: TArgs) => buildLogTag(namespace, tag(...args));
};

const prefixPostTag = <TArgs extends readonly unknown[], TResult>(
    namespace: LoggerNamespaceEnum,
    tag: PostLogInputType<TArgs, TResult> | undefined
): PostLogInputType<TArgs, TResult> | undefined => {
    if (!isDefined(tag)) {
        return tag;
    }
    if (typeof tag === 'string') {
        return buildLogTag(namespace, tag);
    }

    return (result: TResult, ...args: TArgs) => buildLogTag(namespace, tag(result, ...args));
};

const prefixErrorTag = <TArgs extends readonly unknown[]>(
    namespace: LoggerNamespaceEnum,
    tag: ErrorLogInputType<TArgs> | undefined
): ErrorLogInputType<TArgs> | undefined => {
    if (!isDefined(tag)) {
        return tag;
    }
    if (typeof tag === 'string') {
        return buildLogTag(namespace, tag);
    }

    return (error: unknown, ...args: TArgs) => buildLogTag(namespace, tag(error, ...args));
};

export const Log = <TArgs extends readonly unknown[], TResult extends GetResultType<unknown>>(
    namespace: LoggerNamespaceEnum,
    preTag: PreLogInputType<TArgs>,
    postTag?: PostLogInputType<TArgs, TResult>,
    errorTag?: ErrorLogInputType<TArgs>
): ReturnType<ReturnType<typeof createLogDecorator>> =>
    BaseLog(
        prefixPreTag(namespace, preTag),
        prefixPostTag(namespace, postTag),
        prefixErrorTag(namespace, errorTag)
    );
