import { isDefined } from '@rnw-community/shared';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micto-units.util';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { getTotalSignedEntryMicroUnits } from '../util/get-total-signed-entry-micro-units.util';

import { BaseTransferTransactionCreateEntitySchema } from './base-transfer-transaction-create-entity.schema';

export const BuyAssetTransactionCreateEntitySchema = BaseTransferTransactionCreateEntitySchema.superRefine(
    ({ entries, exchangeRate, toAccountId }, context) => {
        if (exchangeRate === convertToMicroUnits(1)) {
            context.addIssue({
                code: 'custom',
                path: ['exchangeRate'],
                message: 'buy asset transaction exchange rate must not be equal to 1'
            });
        }

        if (!isDefined(toAccountId)) {
            return;
        }

        const totalSignedFromMicroUnits = getTotalSignedEntryMicroUnits(entries, toAccountId, exchangeRate);

        const absDiff = totalSignedFromMicroUnits < BigInt(0) ? -totalSignedFromMicroUnits : totalSignedFromMicroUnits;

        if (absDiff > BigInt(TOLERANCE_MICRO)) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: `entries do not balance: deviation of ${absDiff} micro units (tolerance ±${BigInt(TOLERANCE_MICRO)})`
            });
        }
    }
);
