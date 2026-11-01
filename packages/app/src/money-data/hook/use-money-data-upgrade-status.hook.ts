import { MoneyDataUpgradeService } from '@budgie/ledger';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Stream from 'effect/Stream';
import { useEffect } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { appAtomRuntime, appRuntime } from '../../@generic/runtime/app.runtime';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { MoneyDataUpgradeProgressStateEnum } from '../enum/money-data-upgrade-progress-state.enum';
import { MoneyDataUpgradeStatusSnapshotInterface } from '../interface/money-data-upgrade-status-snapshot.interface';
import { buildMoneyDataUpgradeStatusText } from '../utils/build-money-data-upgrade-status-text.util';

import type { MoneyDataUpgradeRuntimeSnapshotInterface } from '@budgie/ledger';

const EMPTY_RUNTIME_SNAPSHOT: MoneyDataUpgradeRuntimeSnapshotInterface = {
    isRunning: false,
    isUpdatingBalances: false,
    pendingEntryCount: 0,
    processedEntryCount: 0,
    totalEntryCount: 0,
    lastError: null
};

const moneyDataUpgradeProgressAtom = appAtomRuntime.atom(
    Stream.unwrap(Effect.map(MoneyDataUpgradeService, moneyDataUpgradeService => moneyDataUpgradeService.changes))
);

const calculatePercent = (processed: number, total: number): number => {
    if (total === 0) {
        return 100;
    }

    return Math.round((processed / total) * 100);
};

const getState = (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface): MoneyDataUpgradeProgressStateEnum => {
    if (isDefined(snapshot.lastError)) {
        return MoneyDataUpgradeProgressStateEnum.ERROR;
    }

    if (snapshot.isRunning) {
        return MoneyDataUpgradeProgressStateEnum.WORKING;
    }

    return isPositiveNumber(snapshot.pendingEntryCount)
        ? MoneyDataUpgradeProgressStateEnum.READY
        : MoneyDataUpgradeProgressStateEnum.COMPLETE;
};

export const useMoneyDataUpgradeStatus = () => {
    const { t } = useLingui();
    const runtimeResult = useAtomValue(moneyDataUpgradeProgressAtom);
    const runtimeSnapshot = AsyncResult.getOrElse(runtimeResult, () => EMPTY_RUNTIME_SNAPSHOT);

    useEffect(() => {
        const fiber = appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(MoneyDataUpgradeService, moneyDataUpgradeService =>
                    moneyDataUpgradeService.refreshSnapshot(t`Base instrument not found`)
                ).pipe(toastOnFailure(t`Could not convert past amounts`))
            )
        );

        return () => void fiber.interruptUnsafe();
    }, [t]);

    const snapshot: MoneyDataUpgradeStatusSnapshotInterface = {
        title: t`Convert past amounts`,
        statusText: buildMoneyDataUpgradeStatusText(runtimeSnapshot),
        percent: calculatePercent(runtimeSnapshot.processedEntryCount, runtimeSnapshot.totalEntryCount),
        state: AsyncResult.isInitial(runtimeResult) ? MoneyDataUpgradeProgressStateEnum.READY : getState(runtimeSnapshot)
    };

    const handlePrimaryAction = () =>
        void appRuntime.runFork(
            logAndContinue(
                Effect.gen(function* () {
                    const confirmed = yield* confirmAlert({
                        title: t`Convert past amounts?`,
                        message: t`Budgie will fill missing base-currency values from historical exchange rates. Analytics may be unavailable until this finishes.`,
                        confirmText: t`Convert`,
                        cancelText: t`Cancel`
                    });

                    if (!confirmed) {
                        return;
                    }

                    const moneyDataUpgradeService = yield* MoneyDataUpgradeService;

                    yield* moneyDataUpgradeService.run(t`Base instrument not found`);
                }).pipe(toastOnFailure(t`Could not convert past amounts`))
            )
        );

    return { snapshot, handlePrimaryAction };
};
