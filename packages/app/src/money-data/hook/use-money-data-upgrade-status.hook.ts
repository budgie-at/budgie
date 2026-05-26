import { useLingui } from '@lingui/react/macro';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { MoneyDataUpgradeProgressStateEnum } from '../enum/money-data-upgrade-progress-state.enum';
import { MoneyDataUpgradeStepEnum } from '../enum/money-data-upgrade-step.enum';
import { MoneyDataUpgradeRuntimeSnapshotInterface } from '../interface/money-data-upgrade-runtime-snapshot.interface';
import { MoneyDataUpgradeStatusSnapshotInterface } from '../interface/money-data-upgrade-status-snapshot.interface';
import { moneyDataUpgradeService } from '../service/money-data-upgrade.service';

const EMPTY_RUNTIME_SNAPSHOT: MoneyDataUpgradeRuntimeSnapshotInterface = {
    isRunning: false,
    pendingEntryCount: 0,
    processedEntryCount: 0,
    totalEntryCount: 0,
    consolidationRemainingCount: 0,
    consolidationTotalCount: 0,
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

const getStepState = (isRunning: boolean, percent: number): MoneyDataUpgradeProgressStateEnum => {
    if (percent === 100) {
        return MoneyDataUpgradeProgressStateEnum.COMPLETE;
    }

    return isRunning ? MoneyDataUpgradeProgressStateEnum.WORKING : MoneyDataUpgradeProgressStateEnum.READY;
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
        return t`Upgrade running`;
    }

    return hasPendingWork ? t`Upgrade available` : t`Ready`;
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

    return hasPendingWork ? t`Upgrade` : t`Done`;
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
                showErrorToast(t`Money data upgrade failed`, getErrorMessage(error));
            });
    }, [t]);

    const snapshot = useMemo<MoneyDataUpgradeStatusSnapshotInterface>(() => {
        const baseValuesPercent = calculatePercent(runtimeSnapshot.processedEntryCount, runtimeSnapshot.totalEntryCount);
        const consolidationProcessedCount = runtimeSnapshot.consolidationTotalCount - runtimeSnapshot.consolidationRemainingCount;
        const consolidationPercent = calculatePercent(consolidationProcessedCount, runtimeSnapshot.consolidationTotalCount);
        const hasPendingWork =
            runtimeSnapshot.pendingEntryCount > 0 || runtimeSnapshot.consolidationRemainingCount > 0 || runtimeSnapshot.isRunning;
        const state = getState(runtimeSnapshot, hasPendingWork);
        const percent = Math.round((baseValuesPercent + consolidationPercent) / 2);

        return {
            title: t`Money Data`,
            statusText: getStatusText(runtimeSnapshot, hasPendingWork, t),
            percent,
            state,
            primaryActionText: getPrimaryActionText(runtimeSnapshot, hasPendingWork, t),
            steps: [
                {
                    key: MoneyDataUpgradeStepEnum.HISTORICAL_RATES,
                    title: t`Historical rates`,
                    statusText: t`Ready`,
                    percent: 100,
                    state: MoneyDataUpgradeProgressStateEnum.COMPLETE
                },
                {
                    key: MoneyDataUpgradeStepEnum.BASE_VALUES,
                    title: t`Base values`,
                    statusText: `${runtimeSnapshot.processedEntryCount}/${runtimeSnapshot.totalEntryCount}`,
                    percent: baseValuesPercent,
                    state: getStepState(runtimeSnapshot.isRunning, baseValuesPercent)
                },
                {
                    key: MoneyDataUpgradeStepEnum.TRANSFER_CONSOLIDATION,
                    title: t`Transfer consolidation`,
                    statusText: `${consolidationProcessedCount}/${runtimeSnapshot.consolidationTotalCount}`,
                    percent: consolidationPercent,
                    state: getStepState(runtimeSnapshot.isRunning, consolidationPercent)
                }
            ]
        };
    }, [runtimeSnapshot, t]);

    const handlePrimaryAction = useCallback(async () => {
        const confirmed = await confirmAlert({
            title: t`Upgrade money data?`,
            message: t`Budgie will prepare historical values and transfer matching. Analytics may be unavailable until this finishes.`,
            confirmText: t`Upgrade`,
            cancelText: t`Cancel`
        });

        if (!confirmed) {
            return;
        }

        try {
            setRuntimeSnapshot(await moneyDataUpgradeService.run(handleProgress));
        } catch (error: unknown) {
            showErrorToast(t`Money data upgrade failed`, getErrorMessage(error));
        }
    }, [handleProgress, t]);

    return { snapshot, handlePrimaryAction };
};
