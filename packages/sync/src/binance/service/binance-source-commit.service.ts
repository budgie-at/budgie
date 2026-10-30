import { P2P_ORDER_EXTERNAL_ID_MARKER, buildConsolidationScopeFromTransactions } from '@budgie/consolidation';
import { AccountRepository, TransactionRepository } from '@budgie/contracts';
import {
    AccountBalanceIncrementalService,
    ImportedTransactionEntryUpdateService,
    TransactionService,
    TransferCreationService
} from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { SyncTransactionTypeEnum } from '../../core/enum/sync-transaction-type.enum';
import { pollingSyncDependenciesLayer } from '../../core/layer/polling-sync-dependencies.layer';
import { SyncWorkload } from '../../core/port/sync-workload.port';
import { SyncIntegrationTokenService } from '../../core/service/sync-integration-token.service';
import { mapBankTransactionToCreateInput } from '../../core/utils/map-bank-transaction-to-create-input.util';
import { BINANCE_ACCOUNT_DEFINITION } from '../constant/binance-account-definition.constant';
import { mapBinanceTransfersToInputs } from '../mapper/binance-transfer-input.mapper';
import { decodeBinanceAccountId } from '../utils/binance-account-id.util';

import { BinanceAccountService } from './binance-account.service';
import { BinanceSourceQuoteService } from './binance-source-quote.service';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { BinanceSourceCommitOptionsInterface } from '../interface/binance-source-commit-options.interface';
import type { BinanceTransferInterface } from '../interface/binance-transfer.interface';
import type { AccountEntityInterface, TransactionCreateInputInterface } from '@budgie/contracts';

