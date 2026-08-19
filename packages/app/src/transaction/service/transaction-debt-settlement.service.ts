import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    DebtEventDirectionEnum,
    DebtEventSourceEnum,
    TransactionEntryKindEnum,
    TransactionTypeEnum,
    transactionAsync
} from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { t } from '@lingui/core/macro';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { accountRepository, db, debtEventRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { InvalidateDatabaseLiveQuery } from '../../@generic/drizzle/decorator/invalidate-database-live-query.decorator';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';

import type { AttachDebtSettlementParamsInterface } from '../interface/attach-debt-settlement-params.interface';
import type { AccountEntityInterface, DB, TransactionEntryEntityInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

class TransactionDebtSettlementService {
    @Log(
        params => `enter transactionId=${params.transactionId} debtAccountId=${params.debtAccountId}`,
        (result, params) =>
            `done debtAccountTitle="${result.title}" transactionId=${params.transactionId} debtAccountId=${params.debtAccountId}`,
        (error, params) =>
            `throw transactionId=${params.transactionId} debtAccountId=${params.debtAccountId} error=${getErrorMessage(error)}`
    )
    @InvalidateDatabaseLiveQuery()
    async attach(params: AttachDebtSettlementParamsInterface): Promise<AccountEntityInterface> {
        return await transactionAsync(db, async tx => this.attachInTransaction(params, tx));
    }

    @Log(
        transactionId => `enter transactionId=${transactionId}`,
        'done',
        (error, transactionId) => `throw transactionId=${transactionId} error=${getErrorMessage(error)}`
    )
    @InvalidateDatabaseLiveQuery()
    async detach(transactionId: number): Promise<void> {
        await transactionAsync(db, async tx => {
            const transaction = await this.getTransactionOrFail(transactionId, tx);
            const debtEvent = await debtEventRepository.findByTransactionId(transactionId, tx);

            await debtEventRepository.deleteByTransactionId(transactionId, tx);
            await transactionRepository.touchUpdatedAt(transactionId, tx);
            await accountBalanceIncrementalService.updateBalancesByAccountIds(
                [transaction.toAccountId, transaction.fromAccountId, debtEvent?.debtAccountId].filter(isDefined),
                tx
            );
        });
    }

    async attachInTransaction(params: AttachDebtSettlementParamsInterface, tx: DB): Promise<AccountEntityInterface> {
        const transaction = await this.getTransactionOrFail(params.transactionId, tx);
        const debtAccount = await this.getDebtAccountOrFail(params.debtAccountId, tx);

        this.assertTransactionSupportsDebtSettlement(transaction);
        await this.assertNoSettlement(transaction, tx);
        const primaryEntry = this.getPrimaryEntryOrFail(transaction);
        this.assertDebtAccountIsNotPrimaryAccount(primaryEntry, debtAccount);

        const valuation = await entryBaseValuationService.valueMicroUnitEntry({
            accountId: debtAccount.id,
            amount: primaryEntry.amount,
            operatedAt: transaction.operatedAt,
            externalSource: transaction.externalSource,
            tx
        });

        await debtEventRepository.create(
            {
                debtAccountId: debtAccount.id,
                transactionId: transaction.id,
                transactionEntryId: primaryEntry.id,
                direction: this.getDebtEventDirection(transaction, debtAccount),
                source: DebtEventSourceEnum.INCOME_ATTACHMENT,
                amount: primaryEntry.amount,
                baseInstrumentId: valuation.baseInstrumentId,
                baseExchangeRate: valuation.baseExchangeRate,
                baseAmount: valuation.baseAmount,
                operatedAt: transaction.operatedAt
            },
            tx
        );
        await transactionRepository.touchUpdatedAt(transaction.id, tx);
        await accountBalanceIncrementalService.updateBalancesByAccountIds([primaryEntry.accountId, debtAccount.id], tx);

        return debtAccount;
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
        const [primaryEntry] = primaryEntries;

        if (!isDefined(primaryEntry) || primaryEntries.length !== 1) {
            throw new Error(t`Transaction must have exactly one primary entry`);
        }

        return primaryEntry;
    }

    private async assertNoSettlement(transaction: TransactionWithEntriesEntityInterface, tx: DB): Promise<void> {
        const debtEvent = await debtEventRepository.findByTransactionId(transaction.id, tx);

        if (isDefined(debtEvent)) {
            throw new Error(t`Transaction already has a debt attachment`);
        }
    }

    private assertTransactionSupportsDebtSettlement(transaction: TransactionWithEntriesEntityInterface): void {
        if (transaction.type === TransactionTypeEnum.EXPENSE || transaction.type === TransactionTypeEnum.INCOME) {
            return;
        }

        throw new Error(t`Could not attach debt`);
    }

    private assertDebtAccountIsNotPrimaryAccount(primaryEntry: TransactionEntryEntityInterface, debtAccount: AccountEntityInterface): void {
        if (primaryEntry.accountId === debtAccount.id) {
            throw new Error(t`Debt account cannot match transaction account`);
        }
    }

    private getDebtEventDirection(
        transaction: Pick<TransactionWithEntriesEntityInterface, 'type'>,
        debtAccount: Pick<AccountEntityInterface, 'debtType'>
    ): DebtEventDirectionEnum {
        if (transaction.type === TransactionTypeEnum.EXPENSE) {
            return DebtEventDirectionEnum.CLOSE;
        }

        return debtAccount.debtType === AccountDebtTypeEnum.BORROW ? DebtEventDirectionEnum.OPEN : DebtEventDirectionEnum.CLOSE;
    }
}

export const transactionDebtSettlementService = new TransactionDebtSettlementService();
