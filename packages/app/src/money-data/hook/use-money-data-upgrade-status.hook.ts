import { useLingui } from '@lingui/react/macro';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { MoneyDataUpgradeProgressStateEnum } from '../enum/money-data-upgrade-progress-state.enum';
import { MoneyDataUpgradeRuntimeSnapshotInterface } from '../interface/money-data-upgrade-runtime-snapshot.interface';
import { MoneyDataUpgradeStatusSnapshotInterface } from '../interface/money-data-upgrade-status-snapshot.interface';
import { moneyDataUpgradeService } from '../service/money-data-upgrade.service';

const EMPTY_RUNTIME_SNAPSHOT: MoneyDataUpgradeRuntimeSnapshotInterface = {
    isRunning: false,
    pendingEntryCount: 0,
    processedEntryCount: 0,
    totalEntryCount: 0,
    lastError: null
};

const calculatePercent = (processed: number, total: number): number => {
    if (total === 0) {
        return 100;
    }

    return Math.round((processed / total) * 100);
};

const getState = (
    runtimeSnapshot: MoneyDataUpgradeRuntimeSnapshotInterface,
    hasPendingWork: boolean
): MoneyDataUpgradeProgressStateEnum => {
    if (isDefined(runtimeSnapshot.lastError)) {
        return MoneyDataUpgradeProgressStateEnum.ERROR;
    }

    if (runtimeSnapshot.isRunning) {
        return MoneyDataUpgradeProgressStateEnum.WORKING;
    }

    return hasPendingWork ? MoneyDataUpgradeProgressStateEnum.READY : MoneyDataUpgradeProgressStateEnum.COMPLETE;
};

const getStatusText = (
    runtimeSnapshot: MoneyDataUpgradeRuntimeSnapshotInterface,
    hasPendingWork: boolean,
    t: ReturnType<typeof useLingui>['t']
): string => {
    if (isDefined(runtimeSnapshot.lastError)) {
        return runtimeSnapshot.lastError;
    }

    if (runtimeSnapshot.isRunning) {
        return t`Valuation running`;
    }

    return hasPendingWork ? t`Base values need update` : t`Base values ready`;
};

const getPrimaryActionText = (
    runtimeSnapshot: MoneyDataUpgradeRuntimeSnapshotInterface,
    hasPendingWork: boolean,
    t: ReturnType<typeof useLingui>['t']
): string => {
    if (isDefined(runtimeSnapshot.lastError)) {
        return t`Retry`;
    }

    if (runtimeSnapshot.isRunning) {
        return t`Running`;
    }

    return hasPendingWork ? t`Value` : t`Done`;
};

export const useMoneyDataUpgradeStatus = () => {
    const { t } = useLingui();
    const [runtimeSnapshot, setRuntimeSnapshot] = useState<MoneyDataUpgradeRuntimeSnapshotInterface>(EMPTY_RUNTIME_SNAPSHOT);

    const handleProgress = useCallback((nextRuntimeSnapshot: MoneyDataUpgradeRuntimeSnapshotInterface) => {
        setRuntimeSnapshot(nextRuntimeSnapshot);
    }, []);

    useEffect(() => {
        void moneyDataUpgradeService
            .getSnapshot()
            .then(setRuntimeSnapshot)
            .catch((error: unknown) => {
                showErrorToast(t`Historical valuation failed`, getErrorMessage(error));
            });
    }, [t]);

    const snapshot = useMemo<MoneyDataUpgradeStatusSnapshotInterface>(() => {
        const percent = calculatePercent(runtimeSnapshot.processedEntryCount, runtimeSnapshot.totalEntryCount);
        const hasPendingWork = runtimeSnapshot.pendingEntryCount > 0 || runtimeSnapshot.isRunning;
        const state = getState(runtimeSnapshot, hasPendingWork);

        return {
            title: t`Value Historical Entries`,
            statusText: getStatusText(runtimeSnapshot, hasPendingWork, t),
            percent,
            state,
            primaryActionText: getPrimaryActionText(runtimeSnapshot, hasPendingWork, t)
        };
    }, [runtimeSnapshot, t]);

    const handlePrimaryAction = useCallback(async () => {
        const confirmed = await confirmAlert({
            title: t`Value historical entries?`,
            message: t`Budgie will fill missing base-currency values from historical exchange rates. Analytics may be unavailable until this finishes.`,
            confirmText: t`Value`,
            cancelText: t`Cancel`
        });

        if (!confirmed) {
            return;
        }

        try {
            setRuntimeSnapshot(await moneyDataUpgradeService.run(handleProgress));
        } catch (error: unknown) {
            showErrorToast(t`Historical valuation failed`, getErrorMessage(error));
        }
    }, [handleProgress, t]);

    return { snapshot, handlePrimaryAction };
};
