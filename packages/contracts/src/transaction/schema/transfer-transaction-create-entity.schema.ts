import { isDefined } from '@rnw-community/shared';

import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { getSignFromEntryType } from '../../transaction-entry/util/get-sign-from-entry-type.util';
import { PRECISION } from '../constant/precision.constant';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { BaseTransferTransactionCreateEntitySchema } from './base-transfer-transaction-create-entity.schema';

export const TransferTransactionCreateEntitySchema = BaseTransferTransactionCreateEntitySchema.superRefine(
    ({ entries, exchangeRate, fromAccountId, toAccountId }, context) => {
        if (fromAccountId === toAccountId) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: 'fromAccountId and toAccountId must be different'
            });

            return;
        }

        const fromEntryIndex = entries.findIndex(transactionEntry => transactionEntry.accountId === fromAccountId);
        const toEntryIndex = entries.findIndex(transactionEntry => transactionEntry.accountId === toAccountId);

        const fromEntry = fromEntryIndex >= 0 ? entries[fromEntryIndex] : null;
        const toEntry = toEntryIndex >= 0 ? entries[toEntryIndex] : null;

        if (!isDefined(fromEntry) || !isDefined(toEntry)) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: 'entries must include exactly one from-account entry and one to-account entry'
            });

            return;
        }

        const feeEntryIndex = entries.findIndex(
            transactionEntry => transactionEntry.accountId !== fromAccountId && transactionEntry.accountId !== toAccountId
        );
        const feeEntry = feeEntryIndex >= 0 ? entries[feeEntryIndex] : null;

        const uniqueAccountIds = new Set(entries.map(({ accountId }) => accountId));
        if (uniqueAccountIds.size !== entries.length) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: 'each account may appear at most once within the entries'
            });
        }

        if (fromEntry.type !== TransactionEntryTypeEnum.CREDIT) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES, fromEntryIndex, 'type'],
                message: "from-entry must be 'credit' (funds leave the from account)"
            });

            return;
        }

        if (toEntry.type !== TransactionEntryTypeEnum.DEBIT) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES, toEntryIndex, 'type'],
                message: "to-entry must be 'debit' (funds enter the to account)"
            });

            return;
        }

        if (isDefined(feeEntry) && feeEntry.type !== TransactionEntryTypeEnum.DEBIT) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES, feeEntryIndex, 'type'],
                message: "fee-entry must be 'debit' (fee increases FROM-currency outflow)"
            });

            return;
        }

        const rateScaledInteger = Math.round(exchangeRate * PRECISION);

        const convertToFromMicroUnits = (amountMicroUnits: number, isToAccountEntry: boolean): number => {
            if (!isToAccountEntry) {
                return amountMicroUnits;
            }

            return Math.round((amountMicroUnits * rateScaledInteger) / PRECISION);
        };

        const totalSignedFromMicroUnits = entries.reduce((acc, curr) => {
            const amountInFromCurrencyMicroUnits = convertToFromMicroUnits(curr.amount, curr.accountId === toAccountId);
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
