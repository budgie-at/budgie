import {
    AccountDebtTypeEnum,
    AccountRepository,
    AccountTypeEnum,
    DebtEventDirectionEnum,
    DebtEventRepository,
    DebtEventSourceEnum,
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryKindEnum,
    TransactionEntryRepository,
    TransactionRepository,
    TransactionTagsRepository,
    TransactionTypeEnum
} from '@budgie/contracts';
import { EntryBaseValuationService } from '@budgie/market';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { transactionMapEntryInputToCreateEntity } from '../util/transaction-map-entry-input-to-create-entity.util';
import { transactionMapTagIdsToCreateEntities } from '../util/transaction-map-tag-ids-to-create-entities.util';

import type { AccountEntityInterface, TransactionEntryEntityInterface } from '@budgie/contracts';

export class TransactionBatchCreateService extends Context.Service<TransactionBatchCreateService>()(
    '@budgie/ledger/TransactionBatchCreateService',
    {
        make: Effect.gen(function* () {
            const accountRepository = yield* AccountRepository;
            const debtEventRepository = yield* DebtEventRepository;
            const transactionEntryRepository = yield* TransactionEntryRepository;
            const transactionRepository = yield* TransactionRepository;
            const transactionTagsRepository = yield* TransactionTagsRepository;
            const entryBaseValuationService = yield* EntryBaseValuationService;

            const getCreatedEntriesByTransactionId = (createdEntries: TransactionEntryEntityInterface[]) =>
                createdEntries.reduce<Map<number, TransactionEntryEntityInterface[]>>((map, entry) => {
                    map.set(entry.transactionId, [...(map.get(entry.transactionId) ?? []), entry]);

                    return map;
                }, new Map());

            const getIncomeDebtEventDirection = (debtAccount: Pick<AccountEntityInterface, 'debtType'>): DebtEventDirectionEnum =>
                debtAccount.debtType === AccountDebtTypeEnum.BORROW ? DebtEventDirectionEnum.OPEN : DebtEventDirectionEnum.CLOSE;

            const createDebtEvent = Effect.fnUntraced(function* (
                input: TransactionCreateInputInterface,
                transaction: TransactionEntityInterface,
                createdEntriesByTransactionId: Map<number, TransactionEntryEntityInterface[]>
            ) {
                const { debtAccountId } = input;
                const debtAccount = isDefined(debtAccountId) ? yield* accountRepository.findById(debtAccountId) : null;
                const primaryEntries = (createdEntriesByTransactionId.get(transaction.id) ?? []).filter(
                    entry => entry.kind === TransactionEntryKindEnum.PRIMARY
                );

                if (
                    input.type !== TransactionTypeEnum.INCOME ||
                    !isDefined(debtAccount) ||
                    debtAccount.type !== AccountTypeEnum.DEBT ||
                    !isNotEmptyArray(primaryEntries)
                ) {
                    return;
                }

                const amount = primaryEntries.reduce((sum, entry) => sum + entry.amount, 0);
                const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
                    accountId: debtAccount.id,
                    amount,
                    operatedAt: input.operatedAt
                });

                yield* debtEventRepository.create({
                    debtAccountId: debtAccount.id,
                    transactionId: transaction.id,
                    direction: getIncomeDebtEventDirection(debtAccount),
                    source: DebtEventSourceEnum.INCOME_ATTACHMENT,
                    amount,
                    ...(isDefined(primaryEntries[0]) && primaryEntries.length === 1 && { transactionEntryId: primaryEntries[0].id }),
                    baseInstrumentId: valuation.baseInstrumentId,
                    baseExchangeRate: valuation.baseExchangeRate,
                    baseAmount: valuation.baseAmount,
                    operatedAt: input.operatedAt
                });
            });

            const createDebtEventsFromInputs = Effect.fnUntraced(function* (
                batch: readonly TransactionCreateInputInterface[],
                transactions: TransactionEntityInterface[],
                createdEntries: TransactionEntryEntityInterface[]
            ) {
                const createdEntriesByTransactionId = getCreatedEntriesByTransactionId(createdEntries);

                yield* Effect.all(
                    transactions.flatMap((transaction, index) =>
                        isDefined(batch[index].debtAccountId)
                            ? [createDebtEvent(batch[index], transaction, createdEntriesByTransactionId)]
                            : []
                    ),
                    { concurrency: 'unbounded' }
                );
            });

            return {
                create: Effect.fn('TransactionBatchCreateService.create')(function* (batch: readonly TransactionCreateInputInterface[]) {
                    const valuations = yield* entryBaseValuationService.valueTransactionsEntries(batch);
                    const transactions = yield* transactionRepository.bulkCreate([...batch]);
                    const batchEntries = transactions.flatMap((transaction, index) =>
                        batch[index].entries.map(entry =>
                            transactionMapEntryInputToCreateEntity(entry, transaction.id, valuations[index].get(entry))
                        )
                    );
                    const batchTags = transactions.flatMap((transaction, index) =>
                        transactionMapTagIdsToCreateEntities(batch[index].tagIds, transaction.id)
                    );
                    const createdEntries = yield* transactionEntryRepository.bulkCreate(batchEntries);

                    yield* Effect.all(
                        [createDebtEventsFromInputs(batch, transactions, createdEntries), transactionTagsRepository.bulkCreate(batchTags)],
                        { concurrency: 'unbounded' }
                    );

                    return transactions;
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransactionBatchCreateService, TransactionBatchCreateService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            DebtEventRepository.layer,
            TransactionEntryRepository.layer,
            TransactionRepository.layer,
            TransactionTagsRepository.layer,
            EntryBaseValuationService.layer
        ])
    );
}
