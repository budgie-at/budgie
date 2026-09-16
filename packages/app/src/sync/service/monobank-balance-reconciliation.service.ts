import {
    ExternalSourceEnum,
    SyncBalanceAuthorityEnum,
    SyncModeEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    transactionAsync
} from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import {
    accountBalanceRepository,
    accountRepository,
    db,
    syncRepository,
    transactionEntryRepository,
    transactionRepository
} from '../../@generic/drizzle/db/db';
import { InvalidateDatabaseLiveQuery } from '../../@generic/drizzle/decorator/invalidate-database-live-query.decorator';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { UNKNOWN_SYNC_ERROR } from '../constant/unknown-sync-error.constant';

import type { MonobankBalanceFinalizationInputInterface } from '../interface/monobank-balance-finalization-input.interface';
import type { DB, SyncEntityInterface } from '@budgie/contracts';

class MonobankBalanceReconciliationService {
    @InvalidateDatabaseLiveQuery()
    @Log(
        input =>
            `enter syncId=${input.syncId} accountId=${input.accountId} providerBalance=${input.providerBalance} runCheckName="${input.isRunCurrent.name}"`,
        (_result, input) =>
            `done syncId=${input.syncId} accountId=${input.accountId} providerBalance=${input.providerBalance} runCheckName="${input.isRunCurrent.name}"`,
        (error, input) =>
            `throw syncId=${input.syncId} accountId=${input.accountId} providerBalance=${input.providerBalance} runCheckName="${input.isRunCurrent.name}" error=${getErrorMessage(error)}`
    )
    async finalize(input: MonobankBalanceFinalizationInputInterface): Promise<void> {
        if (!input.isRunCurrent()) {
            return;
        }

        await transactionAsync(db, async tx => {
            const sync = await syncRepository.getById(input.syncId, tx);
            const account = await accountRepository.findById(input.accountId, tx);
            const canFinalize =
                input.isRunCurrent() &&
                isDefined(sync) &&
                isDefined(account) &&
                sync.accountId === input.accountId &&
                sync.provider === ExternalSourceEnum.MONOBANK &&
                sync.enabled &&
                sync.mode === SyncModeEnum.FORWARD &&
                sync.balanceAuthority === SyncBalanceAuthorityEnum.PROVIDER;

            if (!canFinalize || !isDefined(sync)) {
                return;
            }

            await this.finalizeInTransaction(sync, input, tx);
        });
    }

    private async finalizeInTransaction(
        sync: SyncEntityInterface,
        input: MonobankBalanceFinalizationInputInterface,
        tx: DB
    ): Promise<void> {
        const ledgerBalance = await accountBalanceRepository.getLedgerBalanceExcludingTransaction(
            sync.accountId,
            sync.balanceAdjustmentTransactionId,
            tx
        );
        const delta = input.providerBalance - ledgerBalance;

        if (isDefined(sync.balanceAdjustmentTransactionId)) {
            await transactionRepository.deleteById(sync.balanceAdjustmentTransactionId, tx);
        }

        const adjustmentTransactionId = delta === 0 ? null : await this.createAdjustment(sync.accountId, delta, tx);

        if (!input.isRunCurrent()) {
            throw new Error(UNKNOWN_SYNC_ERROR);
        }

        const finalizedAt = new Date();
        await accountBalanceRepository.upsert({ accountId: sync.accountId, amount: input.providerBalance, updatedAt: finalizedAt }, tx);
        await syncRepository.update(
            sync.id,
            {
                ...input.progressUpdate,
                balanceAuthority: SyncBalanceAuthorityEnum.LEDGER,
                balanceAnchorCapturedAt: null,
                balanceAdjustmentTransactionId: adjustmentTransactionId
            },
            tx
        );
    }

    private async createAdjustment(accountId: number, delta: number, tx: DB): Promise<number> {
        const operatedAt = new Date();
        const amount = Math.abs(delta);
        const isIncome = isPositiveNumber(delta);
        const valuation = await entryBaseValuationService.valueMicroUnitEntry({
            accountId,
            amount,
            operatedAt,
            externalSource: null,
            tx
        });
        const transaction = await transactionRepository.create(
            {
                type: TransactionTypeEnum.ADJUSTMENT,
                title: '',
                comment: '',
                externalId: null,
                externalSource: null,
                operatedAt,
                exchangeRate: valuation.baseExchangeRate ?? 1,
                fromAccountId: isIncome ? null : accountId,
                toAccountId: isIncome ? accountId : null,
                updatedBy: null
            },
            tx
        );

        await transactionEntryRepository.create(
            {
                accountId,
                transactionId: transaction.id,
                categoryId: null,
                mccCategoryId: null,
                amount,
                type: isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT,
                exchangeRate: valuation.baseExchangeRate ?? 1,
                baseInstrumentId: valuation.baseInstrumentId,
                baseExchangeRate: valuation.baseExchangeRate,
                baseAmount: valuation.baseAmount
            },
            tx
        );

        return transaction.id;
    }
}

export const monobankBalanceReconciliationService = new MonobankBalanceReconciliationService();
