import { TransactionAssociationEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import type { AdjustmentTransactionDetailsInterface } from '../interface/adjustment-transaction-details.interface';
import type { TransactionUpdateServiceInputInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const buildAdjustmentUpdateInput = (
    transaction: TransactionWithRelationsEntityInterface,
    details: AdjustmentTransactionDetailsInterface,
    amount: number,
    isIncrease: boolean
): TransactionUpdateServiceInputInterface => {
    const resolvedIsIncrease = details.isReconciliation ? details.initialIsIncrease : isIncrease;
    const resolvedAmount = details.isReconciliation ? details.initialAmount : amount;

    return {
        title: transaction.title,
        comment: transaction.comment,
        type: TransactionTypeEnum.ADJUSTMENT,
        operatedAt: transaction.operatedAt,
        fromAccountId: resolvedIsIncrease ? null : details.accountId,
        toAccountId: resolvedIsIncrease ? details.accountId : null,
        exchangeRate: transaction.exchangeRate,
        tagIds: transaction[TransactionAssociationEnum.TRANSACTION_TAGS].map(transactionTag => transactionTag.tagId),
        entries: [
            {
                accountId: details.accountId,
                categoryId: null,
                mccCategoryId: null,
                amount: resolvedAmount,
                type: resolvedIsIncrease ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT,
                externalId: details.entry.externalId ?? null,
                exchangeRate: details.entry.exchangeRate ?? 1,
                baseInstrumentId: details.entry.baseInstrumentId,
                baseExchangeRate: details.entry.baseExchangeRate,
                baseAmount: details.entry.baseAmount,
                toIban: details.entry.toIban
            }
        ]
    };
};
