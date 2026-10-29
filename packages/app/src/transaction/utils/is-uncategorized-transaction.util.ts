import {
    AccountTypeEnum,
    TransactionAssociationEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

const CATEGORIZABLE_TYPES = new Set([TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME]);

export const isUncategorizedTransaction = (
    transaction: Pick<TransactionWithRelationsEntityInterface, 'type' | TransactionAssociationEnum.ENTRIES>
): boolean =>
    CATEGORIZABLE_TYPES.has(transaction.type) &&
    transaction.entries.some(
        entry =>
            !isDefined(entry.categoryId) &&
            entry.kind === TransactionEntryKindEnum.PRIMARY &&
            entry.type !== TransactionEntryTypeEnum.FEE &&
            entry.account.type !== AccountTypeEnum.DEBT
    );
