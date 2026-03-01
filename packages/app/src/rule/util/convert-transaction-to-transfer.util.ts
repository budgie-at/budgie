import { AccountTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { accountRepository, transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { ConvertToTransferParamsInterface } from '../interface/convert-to-transfer-params.interface';

export const convertTransactionToTransfer = async (params: ConvertToTransferParamsInterface): Promise<void> => {
    const { transactionId, targetAccountId, dbTransaction } = params;

    const transaction = await transactionRepository.getById(transactionId, dbTransaction);
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
        accountRepository.findById(fromAccountId, dbTransaction),
        accountRepository.findById(toAccountId, dbTransaction)
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
        dbTransaction
    );

    await transactionEntryRepository.deleteByTransactionId(transactionId, dbTransaction);

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
        dbTransaction
    );
};
