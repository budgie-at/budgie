import { isDefined } from '@rnw-community/shared';

import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { BaseTransferTransactionCreateEntitySchema } from './base-transfer-transaction-create-entity.schema';

export const BuyAssetTransactionCreateEntitySchema = BaseTransferTransactionCreateEntitySchema.superRefine(
    ({ entries, exchangeRate, toAccountId, fromAccountId }, context) => {
        const fromAccount = entries.find(entry => entry.accountId === fromAccountId);
        const toAccount = entries.find(entry => entry.accountId === toAccountId);

        if (!isDefined(fromAccount) || !isDefined(toAccount)) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: 'buy asset transaction entries must have "from" and "to" accounts'
            });

            return;
        }

        if (fromAccountId === toAccountId) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: '"from" and "to" accounts must be different'
            });

            return;
        }

        if (exchangeRate === 1) {
            context.addIssue({
                code: 'custom',
                path: ['exchangeRate'],
                message: 'buy asset transaction exchange rate must not be equal to 1'
            });

            return;
        }

        const amountFrom = fromAccount.amount;

        const RATE_SCALE = 1_000_000;
        const rateScaled = Math.round(exchangeRate * RATE_SCALE);

        const sumExceptFromMicro = entries
            .filter(entry => entry.accountId !== fromAccountId)
            .reduce((acc, entry) => {
                if (entry.accountId === toAccountId) {
                    const converted = Math.round((entry.amount * rateScaled) / RATE_SCALE);

                    return acc + converted;
                }

                return acc + entry.amount;
            }, 0);

        const TOLERANCE_MICRO = 1;
        const diffMicro = Math.abs(amountFrom - sumExceptFromMicro);

        if (diffMicro > TOLERANCE_MICRO) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: `entries do not balance (micro): from=${amountFrom} vs sum(except from)=${sumExceptFromMicro} (Δ=${diffMicro})`
            });
        }
    }
);
