import { AccountEntityTable, ExternalSourceEnum, SyncEntityTable, SyncRepository } from '@budgie/contracts';
import { MONOBANK_MAX_PERIOD_SECONDS, MONOBANK_RATE_LIMIT_MS } from '@budgie/sync';
import { millisecondsInMinute, millisecondsInSecond } from 'date-fns/constants';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

import type { MonobankInitialSyncProgressInterface } from '../interface/monobank-initial-sync-progress.interface';
import type { SyncEntityInterface } from '@budgie/contracts';

const MONOBANK_MAX_PERIOD_MS = MONOBANK_MAX_PERIOD_SECONDS * millisecondsInSecond;
const MAX_IN_PROGRESS_PERCENT = 99;

const resolveInitialSyncWindow = ({ backwardSyncFromAt, backwardSyncLimitAt, forwardSyncFromAt }: SyncEntityInterface) => {
    if (!isDefined(backwardSyncLimitAt) || !isDefined(forwardSyncFromAt) || backwardSyncLimitAt >= forwardSyncFromAt) {
        return null;
    }

    const limitMs = backwardSyncLimitAt.getTime();
    const remainingMs = Math.max(0, (backwardSyncFromAt ?? forwardSyncFromAt).getTime() - limitMs);

    return {
        totalMs: forwardSyncFromAt.getTime() - limitMs,
        remainingMs,
        remainingRequests: Math.ceil(remainingMs / MONOBANK_MAX_PERIOD_MS)
    };
};

const resolveInitialSyncProgress = (syncs: SyncEntityInterface[]): MonobankInitialSyncProgressInterface | null => {
    const windows = syncs.map(resolveInitialSyncWindow).filter(isDefined);
    if (!isNotEmptyArray(windows)) {
        return null;
    }

    const sumOf = (key: keyof (typeof windows)[number]) => windows.reduce((sum, window) => sum + window[key], 0);
    const totalMs = sumOf('totalMs');

    return {
        percent: Math.min(MAX_IN_PROGRESS_PERCENT, Math.floor(((totalMs - sumOf('remainingMs')) / totalMs) * 100)),
        minutesLeft: Math.max(1, Math.ceil((sumOf('remainingRequests') * MONOBANK_RATE_LIMIT_MS) / millisecondsInMinute))
    };
};

const monobankInitialSyncProgressAtom = databaseQueryAtom(
    [SyncEntityTable, AccountEntityTable],
    Effect.flatMap(SyncRepository, syncRepository => syncRepository.getPendingBackwardSync(ExternalSourceEnum.MONOBANK)).pipe(
        Effect.map(resolveInitialSyncProgress)
    )
);

export const useMonobankInitialSyncProgressQuery = (): MonobankInitialSyncProgressInterface | null =>
    AsyncResult.getOrElse(useLiveAtomValue(monobankInitialSyncProgressAtom), () => null);
