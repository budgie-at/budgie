import { isDefined } from '@rnw-community/shared';

import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { findCoreTransactionEntries } from '../util/find-core-transaction-entries.util';

import { TransactionCreateEntitySchema } from './transaction-create-entity.schema';

export const BaseTransferTransactionCreateEntitySchema = TransactionCreateEntitySchema.superRefine(
    ({ fromAccountId, toAccountId, entries, type }, context) => {
        if (entries.length < 2) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: 'Too small: expected array to have >=2'
            });
        }

        if (entries.length > 3) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: 'Too big: expected array to have <=3 items'
            });
        }

        if (type !== TransactionTypeEnum.TRANSFER) {
            context.addIssue({
                code: 'custom',
                path: ['type'],
                message: `Transaction type must be '${TransactionTypeEnum.TRANSFER}'.`
            });
        }

        if (!isDefined(fromAccountId) || !isDefined(toAccountId)) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: '"from" and "to" accounts must be defined'
            });
        }

        if (fromAccountId === toAccountId) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: '"from" and "to" accounts must be different'
            });
        }

        const { toEntry, fromEntry, fromEntryIndex, toEntryIndex } = findCoreTransactionEntries(entries, fromAccountId, toAccountId);

        if (!isDefined(fromEntry) || !isDefined(toEntry)) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: 'entries must include exactly one "from" and one "to" account entries'
            });

            return;
        }

        const uniqueAccountIds = new Set(entries.map(({ accountId }) => accountId));

        if (entries.length !== uniqueAccountIds.size) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: 'each account may appear at most once within the entries'
            });
        }

        if (fromEntry.type === TransactionEntryTypeEnum.DEBIT) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES, fromEntryIndex, 'type'],
                message: '"from" entry must be "credit"'
            });
        }

        if (toEntry.type === TransactionEntryTypeEnum.CREDIT) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES, toEntryIndex, 'type'],
                message: '"to" entry must be "debit"'
            });
        }

        const feeEntryIndex = entries.findIndex(entry => entry.accountId !== fromAccountId && entry.accountId !== toAccountId);
        const feeEntry = feeEntryIndex >= 0 ? entries[feeEntryIndex] : null;

        if (isDefined(feeEntry) && feeEntry.type !== TransactionEntryTypeEnum.DEBIT) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES, feeEntryIndex, 'type'],
                message: '"fee" entry must be "debit"'
            });
        }
    }
);
