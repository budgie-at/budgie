import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    TransactionEntryCreateEntityInterface,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    transactionAsync
} from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { t } from '@lingui/core/macro';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { accountRepository, db, transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';

import type { AttachDebtSettlementParamsInterface } from '../interface/attach-debt-settlement-params.interface';
import type { AccountEntityInterface, DB, TransactionEntryEntityInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

class TransactionDebtSettlementService {
    @Log(
        params => `enter transactionId=${params.transactionId} debtAccountId=${params.debtAccountId}`,
        (result, params) => `done result=${String(result)} transactionId=${params.transactionId} debtAccountId=${params.debtAccountId}`,
        (error, params) =>
            `throw transactionId=${params.transactionId} debtAccountId=${params.debtAccountId} error=${getErrorMessage(error)}`
    )
    async attach(params: AttachDebtSettlementParamsInterface): Promise<void> {
        await transactionAsync(db, async tx => {
            const transaction = await this.getTransactionOrFail(params.transactionId, tx);
            const debtAccount = await this.getDebtAccountOrFail(params.debtAccountId, tx);
            const primaryEntry = this.getPrimaryEntryOrFail(transaction);

            this.assertNoSettlement(transaction);
            this.assertDebtAccountMatchesTransaction(transaction, debtAccount);
            this.assertDebtAccountIsNotPrimaryAccount(primaryEntry, debtAccount);

            const settlementEntry = await this.buildSettlementEntry(transaction, primaryEntry, debtAccount, tx);

            await transactionEntryRepository.create(settlementEntry, tx);
            await accountBalanceIncrementalService.updateBalancesByAccountIds([primaryEntry.accountId, debtAccount.id], tx);
        });
    }

    @Log(
        transactionId => `enter transactionId=${transactionId}`,
        'done',
        (error, transactionId) => `throw transactionId=${transactionId} error=${getErrorMessage(error)}`
    )
    async detach(transactionId: number): Promise<void> {
        await transactionAsync(db, async tx => {
            const transaction = await this.getTransactionOrFail(transactionId, tx);
            const settlementEntries = this.getSettlementEntries(transaction);

            await transactionEntryRepository.deleteDebtSettlementByTransactionId(transactionId, tx);
            await accountBalanceIncrementalService.updateBalancesByAccountIds(
                [...new Set(settlementEntries.map(entry => entry.accountId))],
                tx
            );
        });
    }

    private async getTransactionOrFail(transactionId: number, tx: DB): Promise<TransactionWithEntriesEntityInterface> {
        const transaction = await transactionRepository.getByIdWithEntries(transactionId, tx);

        if (!isDefined(transaction)) {
            throw new Error(t`Transaction not found`);
        }

        return transaction;
    }

    private async getDebtAccountOrFail(accountId: number, tx: DB): Promise<AccountEntityInterface> {
        const account = await accountRepository.findById(accountId, tx);

        if (!isDefined(account) || account.type !== AccountTypeEnum.DEBT) {
            throw new Error(t`Debt account not found`);
        }

        return account;
    }

    private getPrimaryEntryOrFail(transaction: TransactionWithEntriesEntityInterface): TransactionEntryEntityInterface {
        const primaryEntries = transaction.entries.filter(entry => entry.kind === TransactionEntryKindEnum.PRIMARY);
        const expectedEntryType =
            transaction.type === TransactionTypeEnum.INCOME ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT;
        const [primaryEntry] = primaryEntries.filter(entry => entry.type === expectedEntryType);

        if (!isDefined(primaryEntry) || primaryEntries.length !== 1) {
            throw new Error(t`Transaction must have exactly one primary entry`);
        }

        return primaryEntry;
    }

    private assertNoSettlement(transaction: TransactionWithEntriesEntityInterface): void {
        if (isNotEmptyArray(this.getSettlementEntries(transaction))) {
            throw new Error(t`Transaction already has a debt settlement`);
        }
    }

    private getSettlementEntries(transaction: TransactionWithEntriesEntityInterface): TransactionEntryEntityInterface[] {
        return transaction.entries.filter(entry => entry.kind === TransactionEntryKindEnum.DEBT_SETTLEMENT);
    }

    private assertDebtAccountMatchesTransaction(
        transaction: TransactionWithEntriesEntityInterface,
        debtAccount: AccountEntityInterface
    ): void {
        if (transaction.type === TransactionTypeEnum.INCOME && debtAccount.debtType === AccountDebtTypeEnum.LENT) {
            return;
        }

        if (transaction.type === TransactionTypeEnum.EXPENSE && debtAccount.debtType === AccountDebtTypeEnum.BORROW) {
            return;
        }

        throw new Error(t`Debt account does not match transaction type`);
    }

    private assertDebtAccountIsNotPrimaryAccount(primaryEntry: TransactionEntryEntityInterface, debtAccount: AccountEntityInterface): void {
        if (primaryEntry.accountId === debtAccount.id) {
            throw new Error(t`Debt account cannot match transaction account`);
        }
    }

    private async buildSettlementEntry(
        transaction: TransactionWithEntriesEntityInterface,
        primaryEntry: TransactionEntryEntityInterface,
        debtAccount: AccountEntityInterface,
        tx: DB
    ): Promise<TransactionEntryCreateEntityInterface> {
        const valuation = await entryBaseValuationService.valueMicroUnitEntry({
            accountId: debtAccount.id,
            amount: primaryEntry.amount,
            operatedAt: transaction.operatedAt,
            externalSource: transaction.externalSource,
            tx
        });

        return {
            transactionId: transaction.id,
            accountId: debtAccount.id,
            type: transaction.type === TransactionTypeEnum.INCOME ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT,
            kind: TransactionEntryKindEnum.DEBT_SETTLEMENT,
            amount: primaryEntry.amount,
            categoryId: primaryEntry.categoryId,
            categorySource: primaryEntry.categorySource,
            mccCategoryId: primaryEntry.mccCategoryId,
            externalId: null,
            exchangeRate: 1,
            baseInstrumentId: valuation.baseInstrumentId,
            baseExchangeRate: valuation.baseExchangeRate,
            baseAmount: valuation.baseAmount,
            toIban: null,
            originalTransactionId: null
        };
    }
}

export const transactionDebtSettlementService = new TransactionDebtSettlementService();
