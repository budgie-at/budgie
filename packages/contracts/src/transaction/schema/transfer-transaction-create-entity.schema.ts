import { PRECISION } from '../../@generic/constant/precision.constant';
import { getSignFromEntryType } from '../../transaction-entry/util/get-sign-from-entry-type.util';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { findCoreTransactionEntries } from '../util/find-core-transaction-entries.util';

import { BaseTransferTransactionCreateEntitySchema } from './base-transfer-transaction-create-entity.schema';

export const TransferTransactionCreateEntitySchema = BaseTransferTransactionCreateEntitySchema.superRefine(
    ({ entries, exchangeRate, fromAccountId, toAccountId }, context) => {
        const { fromEntry, toEntry } = findCoreTransactionEntries(entries, fromAccountId, toAccountId);

        if (!fromEntry || !toEntry) {
            return;
        }

        const calculatedRate = toEntry.amount / fromEntry.amount;

        const providedRateMicro = Math.round(exchangeRate * PRECISION);
        const calculatedRateMicro = Math.round(calculatedRate * PRECISION);

        if (Math.abs(providedRateMicro - calculatedRateMicro) > TOLERANCE_MICRO) {
            context.addIssue({
                code: 'custom',
                path: ['exchangeRate'],
                message: `Exchange rate (${exchangeRate}) does not match the ratio of entry amounts (${calculatedRate}). Expected: ${calculatedRate.toFixed(6)}`
            });

            return;
        }

        const totalSignedFromMicroUnits = entries.reduce((acc, curr) => {
            let amountInFromCurrencyMicroUnits = curr.amount;

            if (curr.accountId === toAccountId) {
                amountInFromCurrencyMicroUnits = Math.round((curr.amount * PRECISION) / providedRateMicro);
            }

            const signedValue = getSignFromEntryType(curr.type) * amountInFromCurrencyMicroUnits;

            return acc + signedValue;
        }, 0);

        if (Math.abs(totalSignedFromMicroUnits) > TOLERANCE_MICRO) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: `Entries do not balance (micro): total signed FROM = ${totalSignedFromMicroUnits} (must be 0±${TOLERANCE_MICRO})`
            });
        }
    }
);
