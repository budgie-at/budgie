import { isDefined } from '@rnw-community/shared';

import { PRECISION } from '../../generic/constant/precision.constant';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { getTotalSignedEntryMicroUnits } from '../util/get-total-signed-entry-micro-units.util';

import { BaseTransferTransactionCreateEntitySchema } from './base-transfer-transaction-create-entity.schema';

export const SellAssetTransactionCreateEntitySchema = BaseTransferTransactionCreateEntitySchema.superRefine(
    ({ entries, exchangeRate, fromAccountId }, context) => {
        if (exchangeRate === 1) {
            context.addIssue({
                code: 'custom',
                path: ['exchangeRate'],
                message: 'sell asset transaction exchange rate must not be equal to 1'
            });

            return;
        }

        if (!isDefined(fromAccountId)) {
            return;
        }

        const rateScaled = Math.round(exchangeRate * PRECISION);

        const convertFromToToMicroUnits = (amountMicroUnits: number, rateScaled: number) =>
            Math.round((amountMicroUnits * PRECISION) / rateScaled);

        const totalSignedToMicroUnits = getTotalSignedEntryMicroUnits(entries, fromAccountId, rateScaled, convertFromToToMicroUnits);

        if (Math.abs(totalSignedToMicroUnits) > TOLERANCE_MICRO) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: `entries do not balance (micro): total signed TO = ${totalSignedToMicroUnits} (must be 0±${TOLERANCE_MICRO})`
            });
        }
    }
);
