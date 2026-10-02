import { isNotEmptyArray } from '@rnw-community/shared';

import type { SyncAccountInterface } from '@budgie/sync';

export const generateDefaultSyncAccountTitle = (providerTitle: string, account: SyncAccountInterface): string => {
    if (isNotEmptyArray(account.maskedPan)) {
        const lastFourDigits = account.maskedPan[0].slice(-4);

        return `${providerTitle} •${lastFourDigits}`;
    }

    return `${providerTitle} ${account.currencyCode}`;
};
