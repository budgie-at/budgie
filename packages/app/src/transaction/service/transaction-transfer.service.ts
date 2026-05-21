import {
    AccountTypeEnum,
    TransactionEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    transactionAsync
} from '@budgie/contracts';
import { i18n } from '@lingui/core';
import { t } from '@lingui/core/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { db, transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { accountService } from '../../account/service/account.service';
import { SystemCategoryIdEnum } from '../../category/enum/system-category-id.enum';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { TRANSFER_CONVERSION_ERROR_MESSAGE } from '../constant/transfer-conversion-error-message.constant';
import { ConvertToTransferParamsInterface } from '../interface/convert-to-transfer-params.interface';
import { TransferConversionResultInterface } from '../interface/transfer-conversion-result.interface';

import type { DB } from '@budgie/contracts';

class TransactionTransferService {
    async convertExpenseToTransfer(params: ConvertToTransferParamsInterface): Promise<TransactionEntityInterface> {
        return this.convertToTransfer(params, 'expense');
    }

    async convertIncomeToTransfer(params: ConvertToTransferParamsInterface): Promise<TransactionEntityInterface> {
        return this.convertToTransfer(params, 'income');
    }

    private async convertToTransfer(
        params: ConvertToTransferParamsInterface,
        direction: 'expense' | 'income'
    ): Promise<TransactionEntityInterface> {
        return transactionAsync(db, async tx => {
            const conversion = await this.buildTransferConversion(direction, params, tx);
            const updated = await transactionRepository.updateById(
                params.id,
                {
                    type: conversion.transactionType,
                    fromAccountId: conversion.fromAccountId,
                    toAccountId: conversion.toAccountId,
                    exchangeRate: conversion.exchangeRate
                },
                tx
            );

            await transactionEntryRepository.deleteByTransactionId(params.id, tx);
            await transactionEntryRepository.bulkCreate(
                [
                    this.buildTransferEntryCreateEntity(
                        params.id,
                        conversion.creditAccountId,
                        TransactionEntryTypeEnum.CREDIT,
                        conversion.creditAmount
                    ),
                    this.buildTransferEntryCreateEntity(
                        params.id,
                        conversion.debitAccountId,
                        TransactionEntryTypeEnum.DEBIT,
                        conversion.debitAmount
                    )
                ],
                tx
            );

            await accountBalanceIncrementalService.updateAllBalances(true, tx);

            return updated;
        });
    }

    private async buildTransferConversion(
        direction: 'expense' | 'income',
        params: ConvertToTransferParamsInterface,
        tx: DB
    ): Promise<TransferConversionResultInterface> {
        const transaction = await this.getTransferConversionTransaction(params.id, direction, tx);
        const [transactionEntry] = transaction.entries;
        const { amount } = transactionEntry;
        const hasCustomRate = isPositiveNumber(params.customExchangeRate) && params.customExchangeRate !== 1;
        const isExpense = direction === 'expense';
        const fromAccountId = isExpense ? this.requireTransferAccountId(transaction.fromAccountId, 'source') : params.accountId;
        const toAccountId = isExpense ? params.accountId : this.requireTransferAccountId(transaction.toAccountId, 'destination');
        const [fromAccount, toAccount] = await Promise.all([
            accountService.findByIdOrFail(fromAccountId),
            accountService.findByIdOrFail(toAccountId)
        ]);
        const conversion = await exchangeRatesService.convert(
            isExpense ? fromAccount.instrumentId : toAccount.instrumentId,
            isExpense ? toAccount.instrumentId : fromAccount.instrumentId,
            amount
        );
        const exchangeRate = hasCustomRate && isDefined(params.customExchangeRate) ? params.customExchangeRate : conversion.exchangeRate;
        const convertedAmount =
            hasCustomRate && isDefined(params.customExchangeRate) ? amount / params.customExchangeRate : conversion.amount;

        return {
            creditAccountId: fromAccountId,
            creditAmount: isExpense ? amount : convertedAmount,
            debitAccountId: toAccountId,
            debitAmount: isExpense ? convertedAmount : amount,
            exchangeRate,
            fromAccountId,
            toAccountId,
            transactionType: this.resolveTransferTransactionType(fromAccount.type, toAccount.type)
        };
    }

    private async getTransferConversionTransaction(id: number, direction: 'expense' | 'income', tx: DB) {
        const transaction = await transactionRepository.getByIdWithEntries(id, tx);

        if (!isDefined(transaction)) {
            throw new Error(t`Transaction not found`);
        }

        const errorMessage = TRANSFER_CONVERSION_ERROR_MESSAGE[direction];
        const expectedType = direction === 'expense' ? TransactionTypeEnum.EXPENSE : TransactionTypeEnum.INCOME;

        if (transaction.type !== expectedType) {
            throw new Error(i18n._(errorMessage.wrongType));
        }

        if (transaction.entries.length !== 1) {
            throw new Error(i18n._(errorMessage.multiEntry));
        }

        return transaction;
    }

    private buildTransferEntryCreateEntity(
        transactionId: number,
        accountId: number,
        type: TransactionEntryTypeEnum,
        amount: number
    ): TransactionEntryCreateEntityInterface {
        return {
            transactionId,
            accountId,
            type,
            amount,
            categoryId: SystemCategoryIdEnum.CURRENCY_TRANSFER,
            mccCategoryId: null,
            externalId: null,
            exchangeRate: 1,
            toIban: null
        };
    }

    private resolveTransferTransactionType(fromAccountType: AccountTypeEnum, toAccountType: AccountTypeEnum): TransactionTypeEnum {
        return toAccountType === AccountTypeEnum.DEBT || fromAccountType === AccountTypeEnum.DEBT
            ? TransactionTypeEnum.DEBT
            : TransactionTypeEnum.TRANSFER;
    }

    private requireTransferAccountId(accountId: number | null, kind: 'source' | 'destination'): number {
        if (isDefined(accountId)) {
            return accountId;
        }

        if (kind === 'source') {
            throw new Error(t`Transaction must have a source account`);
        }

        throw new Error(t`Transaction must have a destination account`);
    }
}

export const transactionTransferService = new TransactionTransferService();
