import { TransactionEntryTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { MccEntryLikeInterface } from '../interface/mcc-entry-like.interface';

export const resolveRuleMccCode = (entries: readonly MccEntryLikeInterface[]): string | null => {
    let fallbackMcc: string | null = null;

    for (const entry of entries) {
        const mcc = entry.mccCode ?? entry.mccCategory?.mcc ?? null;

        if (isDefined(mcc)) {
            if (entry.type !== TransactionEntryTypeEnum.FEE) {
                return mcc;
            }

            if (!isDefined(fallbackMcc)) {
                fallbackMcc = mcc;
            }
        }
    }

    return fallbackMcc;
};
