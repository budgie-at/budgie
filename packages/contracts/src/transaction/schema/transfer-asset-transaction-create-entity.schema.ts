import { convertToMicroUnits } from '../../@generic/util/convert-to-micto-units.util';
import { getSignFromEntryType } from '../../transaction-entry/util/get-sign-from-entry-type.util';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { BaseTransferTransactionCreateEntitySchema } from './base-transfer-transaction-create-entity.schema';

export const TransferAssetTransactionCreateEntitySchema = BaseTransferTransactionCreateEntitySchema.superRefine(
    ({ entries, exchangeRate }, context) => {
        if (exchangeRate !== convertToMicroUnits(1)) {
            context.addIssue({
                code: 'custom',
                path: ['exchangeRate'],
                message: 'transfer asset transaction exchange rate must be equal to 1'
            });

return;
        }

        const totalSignedMicroUnits = entries.reduce((acc, curr) => {
            const signedValue = BigInt(getSignFromEntryType(curr.type)) * curr.amount;

            return acc + signedValue;
        }, BigInt(0));

        const absDiff = totalSignedMicroUnits < BigInt(0) ? -totalSignedMicroUnits : totalSignedMicroUnits;

        if (absDiff > BigInt(TOLERANCE_MICRO)) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: `entries do not balance: deviation of ${absDiff} micro units (tolerance ±${BigInt(TOLERANCE_MICRO)})`
            });
        }
    }
);
