import { t } from '@lingui/core/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { MoneyDataUpgradeRuntimeSnapshotInterface } from '../interface/money-data-upgrade-runtime-snapshot.interface';

export const buildMoneyDataUpgradeStatusText = (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface): string => {
    if (isDefined(snapshot.lastError)) {
        return snapshot.lastError;
    }

    if (snapshot.isUpdatingBalances) {
        return t`Recalculating balances`;
    }

    if (!snapshot.isRunning) {
        return t`Press to re-evaluate transactions`;
    }

    if (!isPositiveNumber(snapshot.totalEntryCount)) {
        return t`Preparing valuation`;
    }

    const { processedEntryCount } = snapshot;
    const { totalEntryCount } = snapshot;

    return t`Valuing ${processedEntryCount} of ${totalEntryCount} transactions`;
};
