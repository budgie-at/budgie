import { AccountTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { accountRepository, transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { Transaction } from '../../@generic/type/transaction.type';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';

interface ConvertToTransferParams {
    readonly transactionId: number;
    readonly targetAccountId: number;
    readonly tx: Transaction;
}

export const convertTransactionToTransfer = async (params: ConvertToTransferParams): Promise<void> => {
    const { transactionId, targetAccountId, tx } = params;

    const transaction = await transactionRepository.getById(transactionId);
    if (!isDefined(transaction)) {
        return;
    }

    const isExpense = transaction.type === TransactionTypeEnum.EXPENSE;
    const isIncome = transaction.type === TransactionTypeEnum.INCOME;

    if (!isExpense && !isIncome) {
        return;
    }

    const [originalEntry] = transaction.entries;
    if (!isDefined(originalEntry)) {
        return;
    }

    const originalAccountId = originalEntry.accountId;

    if (originalAccountId === targetAccountId) {
        return;
    }

    const fromAccountId = isExpense ? originalAccountId : targetAccountId;
    const toAccountId = isExpense ? targetAccountId : originalAccountId;

    const [fromAccount, toAccount] = await Promise.all([
        accountRepository.findById(fromAccountId),
        accountRepository.findById(toAccountId)
    ]);

    if (!isDefined(fromAccount) || !isDefined(toAccount)) {
        return;
    }

    const { amount: convertedAmount, exchangeRate } = await exchangeRatesService.convert(
        fromAccount.instrumentId,
        toAccount.instrumentId,
        originalEntry.amount
    );

    const isDebtTransaction = fromAccount.type === AccountTypeEnum.DEBT || toAccount.type === AccountTypeEnum.DEBT;
    const newType = isDebtTransaction ? TransactionTypeEnum.DEBT : TransactionTypeEnum.TRANSFER;

    await transactionRepository.updateById(
        transactionId,
        {
            type: newType,
            fromAccountId,
            toAccountId,
            exchangeRate
        },
        tx
    );

    await transactionEntryRepository.deleteByTransactionId(transactionId, tx);

    await transactionEntryRepository.bulkCreate(
        [
            {
                transactionId,
                accountId: fromAccountId,
                type: TransactionEntryTypeEnum.CREDIT,
                amount: originalEntry.amount,
                categoryId: originalEntry.categoryId,
                mccCategoryId: originalEntry.mccCategoryId,
                externalId: null
            },
            {
                transactionId,
                accountId: toAccountId,
                type: TransactionEntryTypeEnum.DEBIT,
                amount: convertedAmount,
                categoryId: originalEntry.categoryId,
                mccCategoryId: null,
                externalId: null
            }
        ],
        tx
    );
};
