import { isDefined } from '@rnw-community/shared';

import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { getSignFromEntryType } from '../../transaction-entry/util/get-sign-from-entry-type.util';
import { PRECISION } from '../../generic/constant/precision.constant';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { BaseTransferTransactionCreateEntitySchema } from './base-transfer-transaction-create-entity.schema';

export const TransferTransactionCreateEntitySchema = BaseTransferTransactionCreateEntitySchema.superRefine(
    ({ entries, exchangeRate, fromAccountId, toAccountId }, context) => {
        const fromEntryIndex = entries.findIndex(transactionEntry => transactionEntry.accountId === fromAccountId);
        const toEntryIndex = entries.findIndex(transactionEntry => transactionEntry.accountId === toAccountId);

        const fromEntry = fromEntryIndex >= 0 ? entries[fromEntryIndex] : null;
        const toEntry = toEntryIndex >= 0 ? entries[toEntryIndex] : null;

        const feeEntryIndex = entries.findIndex(
            transactionEntry => transactionEntry.accountId !== fromAccountId && transactionEntry.accountId !== toAccountId
        );
        const feeEntry = feeEntryIndex >= 0 ? entries[feeEntryIndex] : null;

        if (fromEntry?.type === TransactionEntryTypeEnum.DEBIT) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES, fromEntryIndex, 'type'],
                message: '"from" entry must be "credit" (funds leave the "from" account)'
            });

            return;
        }

        if (toEntry?.type === TransactionEntryTypeEnum.CREDIT) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES, toEntryIndex, 'type'],
                message: '"to" entry must be "debit" (funds enter the "to" account)'
            });

            return;
        }

        if (isDefined(feeEntry) && feeEntry.type !== TransactionEntryTypeEnum.DEBIT) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES, feeEntryIndex, 'type'],
                message: '"fee" entry must be "debit" (fee increases FROM-currency outflow)'
            });

            return;
        }

        const rateScaledInteger = Math.round(exchangeRate * PRECISION);

        const convertToEntryMicroUnits = (amountMicroUnits: number, isToAccountEntry: boolean): number => {
            if (!isToAccountEntry) {
                return amountMicroUnits;
            }

            return Math.round((amountMicroUnits * rateScaledInteger) / PRECISION);
        };

        const totalSignedFromMicroUnits = entries.reduce((acc, curr) => {
            const amountInFromCurrencyMicroUnits = convertToEntryMicroUnits(curr.amount, curr.accountId === toAccountId);
            const signedValue = getSignFromEntryType(curr.type) * amountInFromCurrencyMicroUnits;

            return acc + signedValue;
        }, 0);

        if (Math.abs(totalSignedFromMicroUnits) > TOLERANCE_MICRO) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: `entries do not balance (micro): total signed FROM = ${totalSignedFromMicroUnits} (must be 0±${TOLERANCE_MICRO})`
            });
        }
    }
);
