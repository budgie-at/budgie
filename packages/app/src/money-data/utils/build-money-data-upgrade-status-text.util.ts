import { t } from '@lingui/core/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { MoneyDataUpgradeRuntimeSnapshotInterface } from '@budgie/ledger';

export const buildMoneyDataUpgradeStatusText = (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface): string => {
    if (isDefined(snapshot.lastError)) {
        return t`Couldn't finish. Try again.`;
    }

    if (snapshot.isUpdatingBalances) {
        return t`Recalculating balances`;
    }

    if (!snapshot.isRunning) {
        return t`Fill missing currency conversions`;
    }

    if (!isPositiveNumber(snapshot.totalEntryCount)) {
        return t`Preparing conversions`;
    }

    const { processedEntryCount } = snapshot;
    const { totalEntryCount } = snapshot;

    return t`Converting ${processedEntryCount} of ${totalEntryCount} transactions`;
};
