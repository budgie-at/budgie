import {
    AccountDebtTypeEnum,
    AccountNatureEnum,
    BORROWING_CATEGORY_ID,
    CategorySourceEnum,
    DebtEventDirectionEnum,
    DebtEventSourceEnum,
    LENDING_CATEGORY_ID,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    transactionAsync
} from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { t } from '@lingui/core/macro';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import {
    accountRepository,
    db,
    debtEventRepository,
    transactionEntryRepository,
    transactionRepository
} from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { transactionDebtSettlementService } from '../../transaction/service/transaction-debt-settlement.service';
import { getTransactionCategoryEntries } from '../../transaction/utils/get-transaction-category-entries.util';
import { updateDebtTargetBaseValuation } from '../util/update-debt-target-base-valuation.util';

import { accountBalanceIncrementalService } from './account-balance-incremental.service';
import { accountService } from './account.service';

import type {
    AccountEntityInterface,
    DB,
    DebtAccountCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryEntityInterface,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';

class AccountDebtOpeningService {
    @Log(
        (input, fundingAccountId) => `enter title="${input.title}" debtType=${input.debtType} fundingAccountId=${fundingAccountId}`,
        (result, input, fundingAccountId) =>
            `done accountId=${result.id} title="${input.title}" debtType=${input.debtType} fundingAccountId=${fundingAccountId}`,
        (error, input, fundingAccountId) =>
            `throw title="${input.title}" debtType=${input.debtType} fundingAccountId=${fundingAccountId} error=${getErrorMessage(error)}`
    )
    async openDebtWithFundingAccount(input: DebtAccountCreateInputInterface, fundingAccountId: number): Promise<AccountEntityInterface> {
        return transactionAsync(db, async tx => {
            const fundingAccount = await this.getAccountOrFail(fundingAccountId, tx);
            const targetAmount = this.getPositiveOpeningAmount(input.targetBalance);
            const account = await this.createZeroTargetDebtAccount(input, tx);
            const conversion = await exchangeRatesService.convert(account.instrumentId, fundingAccount.instrumentId, targetAmount);
            const transaction = await this.createFundingTransaction(input, fundingAccountId, tx);
            const entry = await this.createFundingEntry(transaction, fundingAccountId, Math.round(conversion.amount), tx);
            const valuedAccount = await this.updateDebtTargetAmount(account, targetAmount, transaction.operatedAt, tx);

            await debtEventRepository.create(
                {
                    debtAccountId: valuedAccount.id,
                    transactionId: transaction.id,
                    transactionEntryId: entry.id,
                    direction: DebtEventDirectionEnum.OPEN,
                    source: DebtEventSourceEnum.OPENING,
                    amount: valuedAccount.targetBalance,
                    baseInstrumentId: valuedAccount.targetBaseInstrumentId,
                    baseExchangeRate: valuedAccount.targetBaseExchangeRate,
                    baseAmount: valuedAccount.targetBaseAmount,
                    operatedAt: transaction.operatedAt
                },
                tx
            );
            await accountService.syncManualDebtEvents(valuedAccount, convertToMicroUnits(input.currentBalance), transaction.operatedAt, tx);
            await accountBalanceIncrementalService.updateBalancesByAccountIds([fundingAccountId, valuedAccount.id], tx);

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
            this.assertBorrowedDebtType(input.debtType);

            const transaction = await this.getOpeningIncomeTransaction(incomeTransactionId, tx);
            const primaryEntry = this.getSingleOpeningIncomeEntry(transaction);
            const primaryAccount = await this.getAccountOrFail(primaryEntry.accountId, tx);
            const account = await this.createZeroTargetDebtAccount({ ...input, instrumentId: primaryAccount.instrumentId }, tx);

            await transactionDebtSettlementService.attachInTransaction(
                { transactionId: incomeTransactionId, debtAccountId: account.id },
                tx
            );

            return this.updateDebtTargetAmount(account, primaryEntry.amount, transaction.operatedAt, tx);
        });
    }

    private async createZeroTargetDebtAccount(input: DebtAccountCreateInputInterface, tx: DB): Promise<AccountEntityInterface> {
        const [{ count }] = await accountRepository.count();

        const nature = input.debtType === AccountDebtTypeEnum.LENT ? AccountNatureEnum.ASSET : AccountNatureEnum.LIABILITY;

        return accountRepository.create({ ...input, targetBalance: 0, order: count + 1, nature }, tx);
    }

    private async createFundingTransaction(
        input: DebtAccountCreateInputInterface,
        fundingAccountId: number,
        tx: DB
    ): Promise<TransactionEntityInterface> {
        const isLentDebt = input.debtType === AccountDebtTypeEnum.LENT;

        return transactionRepository.create(
            {
                type: isLentDebt ? TransactionTypeEnum.EXPENSE : TransactionTypeEnum.INCOME,
                title: input.title,
                comment: '',
                externalId: null,
                externalSource: null,
                operatedAt: new Date(),
                exchangeRate: 1,
                fromAccountId: isLentDebt ? fundingAccountId : null,
                toAccountId: isLentDebt ? null : fundingAccountId,
                updatedBy: null
            },
            tx
        );
    }

    private async createFundingEntry(
        transaction: TransactionEntityInterface,
        fundingAccountId: number,
        amount: number,
        tx: DB
    ): Promise<TransactionEntryEntityInterface> {
        const isExpense = transaction.type === TransactionTypeEnum.EXPENSE;
        const valuation = await entryBaseValuationService.valueMicroUnitEntry({
            accountId: fundingAccountId,
            amount,
            operatedAt: transaction.operatedAt,
            externalSource: null,
            tx
        });

        return transactionEntryRepository.create(
            {
                transactionId: transaction.id,
                accountId: fundingAccountId,
                categoryId: isExpense ? LENDING_CATEGORY_ID : BORROWING_CATEGORY_ID,
                categorySource: CategorySourceEnum.DEBT_SETTLEMENT,
                mccCategoryId: null,
                type: isExpense ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT,
                kind: TransactionEntryKindEnum.PRIMARY,
                amount,
                externalId: null,
                exchangeRate: 1,
                baseInstrumentId: valuation.baseInstrumentId,
                baseExchangeRate: valuation.baseExchangeRate,
                baseAmount: valuation.baseAmount,
                toIban: null,
                originalTransactionId: null
            },
            tx
        );
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

    private assertBorrowedDebtType(debtType: AccountDebtTypeEnum): void {
        if (debtType !== AccountDebtTypeEnum.BORROW) {
            throw new Error(t`Borrowed debt account expected`);
        }
    }

    private async updateDebtTargetAmount(
        account: AccountEntityInterface,
        targetBalance: number,
        operatedAt: Date,
        tx: DB
    ): Promise<AccountEntityInterface> {
        const updatedAccount = await accountRepository.updateById(account.id, { targetBalance }, tx);

        return updateDebtTargetBaseValuation(updatedAccount, operatedAt, tx);
    }
}

export const accountDebtOpeningService = new AccountDebtOpeningService();
