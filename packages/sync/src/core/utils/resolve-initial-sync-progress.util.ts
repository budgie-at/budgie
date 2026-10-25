import { ExternalSourceEnum, SyncModeEnum } from '@budgie/contracts';
import { millisecondsInMinute, millisecondsInSecond } from 'date-fns/constants';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { MONOBANK_MAX_PERIOD_SECONDS } from '../../monobank/constant/monobank-max-period-seconds.constant';
import { MONOBANK_RATE_LIMIT_MS } from '../../monobank/constant/monobank-rate-limit-ms.constant';

import type { InitialSyncProgressInterface } from '../interface/initial-sync-progress.interface';
import type { SyncBackfillPaceInterface } from '../interface/sync-backfill-pace.interface';
import type { SyncEntityInterface } from '@budgie/contracts';

const SYNC_BACKFILL_PACE: Partial<Record<ExternalSourceEnum, SyncBackfillPaceInterface>> = {
    [ExternalSourceEnum.MONOBANK]: { periodMs: MONOBANK_MAX_PERIOD_SECONDS * millisecondsInSecond, rateLimitMs: MONOBANK_RATE_LIMIT_MS }
};
const MAX_IN_PROGRESS_PERCENT = 99;
const INDETERMINATE_PROGRESS: InitialSyncProgressInterface = { percent: null, minutesLeft: null };

const isImportingHistory = (sync: SyncEntityInterface) =>
    sync.enabled &&
    sync.mode === SyncModeEnum.BACKWARD &&
    !(isDefined(sync.backwardSyncLimitAt) && isDefined(sync.forwardSyncFromAt) && sync.backwardSyncLimitAt >= sync.forwardSyncFromAt);

const resolveBackfillWindow = ({ provider, backwardSyncFromAt, backwardSyncLimitAt, forwardSyncFromAt }: SyncEntityInterface) => {
    const pace = SYNC_BACKFILL_PACE[provider];
    if (!isDefined(pace) || !isDefined(backwardSyncLimitAt) || !isDefined(forwardSyncFromAt)) {
        return null;
    }

    const limitMs = backwardSyncLimitAt.getTime();
    const remainingMs = Math.max(0, (backwardSyncFromAt ?? forwardSyncFromAt).getTime() - limitMs);

    return {
        totalMs: forwardSyncFromAt.getTime() - limitMs,
        remainingMs,
        remainingWaitMs: Math.ceil(remainingMs / pace.periodMs) * pace.rateLimitMs
    };
};

export const resolveInitialSyncProgress = (syncs: ReadonlyArray<SyncEntityInterface | null>): InitialSyncProgressInterface | null => {
    const importingSyncs = syncs.filter(isDefined).filter(isImportingHistory);
    if (!isNotEmptyArray(importingSyncs)) {
        return null;
    }

    const windows = importingSyncs.map(resolveBackfillWindow);
    if (!windows.every(isDefined)) {
        return INDETERMINATE_PROGRESS;
    }

    const sumOf = (key: keyof (typeof windows)[number]) => windows.reduce((sum, window) => sum + window[key], 0);
    const totalMs = sumOf('totalMs');

    return {
        percent: Math.min(MAX_IN_PROGRESS_PERCENT, Math.floor(((totalMs - sumOf('remainingMs')) / totalMs) * 100)),
        minutesLeft: Math.max(1, Math.ceil(sumOf('remainingWaitMs') / millisecondsInMinute))
    };
};
