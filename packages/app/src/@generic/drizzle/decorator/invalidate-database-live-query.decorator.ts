import { isDefined } from '@rnw-community/shared';

import { databaseLiveQueryRevisionStore } from '../store/database-live-query-revision.store';

export function InvalidateDatabaseLiveQuery(shouldInvalidate?: (...args: unknown[]) => boolean) {
    return function <This, Args extends unknown[], Result>(
        _target: object,
        _propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<(this: This, ...args: Args) => Promise<Result>>
    ): void {
        const originalMethod = descriptor.value;

        if (!isDefined(originalMethod)) {
            return;
        }

        descriptor.value = async function (this: This, ...args: Args): Promise<Result> {
            const result = await originalMethod.call(this, ...args);

            if (shouldInvalidate?.(...args) ?? true) {
                databaseLiveQueryRevisionStore.notifyChanged();
            }

            return result;
        };
    };
}
