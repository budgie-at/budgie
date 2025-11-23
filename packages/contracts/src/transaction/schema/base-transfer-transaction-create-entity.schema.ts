import { array } from 'zod';

import { isDefined } from '@rnw-community/shared';

import { convertToCreateEntitySchema } from '../../generic/util/convert-to-create-entity-schema.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryCreateEntitySchema } from '../../transaction-entry/schema/transaction-entry-create-entity.schema';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { findCoreTransactionEntries } from '../util/find-core-transaction-entries.util';

import { TransferTransactionEntitySchema } from './transfer-transaction-entity.schema';

export const BaseTransferTransactionCreateEntitySchema = convertToCreateEntitySchema(TransferTransactionEntitySchema)
    .extend({ [TransactionAssociationEnum.ENTRIES]: array(TransactionEntryCreateEntitySchema.omit({transactionId: true})).min(2).max(3) })
    .superRefine(({ fromAccountId, toAccountId, entries }, context) => {
        if (!isDefined(fromAccountId) || !isDefined(toAccountId)) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: '"from" and "to" accounts must be defined'
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

            return;
        }

        if (fromEntry.type === TransactionEntryTypeEnum.DEBIT) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES, fromEntryIndex, 'type'],
                message: '"from" entry must be "credit"'
            });

            return;
        }

        if (toEntry.type === TransactionEntryTypeEnum.CREDIT) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES, toEntryIndex, 'type'],
                message: '"to" entry must be "debit"'
            });

            return;
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
    });
