import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    DebtEventDirectionEnum,
    DebtEventSourceEnum,
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryKindEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

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

import type { AccountEntityInterface, DB, TransactionEntryEntityInterface } from '@budgie/contracts';

class TransactionBatchCreateService {
    @Log(
        (batch, tx) =>
            `enter count=${batch.length} externalIds=${batch
                .slice(0, 5)
                .map(input => input.externalId)
                .join(',')} hasTx=${String(isDefined(tx))}`,
        (result, batch, tx) =>
            `done count=${batch.length} externalIds=${batch
                .slice(0, 5)
                .map(input => input.externalId)
                .join(',')} hasTx=${String(isDefined(tx))} insertedIds=${result
                .slice(0, 5)
                .map(row => row.id)
                .join(',')}`,
        (error, batch, tx) =>
            `throw count=${batch.length} externalIds=${batch
                .slice(0, 5)
                .map(input => input.externalId)
                .join(',')} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async create(batch: readonly TransactionCreateInputInterface[], tx: DB): Promise<TransactionEntityInterface[]> {
        const valuations = await Promise.all(
            batch.map(input => entryBaseValuationService.valueEntries(input.entries, input.operatedAt, input.externalSource, tx))
        );
        const transactions = await transactionRepository.bulkCreate([...batch], tx);
        const batchEntries = transactions.flatMap((transaction, index) =>
            batch[index].entries.map(entry => transactionMapEntryInputToCreateEntity(entry, transaction.id, valuations[index].get(entry)))
        );
        const batchTags = transactions.flatMap((transaction, index) =>
            transactionMapTagIdsToCreateEntities(batch[index].tagIds, transaction.id)
        );
        const createdEntries = await transactionEntryRepository.bulkCreate(batchEntries, tx);

        await Promise.all([
            this.createDebtEventsFromInputs(batch, transactions, createdEntries, tx),
            transactionTagsRepository.bulkCreate(batchTags, tx)
        ]);

        return transactions;
    }

    private async createDebtEventsFromInputs(
        batch: readonly TransactionCreateInputInterface[],
        transactions: TransactionEntityInterface[],
        createdEntries: TransactionEntryEntityInterface[],
        tx: DB
    ): Promise<void> {
        const createdEntriesByTransactionId = this.getCreatedEntriesByTransactionId(createdEntries);

        await Promise.all(
            transactions.flatMap((transaction, index) =>
                isDefined(batch[index].debtAccountId)
                    ? [this.createDebtEvent(batch[index], transaction, createdEntriesByTransactionId, tx)]
                    : []
            )
        );
    }

    private getCreatedEntriesByTransactionId(createdEntries: TransactionEntryEntityInterface[]) {
        return createdEntries.reduce<Map<number, TransactionEntryEntityInterface[]>>((map, entry) => {
            map.set(entry.transactionId, [...(map.get(entry.transactionId) ?? []), entry]);

            return map;
        }, new Map());
    }

    private async createDebtEvent(
        input: TransactionCreateInputInterface,
        transaction: TransactionEntityInterface,
        createdEntriesByTransactionId: Map<number, TransactionEntryEntityInterface[]>,
        tx: DB
    ): Promise<void> {
        const debtAccount = isDefined(input.debtAccountId) ? await accountRepository.findById(input.debtAccountId, tx) : null;
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
        const valuation = await entryBaseValuationService.valueMicroUnitEntry({
            accountId: debtAccount.id,
            amount,
            operatedAt: input.operatedAt,
            externalSource: input.externalSource,
            tx
        });

        await debtEventRepository.create(
            {
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
            },
            tx
        );
    }

    private getIncomeDebtEventDirection(debtAccount: Pick<AccountEntityInterface, 'debtType'>): DebtEventDirectionEnum {
        return debtAccount.debtType === AccountDebtTypeEnum.BORROW ? DebtEventDirectionEnum.OPEN : DebtEventDirectionEnum.CLOSE;
    }
}

export const transactionBatchCreateService = new TransactionBatchCreateService();
