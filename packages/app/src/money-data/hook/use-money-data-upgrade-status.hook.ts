import { MoneyDataUpgradeService } from '@budgie/ledger';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Stream from 'effect/Stream';
import { useEffect } from 'react';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { appAtomRuntime, appRuntime } from '../../@generic/runtime/app.runtime';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
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
    const runtimeSnapshot = AsyncResult.getOrElse(useAtomValue(moneyDataUpgradeProgressAtom), () => EMPTY_RUNTIME_SNAPSHOT);

    useEffect(() => {
        void appRuntime
            .runPromise(
                Effect.flatMap(MoneyDataUpgradeService, moneyDataUpgradeService =>
                    moneyDataUpgradeService.refreshSnapshot(t`Base instrument not found`)
                )
            )
            .catch((error: unknown) => {
                showErrorToast(t`Historical valuation failed`, getErrorMessage(error));
            });
    }, [t]);

    const snapshot: MoneyDataUpgradeStatusSnapshotInterface = {
        title: t`Value Historical Entries`,
        statusText: buildMoneyDataUpgradeStatusText(runtimeSnapshot),
        percent: calculatePercent(runtimeSnapshot.processedEntryCount, runtimeSnapshot.totalEntryCount),
        state: getState(runtimeSnapshot)
    };

    const handlePrimaryAction = async () => {
        const confirmed = await confirmAlert({
            title: t`Value historical entries?`,
            message: t`Budgie will fill missing base-currency values from historical exchange rates. Analytics may be unavailable until this finishes.`,
            confirmText: t`Value entries`,
            cancelText: t`Cancel`
        });

        if (!confirmed) {
            return;
        }

        try {
            await appRuntime.runPromise(
                Effect.flatMap(MoneyDataUpgradeService, moneyDataUpgradeService =>
                    moneyDataUpgradeService.run(t`Base instrument not found`)
                )
            );
        } catch (error: unknown) {
            showErrorToast(t`Historical valuation failed`, getErrorMessage(error));
        }
    };

    return { snapshot, handlePrimaryAction };
};
