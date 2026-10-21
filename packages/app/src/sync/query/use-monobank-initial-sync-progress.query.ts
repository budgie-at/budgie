import { AccountEntityTable, ExternalSourceEnum, SyncEntityTable, SyncRepository } from '@budgie/contracts';
import { MONOBANK_MAX_PERIOD_SECONDS, MONOBANK_RATE_LIMIT_MS } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

import type { MonobankInitialSyncProgressInterface } from '../interface/monobank-initial-sync-progress.interface';
import type { MonobankInitialSyncWindowInterface } from '../interface/monobank-initial-sync-window.interface';
import type { SyncEntityInterface } from '@budgie/contracts';

const MILLISECONDS_PER_SECOND = 1000;
const MONOBANK_MAX_PERIOD_MS = MONOBANK_MAX_PERIOD_SECONDS * MILLISECONDS_PER_SECOND;
const FULL_PERCENT = 100;
const MAX_IN_PROGRESS_PERCENT = 99;

const resolveInitialSyncWindow = (
    sync: Pick<SyncEntityInterface, 'backwardSyncFromAt' | 'backwardSyncLimitAt' | 'forwardSyncFromAt'>
): MonobankInitialSyncWindowInterface | null => {
    const { backwardSyncFromAt, backwardSyncLimitAt, forwardSyncFromAt } = sync;
    if (!isDefined(backwardSyncLimitAt) || !isDefined(forwardSyncFromAt)) {
        return null;
    }

    const limitMs = backwardSyncLimitAt.getTime();
    const totalMs = forwardSyncFromAt.getTime() - limitMs;
    if (!isPositiveNumber(totalMs)) {
        return null;
    }

    const cursorMs = (backwardSyncFromAt ?? forwardSyncFromAt).getTime();

    return { totalMs, remainingMs: Math.min(totalMs, Math.max(0, cursorMs - limitMs)) };
};

const resolveInitialSyncProgress = (syncs: SyncEntityInterface[]): MonobankInitialSyncProgressInterface | null => {
    const windows = syncs.map(resolveInitialSyncWindow).filter(isDefined);
    if (!isNotEmptyArray(windows)) {
        return null;
    }

    const totalMs = windows.reduce((sum, window) => sum + window.totalMs, 0);
    const remainingMs = windows.reduce((sum, window) => sum + window.remainingMs, 0);
    const remainingRequests = windows.reduce((sum, window) => sum + Math.ceil(window.remainingMs / MONOBANK_MAX_PERIOD_MS), 0);

    return {
        percent: Math.min(MAX_IN_PROGRESS_PERCENT, Math.floor(((totalMs - remainingMs) / totalMs) * FULL_PERCENT)),
        etaSeconds: (remainingRequests * MONOBANK_RATE_LIMIT_MS) / MILLISECONDS_PER_SECOND
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
