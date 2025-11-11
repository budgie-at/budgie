import { isDefined } from '@rnw-community/shared';

import { PRECISION } from '../constant/precision.constant';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { getTotalSignedEntryMicroUnits } from '../util/get-total-signed-entry-micro-units.util';

import { BaseTransferTransactionCreateEntitySchema } from './base-transfer-transaction-create-entity.schema';

export const BuyAssetTransactionCreateEntitySchema = BaseTransferTransactionCreateEntitySchema.superRefine(
    ({ entries, exchangeRate, toAccountId }, context) => {
        if (exchangeRate === 1) {
            context.addIssue({
                code: 'custom',
                path: ['exchangeRate'],
                message: 'buy asset transaction exchange rate must not be equal to 1'
            });

            return;
        }

        if (!isDefined(toAccountId)) {
            return;
        }

        const rateScaled = Math.round(exchangeRate * PRECISION);

        const convertToFromMicroUnits = (amountMicroUnits: number, rateScaled: number) =>
            Math.round((amountMicroUnits * rateScaled) / PRECISION);

        const totalSignedFromMicroUnits = getTotalSignedEntryMicroUnits(entries, toAccountId, rateScaled, convertToFromMicroUnits);

        if (Math.abs(totalSignedFromMicroUnits) > TOLERANCE_MICRO) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: `entries do not balance (micro): total signed FROM = ${totalSignedFromMicroUnits} (must be 0±${TOLERANCE_MICRO})`
            });
        }
    }
);
