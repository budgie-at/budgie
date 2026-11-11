import { SyncModeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { ExternalSourceEnum, SyncEntityInterface } from '@budgie/contracts';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export const isDeliveredByLiveConnection = (
    { backwardSyncLimitAt, forwardSyncFromAt, mode, provider }: SyncEntityInterface,
    importProvider: ExternalSourceEnum,
    earliestLiveAt: Date | null,
    timeSeconds: number
) => {
    const timeMs = timeSeconds * 1000;

    if (provider === importProvider) {
        return (
            isDefined(backwardSyncLimitAt) &&
            isDefined(forwardSyncFromAt) &&
            timeMs >= backwardSyncLimitAt.getTime() &&
            timeMs < forwardSyncFromAt.getTime()
        );
    }

    if (mode === SyncModeEnum.BACKWARD) {
        return timeMs >= (backwardSyncLimitAt?.getTime() ?? 0);
    }

    const deliveredFrom = earliestLiveAt ?? forwardSyncFromAt;

    return timeMs >= (isDefined(deliveredFrom) ? deliveredFrom.getTime() - (deliveredFrom.getTime() % MILLISECONDS_PER_DAY) : 0);
};
