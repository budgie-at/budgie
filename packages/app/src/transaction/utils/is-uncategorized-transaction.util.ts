import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    DebtEventAssociationEnum,
    TransactionAssociationEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

const CATEGORIZABLE_TYPES = new Set([TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME]);

export const isUncategorizedTransaction = (
    transaction: Pick<
        TransactionWithRelationsEntityInterface,
        'type' | TransactionAssociationEnum.ENTRIES | TransactionAssociationEnum.DEBT_EVENTS
    >
): boolean =>
    CATEGORIZABLE_TYPES.has(transaction.type) &&
    !transaction.debtEvents.some(debtEvent => {
        const { debtType } = debtEvent[DebtEventAssociationEnum.DEBT_ACCOUNT];

        return isDefined(debtType) && debtType !== AccountDebtTypeEnum.INSTALLMENT;
    }) &&
    transaction.entries.some(
        entry =>
            !isDefined(entry.categoryId) &&
            entry.kind === TransactionEntryKindEnum.PRIMARY &&
            entry.type !== TransactionEntryTypeEnum.FEE &&
            entry.account.type !== AccountTypeEnum.DEBT
    );
