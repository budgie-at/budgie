import { isDefined } from '@rnw-community/shared';

import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { getSignFromEntryType } from '../../transaction-entry/util/get-sign-from-entry-type.util';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { BaseTransferTransactionCreateEntitySchema } from './base-transfer-transaction-create-entity.schema';

export const TransferAssetTransactionCreateEntitySchema = BaseTransferTransactionCreateEntitySchema.superRefine(
    ({ entries, exchangeRate, toAccountId, fromAccountId }, context) => {
        if (fromAccountId === toAccountId) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: 'fromAccountId and toAccountId must be different'
            });

            return;
        }

        if (exchangeRate !== 1) {
            context.addIssue({
                code: 'custom',
                path: ['exchangeRate'],
                message: 'transfer asset transaction exchange rate must be equal to 1'
            });

            return;
        }

        const fromEntryIndex = entries.findIndex(entry => entry.accountId === fromAccountId);
        const toEntryIndex = entries.findIndex(entry => entry.accountId === toAccountId);

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

        const feeEntryIndex = entries.findIndex(entry => entry.accountId !== fromAccountId && entry.accountId !== toAccountId);
        const feeEntry = feeEntryIndex >= 0 ? entries[feeEntryIndex] : null;

        const uniqueAccountIds = new Set(entries.map(({ accountId }) => accountId));
        if (uniqueAccountIds.size !== entries.length) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: 'each account may appear at most once within the entries'
            });

            return;
        }

        if (fromEntry.type !== TransactionEntryTypeEnum.CREDIT) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES, fromEntryIndex, 'type'],
                message: "from-entry must be 'credit' (asset leaves the from account)"
            });

            return;
        }

        if (toEntry.type !== TransactionEntryTypeEnum.DEBIT) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES, toEntryIndex, 'type'],
                message: "to-entry must be 'debit' (asset enters the to account)"
            });

            return;
        }

        if (isDefined(feeEntry) && feeEntry.type !== TransactionEntryTypeEnum.DEBIT) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES, feeEntryIndex, 'type'],
                message: "fee-entry must be 'debit' (fee reduces the transferred amount)"
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
