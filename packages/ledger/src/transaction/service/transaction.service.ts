import { UnconsolidationService } from '@budgie/consolidation';
import {
    Db,
    ExternalSourceEnum,
    type TransactionCreateInputInterface,
    TransactionEntryRepository,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTagsRepository,
    TransactionTypeEnum,
    type TransactionUpdateServiceInputInterface,
    TransactionUpdatedByEnum,
    type TransactionWithEntriesEntityInterface
} from '@budgie/contracts';
import { EntryBaseValuationService } from '@budgie/market';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { processInputWithBatches } from '../../@generic/util/process-input-with-batches.util';
import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { TRANSACTION_BATCH_SIZE } from '../constant/transaction-batch-size.constant';
import { getEntryAccountIds } from '../util/get-entry-account-ids.util';
import { stampForDeferredEmbedding } from '../util/stamp-for-deferred-embedding.util';
import { transactionMapEntryInputToCreateEntity } from '../util/transaction-map-entry-input-to-create-entity.util';
import { transactionMapTagIdsToCreateEntities } from '../util/transaction-map-tag-ids-to-create-entities.util';

import { ImportedTransactionEntryUpdateService } from './imported-transaction-entry-update.service';
import { TransactionBatchCreateService } from './transaction-batch-create.service';
import { TransactionDebtSettlementService } from './transaction-debt-settlement.service';
import { TransactionDepositSafetyService } from './transaction-deposit-safety.service';

import type { UpsertTransactionEntriesAndTagsInputInterface } from '../interface/upsert-transaction-entries-and-tags-input.interface';

