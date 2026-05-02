import { isDefined } from '@rnw-community/shared';

export const scheduleIdleCallback = (callback: () => void): (() => void) => {
    const { requestIdleCallback } = globalThis;

    if (isDefined(requestIdleCallback)) {
        const handle = requestIdleCallback(callback);

        return () => {
            globalThis.cancelIdleCallback(handle);
        };
    }

    const handle = setTimeout(callback, 0);

    return () => {
        clearTimeout(handle);
    };
};