export class BinanceSourceCommitService extends Context.Service<BinanceSourceCommitService>()('@budgie/sync/BinanceSourceCommitService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const transactionRepository = yield* TransactionRepository;
        const importedTransactionEntryUpdateService = yield* ImportedTransactionEntryUpdateService;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const transactionService = yield* TransactionService;
        const transferCreationService = yield* TransferCreationService;
        const binanceAccountService = yield* BinanceAccountService;
        const binanceSourceQuoteService = yield* BinanceSourceQuoteService;
        const syncIntegrationTokenService = yield* SyncIntegrationTokenService;
        const syncWorkload = yield* SyncWorkload;
        const { provider } = BINANCE_ACCOUNT_DEFINITION;
        const transferChunkSize = 50;
        const sourceInputYieldInterval = 50;

        const findIntegrationAccounts = Effect.fnUntraced(function* (token: string) {
            const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);

            return (yield* accountRepository.findByExternalSource(provider)).filter(account => account.integrationId === integration.id);
        });

        const findIntegrationIdMap = Effect.fnUntraced(function* (token: string) {
            const accountIds = (yield* findIntegrationAccounts(token)).map(account => account.id);

            return yield* transactionService.findIdMapByExternalSource(provider, accountIds);
        });

        const findDeletedExternalIds = Effect.fnUntraced(function* (token: string) {
            const accountIds = (yield* findIntegrationAccounts(token)).map(account => account.id);

            return new Set(yield* transactionRepository.findDeletedExternalIdsByExternalSource(provider, accountIds));
        });

        const buildRunAccountResolver = Effect.fnUntraced(function* (token: string, exchangeAccounts: SyncAccountInterface[]) {
            const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);

            return yield* binanceAccountService.buildAccountResolver(exchangeAccounts, integration.id);
        });

        const enqueueExistingSourceConsolidation = Effect.fnUntraced(function* (
            sourceTransactions: SyncTransactionInterface[],
            existingIdMap: ReadonlyMap<string, number>
        ) {
            const transactionIds = sourceTransactions
                .filter(transaction => transaction.id.includes(P2P_ORDER_EXTERNAL_ID_MARKER))
                .map(transaction => existingIdMap.get(transaction.id))
                .filter(isDefined);
            if (!isNotEmptyArray(transactionIds)) {
                return;
            }

            const consolidationScope = buildConsolidationScopeFromTransactions(yield* transactionRepository.findByIds(transactionIds));
            if (isDefined(consolidationScope)) {
                yield* syncWorkload.enqueueTransferConsolidation(consolidationScope);
            }
        });

        const reconcileSourceAccount = Effect.fnUntraced(function* <E, R>(
            transaction: SyncTransactionInterface,
            resolveAccount: (codecAccountId: string) => Effect.Effect<AccountEntityInterface | null, E, R>,
            existingIdMap: ReadonlyMap<string, number>
        ) {
            const account = yield* resolveAccount(transaction.accountId);
            const transactionId = existingIdMap.get(transaction.id);
            if (!isDefined(account) || !isDefined(transactionId)) {
                return 0;
            }

            const accountChanged = yield* transactionService.moveExternalEntryToAccount(
                transactionId,
                transaction.id,
                account.id,
                transaction.type === SyncTransactionTypeEnum.INCOME
            );
            const quote = yield* binanceSourceQuoteService.resolve(transaction);
            const quoteChanged =
                isDefined(quote) &&
                (yield* importedTransactionEntryUpdateService.updateExternalEntryQuote(transactionId, transaction.id, quote));

            return accountChanged || quoteChanged ? 1 : 0;
        });

        const buildSourceInputs = Effect.fnUntraced(function* <E, R>(
            transactions: SyncTransactionInterface[],
            resolveAccount: (codecAccountId: string) => Effect.Effect<AccountEntityInterface | null, E, R>
        ) {
            const inputs: TransactionCreateInputInterface[] = [];
            for (const [index, transaction] of transactions.entries()) {
                if (isPositiveNumber(index) && index % sourceInputYieldInterval === 0) {
                    yield* Effect.yieldNow;
                }
                const account = yield* resolveAccount(transaction.accountId);
                if (isDefined(account)) {
                    inputs.push(
                        yield* binanceSourceQuoteService.applyToInput(
                            mapBankTransactionToCreateInput(transaction, account.id, null, provider),
                            transaction
                        )
                    );
                }
            }

            return inputs;
        });

        const createTransfers = Effect.fnUntraced(function* (
            transfers: BinanceTransferInterface[],
            token: string,
            exchangeAccounts: SyncAccountInterface[]
        ) {
            const inputs = yield* mapBinanceTransfersToInputs(transfers, yield* buildRunAccountResolver(token, exchangeAccounts));

            let createdCount = 0;
            for (let index = 0; index < inputs.length; index += transferChunkSize) {
                createdCount += (yield* transferCreationService.createSyncedTransfers(inputs.slice(index, index + transferChunkSize)))
                    .length;
                yield* Effect.yieldNow;
            }

            return createdCount;
        });

        return {
            findAssetCodes: Effect.fn('BinanceSourceCommitService.findAssetCodes')(function* (token: string) {
                return (yield* findIntegrationAccounts(token))
                    .map(account => (isNotEmptyString(account.externalId) ? decodeBinanceAccountId(account.externalId)?.asset : null))
                    .filter(isDefined);
            }),
            commitSources: Effect.fn('BinanceSourceCommitService.commitSources')(function* (
                token: string,
                exchangeAccounts: SyncAccountInterface[],
                transactions: SyncTransactionInterface[],
                options: BinanceSourceCommitOptionsInterface
            ) {
                const existingIdMap = yield* findIntegrationIdMap(token);
                const existingTransactions = transactions.filter(sourceTransaction => existingIdMap.has(sourceTransaction.id));
                const resolveAccount = yield* buildRunAccountResolver(token, exchangeAccounts);
                let reconciledCount = 0;
                for (const transaction of existingTransactions) {
                    reconciledCount += yield* reconcileSourceAccount(transaction, resolveAccount, existingIdMap);
                }
                if (options.updateExistingAmounts && isNotEmptyArray(existingTransactions)) {
                    const inputs = yield* buildSourceInputs(existingTransactions, resolveAccount);
                    if (isNotEmptyArray(inputs)) {
                        yield* transactionService.bulkUpdateImported(inputs);
                        yield* accountBalanceIncrementalService.updateAllBalances(true);
                    }
                }
                if (options.enqueueExistingConsolidation) {
                    yield* enqueueExistingSourceConsolidation(existingTransactions, existingIdMap);
                }

                const deletedExternalIds = yield* findDeletedExternalIds(token);
                const newTransactions = transactions.filter(
                    sourceTransaction => !existingIdMap.has(sourceTransaction.id) && !deletedExternalIds.has(sourceTransaction.id)
                );
                if (!isNotEmptyArray(newTransactions)) {
                    return reconciledCount;
                }

                const inputs = yield* buildSourceInputs(newTransactions, resolveAccount);

                return reconciledCount + (isNotEmptyArray(inputs) ? (yield* transactionService.bulkCreate(inputs)).length : 0);
            }),
            commitTransfers: Effect.fn('BinanceSourceCommitService.commitTransfers')(function* (
                token: string,
                exchangeAccounts: SyncAccountInterface[],
                transfers: BinanceTransferInterface[]
            ) {
                const existingIdMap = yield* findIntegrationIdMap(token);
                const deletedExternalIds = yield* findDeletedExternalIds(token);
                const newTransfers = transfers.filter(
                    transfer =>
                        !existingIdMap.has(transfer.externalId) &&
                        !deletedExternalIds.has(transfer.externalId) &&
                        !(
                            isDefined(transfer.legacyExternalId) &&
                            (existingIdMap.has(transfer.legacyExternalId) || deletedExternalIds.has(transfer.legacyExternalId))
                        )
                );

                return isNotEmptyArray(newTransfers) ? yield* createTransfers(newTransfers, token, exchangeAccounts) : 0;
            }),
            removeByExternalIds: Effect.fn('BinanceSourceCommitService.removeByExternalIds')(function* (
                token: string,
                externalIds: ReadonlySet<string>
            ) {
                if (externalIds.size === 0) {
                    return 0;
                }

                const existingIdMap = yield* findIntegrationIdMap(token);
                const removableTransactionIds = [...externalIds].map(externalId => existingIdMap.get(externalId)).filter(isDefined);
                for (const transactionId of removableTransactionIds) {
                    const consolidationParentId = (yield* transactionRepository.getByIdRaw(transactionId))
                        ?.consolidationParentTransactionId;
                    if (isDefined(consolidationParentId)) {
                        yield* transactionService.unconsolidateById(consolidationParentId);
                    }
                    yield* transactionService.deleteById(transactionId);
                }

                return removableTransactionIds.length;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(BinanceSourceCommitService, BinanceSourceCommitService.make).pipe(
        Layer.provide([
            pollingSyncDependenciesLayer,
            AccountBalanceIncrementalService.layer,
            ImportedTransactionEntryUpdateService.layer,
            TransferCreationService.layer,
            BinanceAccountService.layer,
            BinanceSourceQuoteService.layer
        ])
    );
}
