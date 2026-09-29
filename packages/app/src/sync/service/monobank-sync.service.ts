import { consolidationScopeService } from '@budgie/consolidation';
import { AccountTypeEnum, Db, ExternalSourceEnum, SyncModeEnum, UserIconNameEnum } from '@budgie/contracts';
import { MONOBANK_RATE_LIMIT_MS, MonobankClient, MonobankSyncService, SyncAccountTypeEnum } from '@budgie/sync';
import { subSeconds } from 'date-fns/subSeconds';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { accountBalanceRepository, accountRepository, syncRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { invalidateDatabaseLiveQuery } from '../../@generic/drizzle/utils/invalidate-database-live-query.util';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { ruleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { ruleEngineService } from '../../rule/service/rule-engine.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { UNKNOWN_SYNC_ERROR } from '../constant/unknown-sync-error.constant';
import { SyncHistoryDepthEnum } from '../enum/sync-history-depth.enum';
import { TransferConsolidationDrainReasonEnum } from '../enum/transfer-consolidation-drain-reason.enum';
import { loadMccCategoryLookupMap } from '../util/load-mcc-category-lookup-map.util';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

import { AbstractPollingSyncService } from './abstract-polling-sync.service';
import { syncIntegrationTokenService } from './sync-integration-token.service';
import { transferConsolidationDrainerService } from './transfer-consolidation-drainer.service';
import { transferConsolidationService } from './transfer-consolidation.service';

import type { MccCategoryLookupInterface, SyncEntityInterface, TransactionEntityInterface } from '@budgie/contracts';
import type { SyncAccountInterface, SyncBatchResultInterface, SyncTransactionInterface } from '@budgie/sync';

class AppMonobankSyncService extends AbstractPollingSyncService {
    override readonly supportsAddAccounts: boolean = true;

    readonly fetchAccountsPreview = Effect.fn('AppMonobankSyncService.fetchAccountsPreview')(function* (
        this: AppMonobankSyncService,
        token: string
    ) {
        const bankAccounts = yield* this.fetchBankAccountsAndJars(token);

        return isNotEmptyArray(bankAccounts) ? yield* this.mapAccountsToPreview(bankAccounts) : [];
    });

    readonly setupAccountSyncBatch = Effect.fn('AppMonobankSyncService.setupAccountSyncBatch')(function* (
        this: AppMonobankSyncService,
        token: string,
        externalIds: string[],
        historyDepth: SyncHistoryDepthEnum = SyncHistoryDepthEnum.FULL
    ) {
        const bankAccounts = yield* this.fetchBankAccountsAndJars(token);

        for (const externalId of externalIds) {
            const bankAccount = bankAccounts.find(account => account.id === externalId);
            if (isDefined(bankAccount)) {
                const account = yield* this.getOrCreateSyncAccount(bankAccount);
                yield* this.createOrUpdateSync(account.id, token, historyDepth, this.getOwnBalance(bankAccount));
            }
        }

        yield* Effect.forkDetach(this.registerBackgroundTask().pipe(Effect.ignoreCause({ log: true })));
        yield* this.requestSync();
    }, invalidateDatabaseLiveQuery);

    readonly fetchSetupBalance = Effect.fn('AppMonobankSyncService.fetchSetupBalance')(function* (
        this: AppMonobankSyncService,
        accountId: number
    ) {
        const account = yield* Db.query(database => accountRepository.findById(accountId, database));
        const token = yield* syncIntegrationTokenService.resolveAccountToken(this.provider, accountId);
        const bankAccounts = yield* this.fetchBankAccountsAndJars(token);
        const bankAccount = bankAccounts.find(item => item.id === account?.externalId);
        if (!isDefined(bankAccount)) {
            return yield* Effect.die(new Error(UNKNOWN_SYNC_ERROR));
        }

        return this.getOwnBalance(bankAccount);
    });

    protected readonly provider = ExternalSourceEnum.MONOBANK;
    // eslint-disable-next-line lingui/no-unlocalized-strings -- brand name
    protected readonly providerTitle = 'Monobank';
    protected readonly accountType = AccountTypeEnum.BANK_SYNC;
    protected readonly rateLimitMs = MONOBANK_RATE_LIMIT_MS;
    protected readonly backgroundTaskName = MONOBANK_SYNC_TASK;

    protected readonly executeSyncBatch: AbstractPollingSyncService['executeSyncBatch'] = Effect.fn(
        'AppMonobankSyncService.executeSyncBatch'
    )(function* (this: AppMonobankSyncService, sync: SyncEntityInterface) {
        const account = yield* Db.query(database => accountRepository.findById(sync.accountId, database));
        if (!isDefined(account) || !isNotEmptyString(account.externalId)) {
            const now = new Date();

            return { transactions: [], nextTo: now, nextFrom: now, completed: true };
        }

        const result = yield* this.fetchTransactionBatch(sync, account.externalId, yield* this.resolveSyncToken(sync));
        yield* Effect.yieldNow;
        const changedTransactions = yield* this.processFetchedTransactions(result.transactions, account.id);
        yield* this.reconcileChangedTransactions(changedTransactions);
        yield* Effect.yieldNow;

        return result;
    });

    protected readonly beforeSyncRun: AbstractPollingSyncService['beforeSyncRun'] = Effect.fn('AppMonobankSyncService.beforeSyncRun')(
        function* (this: AppMonobankSyncService) {
            this.mccCategoryLookupMap = yield* loadMccCategoryLookupMap();
        }
    );

    private readonly completeBackwardHistory = Effect.fn('AppMonobankSyncService.completeBackwardHistory')(
        function* (this: AppMonobankSyncService, sync: SyncEntityInterface, setupBalance: number, result: SyncBatchResultInterface) {
            const setupAt = sync.forwardSyncFromAt ?? new Date();
            const oldestTransactionAt = yield* transactionService.getEarliestTransactionTimeByAccountId(sync.accountId);
            const openingBalanceAt = isDefined(oldestTransactionAt) ? subSeconds(oldestTransactionAt, 1) : setupAt;

            if (isDefined(sync.balanceAdjustmentTransactionId)) {
                yield* transactionRepository.deleteById(sync.balanceAdjustmentTransactionId);
            }

            const delta = setupBalance - (yield* accountBalanceRepository.getLedgerBalanceUntil(sync.accountId, setupAt));
            const balanceAdjustmentTransactionId =
                delta === 0 ? null : yield* transactionService.createBalanceAdjustment(sync.accountId, delta, openingBalanceAt);

            yield* syncRepository.update(sync.id, {
                ...this.resolveProgressUpdate(sync, result),
                setupBalance: null,
                balanceAdjustmentTransactionId
            });
            yield* accountBalanceIncrementalService.updateBalancesByAccountIds([sync.accountId]);
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    private readonly reconcileChangedTransactions = Effect.fnUntraced(function* (
        changedTransactions: Array<Pick<TransactionEntityInterface, 'id' | 'operatedAt'>>
    ) {
        const consolidationScope = consolidationScopeService.buildFromTransactions(changedTransactions);
        if (!isDefined(consolidationScope)) {
            return;
        }

        yield* Effect.ensuring(
            transferConsolidationService.consolidate(consolidationScope),
            transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.MONOBANK_SYNC, consolidationScope)
        );
    });

    private readonly processFetchedTransactions = Effect.fnUntraced(function* (
        this: AppMonobankSyncService,
        transactions: SyncTransactionInterface[],
        accountId: number
    ) {
        if (!isNotEmptyArray(transactions)) {
            return [];
        }

        const existingTransactionIdMap = yield* transactionService.findIdMapByExternalSource(this.provider);
        const newTransactions = transactions.filter(bankTransaction => !existingTransactionIdMap.has(bankTransaction.id));
        const existingTransactions = transactions.filter(bankTransaction => existingTransactionIdMap.has(bankTransaction.id));

        const createdTransactions = yield* this.createNewTransactions(newTransactions, accountId);
        for (const bankTransaction of existingTransactions) {
            yield* transactionService.update(this.mapBankTransaction(bankTransaction, accountId));
            yield* Effect.yieldNow;
        }
        if (isNotEmptyArray(existingTransactions)) {
            yield* transactionService.updateAllBalances();
        }

        return [...createdTransactions, ...this.buildExistingTransactionScopeSeeds(existingTransactions, existingTransactionIdMap)];
    });

    private readonly createNewTransactions = Effect.fnUntraced(function* (
        this: AppMonobankSyncService,
        newTransactions: SyncTransactionInterface[],
        accountId: number
    ) {
        if (!isNotEmptyArray(newTransactions)) {
            return [];
        }

        const prepared = yield* ruleEngineService.prepareCreateInputsForRules(
            newTransactions.map(bankTransaction => this.mapBankTransaction(bankTransaction, accountId))
        );
        const createdTransactions = yield* transactionService.bulkCreate(prepared.transactionInputs);
        const postCreateTransactionIds = prepared.postCreateIndexes.map(index => createdTransactions[index]?.id).filter(isDefined);
        const postCreateTransactionInputs = prepared.postCreateIndexes.map(index => prepared.transactionInputs[index]).filter(isDefined);

        if (isNotEmptyArray(postCreateTransactionIds)) {
            yield* ruleApplicationDrainerService.enqueueTransactions(postCreateTransactionIds, postCreateTransactionInputs);
        }

        return createdTransactions;
    });

    private readonly fetchTransactionBatch = Effect.fnUntraced(function* (
        sync: SyncEntityInterface,
        externalAccountId: string,
        token: string
    ) {
        const service = new MonobankSyncService(new MonobankClient(token));

        return sync.mode === SyncModeEnum.FORWARD
            ? yield* service.syncTransactionsForward(externalAccountId, sync.forwardSyncFromAt ?? new Date())
            : yield* service.syncTransactionsBackward(
                  externalAccountId,
                  sync.backwardSyncFromAt ?? new Date(),
                  sync.backwardSyncedAt,
                  sync.backwardSyncLimitAt
              );
    });

    private readonly fetchBankAccountsAndJars = Effect.fnUntraced(function* (token: string) {
        const client = new MonobankClient(token);
        const accounts = yield* client.getAccounts();
        const jars = yield* client.getJars();

        return [...accounts, ...jars];
    });

    private mccCategoryLookupMap = new Map<string, MccCategoryLookupInterface>();

    protected override applyProgressUpdate(sync: SyncEntityInterface, result: SyncBatchResultInterface) {
        return sync.mode === SyncModeEnum.BACKWARD && result.completed && isDefined(sync.setupBalance)
            ? this.completeBackwardHistory(sync, sync.setupBalance, result)
            : super.applyProgressUpdate(sync, result);
    }

    protected override afterSyncEnabledChange(enabled: boolean) {
        return enabled ? this.requestSync() : Effect.void;
    }

    protected override generateAccountTitle(account: SyncAccountInterface): string {
        if (account.type === SyncAccountTypeEnum.JAR && isNotEmptyString(account.title)) {
            return `${this.providerTitle} «${account.title}»`;
        }

        const cardType = account.type.charAt(0).toUpperCase() + account.type.slice(1).toLowerCase();

        if (isNotEmptyArray(account.maskedPan)) {
            const lastFourDigits = account.maskedPan[0].slice(-4);

            return `${this.providerTitle} ${cardType} •${lastFourDigits}`;
        }

        return `${this.providerTitle} ${cardType} ${account.currencyCode}`;
    }

    protected override accountIcon(account: SyncAccountInterface): UserIconNameEnum {
        return account.type === SyncAccountTypeEnum.JAR ? UserIconNameEnum.PiggyBank : super.accountIcon(account);
    }

    private buildExistingTransactionScopeSeeds(
        transactions: SyncTransactionInterface[],
        existingTransactionIdMap: Map<string, number>
    ): Pick<TransactionEntityInterface, 'id' | 'operatedAt'>[] {
        return transactions.flatMap(transaction => {
            const id = existingTransactionIdMap.get(transaction.id);

            return isDefined(id) ? [{ id, operatedAt: new Date(transaction.time * 1000) }] : [];
        });
    }

    private mapBankTransaction(bankTransaction: SyncTransactionInterface, accountId: number) {
        return mapBankTransactionToCreateInput(
            bankTransaction,
            accountId,
            this.mccCategoryLookupMap.get(String(bankTransaction.mcc)) ?? null,
            this.provider
        );
    }

    private getOwnBalance(bankAccount: SyncAccountInterface): number {
        return convertToMicroUnits(bankAccount.balance) - convertToMicroUnits(bankAccount.creditLimit);
    }
}

export const monobankSyncService = new AppMonobankSyncService();
