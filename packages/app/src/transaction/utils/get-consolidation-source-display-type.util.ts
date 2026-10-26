import { TransactionConsolidationTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import type { ConsolidationSourceRowInterface } from '@budgie/contracts';

export const getConsolidationSourceDisplayType = (
    source: Pick<ConsolidationSourceRowInterface, 'entryType' | 'sourceType'>,
    consolidationType: TransactionConsolidationTypeEnum | null
): TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME => {
    if (consolidationType === TransactionConsolidationTypeEnum.REFUND) {
        return source.sourceType === TransactionTypeEnum.INCOME ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE;
    }

    return source.entryType === TransactionEntryTypeEnum.DEBIT ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE;
};
