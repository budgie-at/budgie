import { getSignFromEntryType } from '../../transaction-entry/util/get-sign-from-entry-type.util';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { BaseTransferTransactionCreateEntitySchema } from './base-transfer-transaction-create-entity.schema';

export const TransferAssetTransactionCreateEntitySchema = BaseTransferTransactionCreateEntitySchema.superRefine(
    ({ entries, exchangeRate }, context) => {
        if (exchangeRate !== 1) {
            context.addIssue({
                code: 'custom',
                path: ['exchangeRate'],
                message: 'transfer asset transaction exchange rate must be equal to 1'
            });

            return;
        }

        const totalSignedMicroUnits = entries.reduce((acc, curr) => {
            const signedValue = getSignFromEntryType(curr.type) * curr.amount;

            return acc + signedValue;
        }, 0);

        if (Math.abs(totalSignedMicroUnits) > TOLERANCE_MICRO) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: `entries do not balance (micro): total signed = ${totalSignedMicroUnits} (must be 0±${TOLERANCE_MICRO})`
            });
        }
    }
);
