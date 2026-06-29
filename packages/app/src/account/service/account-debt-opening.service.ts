import {
    AccountDebtTypeEnum,
    AccountNatureEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    transactionAsync
} from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { t } from '@lingui/core/macro';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { accountRepository, db, transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { SystemCategoryIdEnum } from '../../category/enum/system-category-id.enum';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { transactionDebtSettlementService } from '../../transaction/service/transaction-debt-settlement.service';
import { getTransactionCategoryEntries } from '../../transaction/utils/get-transaction-category-entries.util';

import { accountBalanceIncrementalService } from './account-balance-incremental.service';

import type { EntryBaseValuationInterface } from '../../money-data/interface/entry-base-valuation.interface';
import type {
    AccountEntityInterface,
    DB,
    DebtAccountCreateInputInterface,
    TransactionEntryCreateEntityInterface,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';

class AccountDebtOpeningService {
    @Log(
        (input, fromAccountId) => `enter title="${input.title}" debtType=${input.debtType} fromAccountId=${fromAccountId}`,
        (result, input, fromAccountId) =>
            `done accountId=${result.id} title="${input.title}" debtType=${input.debtType} fromAccountId=${fromAccountId}`,
        (error, input, fromAccountId) =>
            `throw title="${input.title}" debtType=${input.debtType} fromAccountId=${fromAccountId} error=${getErrorMessage(error)}`
    )
    async createLentDebtFromTransfer(input: DebtAccountCreateInputInterface, fromAccountId: number): Promise<AccountEntityInterface> {
        return transactionAsync(db, async tx => {
            this.assertDebtType(input.debtType, AccountDebtTypeEnum.LENT);

            const operatedAt = new Date();
            const fromAccount = await this.getAccountOrFail(fromAccountId, tx);
            const account = await this.createZeroTargetDebtAccount(input, tx);
            const fromAmount = this.getPositiveOpeningAmount(input.currentBalance);
            const conversion = await exchangeRatesService.convert(fromAccount.instrumentId, account.instrumentId, fromAmount);
            const valuedAccount = await this.updateDebtTargetAmount(account, conversion.amount, operatedAt, tx);

            await this.createOpeningDebtTransfer({
                fromAccountId,
                toAccountId: account.id,
                fromAmount,
                toAmount: conversion.amount,
                exchangeRate: conversion.exchangeRate,
                operatedAt,
                title: input.title,
                tx
            });

            await accountBalanceIncrementalService.updateBalancesByAccountIds([fromAccountId, account.id], tx);

            return valuedAccount;
        });
    }

    @Log(
        (input, incomeTransactionId) =>
            `enter title="${input.title}" debtType=${input.debtType} incomeTransactionId=${incomeTransactionId}`,
        (result, input, incomeTransactionId) =>
            `done accountId=${result.id} title="${input.title}" debtType=${input.debtType} incomeTransactionId=${incomeTransactionId}`,
        (error, input, incomeTransactionId) =>
            `throw title="${input.title}" debtType=${input.debtType} incomeTransactionId=${incomeTransactionId} error=${getErrorMessage(error)}`
    )
    async createBorrowedDebtFromIncome(
        input: DebtAccountCreateInputInterface,
        incomeTransactionId: number
    ): Promise<AccountEntityInterface> {
        return transactionAsync(db, async tx => {
            this.assertDebtType(input.debtType, AccountDebtTypeEnum.BORROW);

            const transaction = await this.getOpeningIncomeTransaction(incomeTransactionId, tx);
            const primaryEntry = this.getSingleOpeningIncomeEntry(transaction);
            const primaryAccount = await this.getAccountOrFail(primaryEntry.accountId, tx);
            const account = await this.createZeroTargetDebtAccount({ ...input, instrumentId: primaryAccount.instrumentId }, tx);

            return transactionDebtSettlementService.attachInTransaction(
                { transactionId: incomeTransactionId, debtAccountId: account.id },
                tx
            );
        });
    }

    private async createZeroTargetDebtAccount(input: DebtAccountCreateInputInterface, tx: DB): Promise<AccountEntityInterface> {
        const [{ count }] = await accountRepository.count();

        return accountRepository.create({ ...input, targetBalance: 0, order: count + 1, nature: AccountNatureEnum.LIABILITY }, tx);
    }

    private async createOpeningDebtTransfer({
        fromAccountId,
        toAccountId,
        fromAmount,
        toAmount,
        exchangeRate,
        operatedAt,
        title,
        tx
    }: {
        readonly fromAccountId: number;
        readonly toAccountId: number;
        readonly fromAmount: number;
        readonly toAmount: number;
        readonly exchangeRate: number;
        readonly operatedAt: Date;
        readonly title: string;
        readonly tx: DB;
    }): Promise<void> {
        const transaction = await transactionRepository.create(
            {
                type: TransactionTypeEnum.DEBT,
                title,
                comment: '',
                externalId: null,
                externalSource: null,
                operatedAt,
                exchangeRate,
                fromAccountId,
                toAccountId,
                updatedBy: null
            },
            tx
        );
        const [fromValuation, toValuation] = await Promise.all([
            entryBaseValuationService.valueMicroUnitEntry({
                accountId: fromAccountId,
                amount: fromAmount,
                operatedAt,
                externalSource: null,
                tx
            }),
            entryBaseValuationService.valueMicroUnitEntry({
                accountId: toAccountId,
                amount: toAmount,
                operatedAt,
                externalSource: null,
                tx
            })
        ]);

        await transactionEntryRepository.bulkCreate(
            [
                this.buildDebtTransferEntry({
                    transactionId: transaction.id,
                    accountId: fromAccountId,
                    type: TransactionEntryTypeEnum.CREDIT,
                    amount: fromAmount,
                    valuation: fromValuation
                }),
                this.buildDebtTransferEntry({
                    transactionId: transaction.id,
                    accountId: toAccountId,
                    type: TransactionEntryTypeEnum.DEBIT,
                    amount: toAmount,
                    valuation: toValuation
                })
            ],
            tx
        );
    }

    private buildDebtTransferEntry({
        transactionId,
        accountId,
        type,
        amount,
        valuation
    }: {
        readonly transactionId: number;
        readonly accountId: number;
        readonly type: TransactionEntryTypeEnum;
        readonly amount: number;
        readonly valuation: EntryBaseValuationInterface;
    }): TransactionEntryCreateEntityInterface {
        return {
            transactionId,
            accountId,
            categoryId: SystemCategoryIdEnum.CURRENCY_TRANSFER,
            mccCategoryId: null,
            type,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            externalId: null,
            exchangeRate: 1,
            baseInstrumentId: valuation.baseInstrumentId,
            baseExchangeRate: valuation.baseExchangeRate,
            baseAmount: valuation.baseAmount,
            toIban: null,
            originalTransactionId: null
        };
    }

    private getPositiveOpeningAmount(amount: number): number {
        const openingAmount = convertToMicroUnits(amount);

        if (!isPositiveNumber(openingAmount)) {
            throw new Error(t`Enter all amounts`);
        }

        return openingAmount;
    }

    private async getOpeningIncomeTransaction(id: number, tx: DB): Promise<TransactionWithEntriesEntityInterface> {
        const transaction = await transactionRepository.getByIdWithEntries(id, tx);

        if (!isDefined(transaction)) {
            throw new Error(t`Transaction not found`);
        }

        if (transaction.type !== TransactionTypeEnum.INCOME) {
            throw new Error(t`Only income transactions can be converted`);
        }

        return transaction;
    }

    private getSingleOpeningIncomeEntry(transaction: TransactionWithEntriesEntityInterface) {
        const categoryEntries = getTransactionCategoryEntries(transaction.entries);
        const primaryEntry = categoryEntries.at(0);

        if (!isDefined(primaryEntry) || categoryEntries.length !== 1) {
            throw new Error(t`Only single-entry incomes can be converted`);
        }

        return primaryEntry;
    }

    private async getAccountOrFail(id: number, tx: DB): Promise<AccountEntityInterface> {
        const account = await accountRepository.findById(id, tx);

        if (!isDefined(account)) {
            throw new Error(t`Account ${id} not found`);
        }

        return account;
    }

    private assertDebtType(debtType: AccountDebtTypeEnum, expectedDebtType: AccountDebtTypeEnum): void {
        if (debtType === expectedDebtType) {
            return;
        }

        if (expectedDebtType === AccountDebtTypeEnum.LENT) {
            throw new Error(t`Lent debt account expected`);
        }

        throw new Error(t`Borrowed debt account expected`);
    }

    private async updateDebtTargetBaseValuation(
        account: AccountEntityInterface,
        operatedAt: Date,
        tx: DB
    ): Promise<AccountEntityInterface> {
        const valuation = await entryBaseValuationService.valueMicroUnitEntry({
            accountId: account.id,
            amount: account.targetBalance,
            operatedAt,
            externalSource: null,
            tx
        });

        return accountRepository.updateById(
            account.id,
            {
                targetBaseInstrumentId: valuation.baseInstrumentId,
                targetBaseExchangeRate: valuation.baseExchangeRate,
                targetBaseAmount: valuation.baseAmount
            },
            tx
        );
    }

    private async updateDebtTargetAmount(
        account: AccountEntityInterface,
        targetBalance: number,
        operatedAt: Date,
        tx: DB
    ): Promise<AccountEntityInterface> {
        const updatedAccount = await accountRepository.updateById(account.id, { targetBalance }, tx);

        return this.updateDebtTargetBaseValuation(updatedAccount, operatedAt, tx);
    }
}

export const accountDebtOpeningService = new AccountDebtOpeningService();
