import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { MoneyDataUpgradeProgressStateEnum } from '../enum/money-data-upgrade-progress-state.enum';
import { MoneyDataUpgradeRuntimeSnapshotInterface } from '../interface/money-data-upgrade-runtime-snapshot.interface';
import { MoneyDataUpgradeStatusSnapshotInterface } from '../interface/money-data-upgrade-status-snapshot.interface';
import { moneyDataUpgradeService } from '../service/money-data-upgrade.service';
import { buildMoneyDataUpgradeStatusText } from '../utils/build-money-data-upgrade-status-text.util';

const EMPTY_RUNTIME_SNAPSHOT: MoneyDataUpgradeRuntimeSnapshotInterface = {
    isRunning: false,
    isUpdatingBalances: false,
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
    const [runtimeSnapshot, setRuntimeSnapshot] = useState<MoneyDataUpgradeRuntimeSnapshotInterface>(EMPTY_RUNTIME_SNAPSHOT);

    useEffect(() => {
        void moneyDataUpgradeService
            .getSnapshot()
            .then(setRuntimeSnapshot)
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
            setRuntimeSnapshot(await moneyDataUpgradeService.run(setRuntimeSnapshot));
        } catch (error: unknown) {
            showErrorToast(t`Historical valuation failed`, getErrorMessage(error));
        }
    };

    return { snapshot, handlePrimaryAction };
};