export class TransactionService extends Context.Service<TransactionService>()('@budgie/ledger/TransactionService', {
    make: Effect.gen(function* () {
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionTagsRepository = yield* TransactionTagsRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const entryBaseValuationService = yield* EntryBaseValuationService;
        const importedTransactionEntryUpdateService = yield* ImportedTransactionEntryUpdateService;
        const transactionBatchCreateService = yield* TransactionBatchCreateService;
        const transactionDebtSettlementService = yield* TransactionDebtSettlementService;
        const transactionDepositSafetyService = yield* TransactionDepositSafetyService;
        const unconsolidationService = yield* UnconsolidationService;

        const getAccountIdsFromTransactions = (transactions: readonly TransactionWithEntriesEntityInterface[]): number[] => [
            ...new Set(transactions.flatMap(transaction => transaction.entries.map(entry => entry.accountId)))
        ];

        const unconsolidateByIdInTransaction = (transactionId: number) =>
            Db.transaction(unconsolidationService.unconsolidateById(transactionId));

        const upsertTransactionEntriesAndTags = Effect.fn('TransactionService.upsertTransactionEntriesAndTags')(function* ({
            transactionId,
            input,
            operatedAt,
            isConsolidated
        }: UpsertTransactionEntriesAndTagsInputInterface) {
            if (isConsolidated) {
                yield* transactionEntryRepository.deleteLedgerByTransactionId(transactionId);
            } else {
                yield* transactionEntryRepository.deleteByTransactionId(transactionId);
            }

            const valuations = yield* entryBaseValuationService.valueEntries(input.entries, operatedAt);

            yield* transactionEntryRepository.bulkCreate(
                input.entries.map(entry => transactionMapEntryInputToCreateEntity(entry, transactionId, valuations.get(entry)))
            );

            const existingTags = yield* transactionTagsRepository.findByTransactionId(transactionId);

            yield* transactionTagsRepository.deleteByTransactionId(transactionId);
            yield* transactionTagsRepository.bulkCreate(
                transactionMapTagIdsToCreateEntities(input, transactionId, new Map(existingTags.map(tag => [tag.tagId, tag.source])))
            );
        });

        const bulkCreate = Effect.fn('TransactionService.bulkCreate')(
            function* (inputs: TransactionCreateInputInterface[], batchSize: number = TRANSACTION_BATCH_SIZE) {
                if (!isNotEmptyArray(inputs)) {
                    return [];
                }

                const stampedInputs = stampForDeferredEmbedding(inputs);

                yield* transactionDepositSafetyService.assertNoDepositExpenseInputs(stampedInputs);

                const transactions = yield* processInputWithBatches(stampedInputs, batchSize, batch =>
                    transactionBatchCreateService.create(batch)
                );

                if (isNotEmptyArray(transactions)) {
                    yield* accountBalanceIncrementalService.updateBalancesByAccountIds(getEntryAccountIds(inputs));
                }

                return transactions;
            },
            effect => Db.transaction(effect)
        );

        return {
            bulkCreate,
            bulkUpdateImported: Effect.fn('TransactionService.bulkUpdateImported')(
                function* (inputs: TransactionCreateInputInterface[]) {
                    yield* importedTransactionEntryUpdateService.bulkUpdate(inputs);
                },
                effect => Db.transaction(effect)
            ),
            deleteById: Effect.fn('TransactionService.deleteById')(
                function* (id: number) {
                    const transaction = yield* transactionRepository.getByIdWithEntries(id);
                    const accountIds = getAccountIdsFromTransactions(isDefined(transaction) ? [transaction] : []);

                    if (isDefined(transaction?.consolidationType)) {
                        yield* unconsolidateByIdInTransaction(id);
                        yield* accountBalanceIncrementalService.updateAllBalances(true);
                    } else {
                        yield* transactionRepository.deleteById(id);
                        yield* transactionTagsRepository.deleteByTransactionId(id);
                        yield* transactionEntryRepository.deleteByTransactionId(id);
                        yield* accountBalanceIncrementalService.updateBalancesByAccountIds(accountIds);
                    }
                },
                effect => Db.transaction(effect)
            ),
            unconsolidateById: Effect.fn('TransactionService.unconsolidateById')(
                function* (id: number) {
                    yield* unconsolidateByIdInTransaction(id);
                    yield* accountBalanceIncrementalService.updateAllBalances(true);
                },
                effect => Db.transaction(effect)
            ),
            findByExternalSource: Effect.fn('TransactionService.findByExternalSource')(function* (externalSource: ExternalSourceEnum) {
                return new Set(yield* transactionRepository.findExternalIdsByExternalSource(externalSource));
            }),
            findIdMapByExternalSource: Effect.fn('TransactionService.findIdMapByExternalSource')(function* (
                externalSource: ExternalSourceEnum
            ) {
                return yield* transactionRepository.findIdMapByExternalSource(externalSource);
            }),
            createBalanceAdjustment: Effect.fn('TransactionService.createBalanceAdjustment')(function* (
                accountId: number,
                delta: number,
                operatedAt: Date
            ) {
                const isIncome = isPositiveNumber(delta);
                const amount = Math.abs(delta);
                const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
                    accountId,
                    amount,
                    operatedAt
                });

                const transaction = yield* transactionRepository.create({
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
                });

                yield* transactionEntryRepository.create({
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
                });

                return transaction.id;
            }),
            moveExternalEntryToAccount: Effect.fn('TransactionService.moveExternalEntryToAccount')(
                function* (transactionId: number, externalId: string, accountId: number, isIncome: boolean) {
                    const existingEntry = yield* transactionEntryRepository.findByTransactionIdAndExternalId(transactionId, externalId);
                    if (!isDefined(existingEntry) || existingEntry.accountId === accountId) {
                        return false;
                    }

                    yield* transactionEntryRepository.updateById(existingEntry.id, { accountId });
                    yield* transactionRepository.updateById(
                        existingEntry.originalTransactionId ?? existingEntry.transactionId,
                        isIncome ? { toAccountId: accountId } : { fromAccountId: accountId }
                    );
                    yield* accountBalanceIncrementalService.updateBalancesByAccountIds([existingEntry.accountId, accountId]);

                    return true;
                },
                effect => Db.transaction(effect)
            ),
            getEarliestTransactionTimeByAccountId: Effect.fn('TransactionService.getEarliestTransactionTimeByAccountId')(function* (
                accountId: number
            ) {
                return yield* transactionRepository.getTransactionTimeByAccountId(accountId, 'earliest');
            }),
            getEarliestTransactionTimeByExternalSource: Effect.fn('TransactionService.getEarliestTransactionTimeByExternalSource')(
                function* (externalSource: ExternalSourceEnum) {
                    return yield* transactionRepository.getEarliestTransactionTimeByExternalSource(externalSource);
                }
            ),
            updateAllBalances: Effect.fn('TransactionService.updateAllBalances')(function* () {
                yield* accountBalanceIncrementalService.updateAllBalances(true);
            }),
            createInternal: Effect.fn('TransactionService.createInternal')(
                function* (input: TransactionCreateInputInterface) {
                    const [transaction] = yield* bulkCreate([input]);

                    return transaction;
                },
                effect => Db.transaction(effect)
            ),
            updateById: Effect.fn('TransactionService.updateById')(
                function* (id: number, input: TransactionUpdateServiceInputInterface) {
                    const existingTransaction = yield* transactionRepository.getByIdWithEntries(id);
                    yield* transactionDepositSafetyService.assertNoDepositExpenseInputs([
                        {
                            entries: input.entries,
                            fromAccountId: input.fromAccountId ?? existingTransaction?.fromAccountId ?? null,
                            type: input.type ?? existingTransaction?.type ?? TransactionTypeEnum.EXPENSE
                        }
                    ]);

                    const isConsolidated = isDefined(existingTransaction?.consolidationType);
                    const transaction = yield* transactionRepository.updateById(id, {
                        title: input.title,
                        comment: input.comment,
                        type: input.type,
                        operatedAt: input.operatedAt,
                        fromAccountId: input.fromAccountId,
                        toAccountId: input.toAccountId,
                        exchangeRate: input.exchangeRate,
                        updatedBy: TransactionUpdatedByEnum.USER
                    });

                    yield* upsertTransactionEntriesAndTags({
                        transactionId: id,
                        input,
                        operatedAt: transaction.operatedAt,
                        isConsolidated
                    });
                    yield* transactionDebtSettlementService.resyncInTransaction(id);

                    yield* accountBalanceIncrementalService.updateBalancesByAccountIds([
                        ...getAccountIdsFromTransactions(isDefined(existingTransaction) ? [existingTransaction] : []),
                        ...getEntryAccountIds([input])
                    ]);

                    return transaction;
                },
                effect => Db.transaction(effect)
            )
        };
    })
}) {
    static readonly layer = Layer.effect(TransactionService, TransactionService.make).pipe(
        Layer.provide([
            TransactionEntryRepository.layer,
            TransactionRepository.layer,
            TransactionTagsRepository.layer,
            AccountBalanceIncrementalService.layer,
            EntryBaseValuationService.layer,
            ImportedTransactionEntryUpdateService.layer,
            TransactionBatchCreateService.layer,
            TransactionDebtSettlementService.layer,
            TransactionDepositSafetyService.layer,
            UnconsolidationService.layer
        ])
    );
}
