import { isDefined } from '@rnw-community/shared';

import { databaseRefreshService } from '../../service/database-refresh.service';

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
                // useDatabaseLiveQuery keys its deps on databaseRefreshService;
                // the previous revision store had no subscribers, so decorated
                // mutations (e.g. convert-to-transfer) never refreshed the UI.
                databaseRefreshService.notifyChanged();
            }

            return result;
        };
    };
}
