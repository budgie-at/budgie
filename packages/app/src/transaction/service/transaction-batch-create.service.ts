import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    DebtEventDirectionEnum,
    DebtEventSourceEnum,
    Db,
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryKindEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import {
    accountRepository,
    debtEventRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { transactionMapEntryInputToCreateEntity } from '../utils/transaction-map-entry-input-to-create-entity.util';
import { transactionMapTagIdsToCreateEntities } from '../utils/transaction-map-tag-ids-to-create-entities.util';

import type { AccountEntityInterface, TransactionEntryEntityInterface } from '@budgie/contracts';

class TransactionBatchCreateService {
    readonly create = Effect.fn('TransactionBatchCreateService.create')(function* (
        this: TransactionBatchCreateService,
        batch: readonly TransactionCreateInputInterface[]
    ) {
        const valuations = yield* entryBaseValuationService.valueTransactionsEntries(batch);
        const transactions = yield* transactionRepository.bulkCreate([...batch]);
        const batchEntries = transactions.flatMap((transaction, index) =>
            batch[index].entries.map(entry => transactionMapEntryInputToCreateEntity(entry, transaction.id, valuations[index].get(entry)))
        );
        const batchTags = transactions.flatMap((transaction, index) =>
            transactionMapTagIdsToCreateEntities(batch[index].tagIds, transaction.id)
        );
        const createdEntries = yield* transactionEntryRepository.bulkCreate(batchEntries);

        yield* Effect.all(
            [this.createDebtEventsFromInputs(batch, transactions, createdEntries), transactionTagsRepository.bulkCreate(batchTags)],
            {
                concurrency: 'unbounded'
            }
        );

        return transactions;
    });

    private readonly createDebtEventsFromInputs = Effect.fnUntraced(function* (
        this: TransactionBatchCreateService,
        batch: readonly TransactionCreateInputInterface[],
        transactions: TransactionEntityInterface[],
        createdEntries: TransactionEntryEntityInterface[]
    ) {
        const createdEntriesByTransactionId = this.getCreatedEntriesByTransactionId(createdEntries);

        yield* Effect.all(
            transactions.flatMap((transaction, index) =>
                isDefined(batch[index].debtAccountId)
                    ? [this.createDebtEvent(batch[index], transaction, createdEntriesByTransactionId)]
                    : []
            ),
            { concurrency: 'unbounded' }
        );
    });

    private readonly createDebtEvent = Effect.fnUntraced(function* (
        this: TransactionBatchCreateService,
        input: TransactionCreateInputInterface,
        transaction: TransactionEntityInterface,
        createdEntriesByTransactionId: Map<number, TransactionEntryEntityInterface[]>
    ) {
        const { debtAccountId } = input;
        const debtAccount = isDefined(debtAccountId) ? yield* Db.query(db => accountRepository.findById(debtAccountId, db)) : null;
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
            operatedAt: input.operatedAt,
            externalSource: input.externalSource
        });

        yield* debtEventRepository.create({
            debtAccountId: debtAccount.id,
            transactionId: transaction.id,
            direction: this.getIncomeDebtEventDirection(debtAccount),
            source: DebtEventSourceEnum.INCOME_ATTACHMENT,
            amount,
            ...(isDefined(primaryEntries[0]) && primaryEntries.length === 1 && { transactionEntryId: primaryEntries[0].id }),
            baseInstrumentId: valuation.baseInstrumentId,
            baseExchangeRate: valuation.baseExchangeRate,
            baseAmount: valuation.baseAmount,
            operatedAt: input.operatedAt
        });
    });

    private getCreatedEntriesByTransactionId(createdEntries: TransactionEntryEntityInterface[]) {
        return createdEntries.reduce<Map<number, TransactionEntryEntityInterface[]>>((map, entry) => {
            map.set(entry.transactionId, [...(map.get(entry.transactionId) ?? []), entry]);

            return map;
        }, new Map());
    }

    private getIncomeDebtEventDirection(debtAccount: Pick<AccountEntityInterface, 'debtType'>): DebtEventDirectionEnum {
        return debtAccount.debtType === AccountDebtTypeEnum.BORROW ? DebtEventDirectionEnum.OPEN : DebtEventDirectionEnum.CLOSE;
    }
}

export const transactionBatchCreateService = new TransactionBatchCreateService();
