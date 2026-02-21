import { SQL, and, eq, inArray, isNotNull, isNull, like, ne, or, sql } from 'drizzle-orm';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { TX } from '../../@generic/type/db.type';
import { AccountAssociationEnum } from '../../account/enum/account-association.enum';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { TransactionEntryAssociationEnum } from '../../transaction-entry/enum/transaction-entry-association.enum';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsAssociationEnum } from '../../transaction-tags/enum/transaction-tags-association.enum';
import { DEFAULT_TRANSACTION_FILTER } from '../constant/default-transaction-filter.constant';
import { TransactionCreateEntityInterface } from '../entity/transaction-create-entity.interface';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionFilterInterface } from '../interface/transaction-filter.interface';
import { TransactionEntityTable } from '../table/transaction-entity.table';

import type { TransactionEntityInterface } from '../entity/transaction-entity.interface';
import type { TransactionWithEntriesEntityInterface } from '../entity/transaction-with-entries-entity.interface';

export class TransactionRepository extends BaseTransactionFilterRepository {
    private transactionRelations = {
        [TransactionAssociationEnum.ENTRIES]: {
            with: {
                [TransactionEntryAssociationEnum.ACCOUNT]: {
                    with: {
                        [AccountAssociationEnum.INSTRUMENT]: true
                    }
                },
                [TransactionEntryAssociationEnum.CATEGORY]: true,
                [TransactionEntryAssociationEnum.MCC_CATEGORY]: true
            }
        },
        [TransactionAssociationEnum.TRANSACTION_TAGS]: {
            with: {
                [TransactionTagsAssociationEnum.TAG]: true
            }
        },
        [TransactionAssociationEnum.FROM_ACCOUNT]: true,
        [TransactionAssociationEnum.TO_ACCOUNT]: true
    } as const;

    async deleteById(id: number, tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(TransactionEntityTable).where(eq(TransactionEntityTable.id, id));
    }

    async create(input: TransactionCreateEntityInterface, tx?: TX): Promise<TransactionEntityInterface> {
        const [transaction] = await this.bulkCreate([input], tx);

        return transaction;
    }

    async bulkCreate(inputs: TransactionCreateEntityInterface[], tx?: TX): Promise<TransactionEntityInterface[]> {
        if (isNotEmptyArray(inputs)) {
            return await (tx ?? this.db).insert(TransactionEntityTable).values(inputs).returning();
        }

        return [];
    }

    async updateById(id: number, input: Partial<TransactionCreateEntityInterface>, tx?: TX): Promise<TransactionEntityInterface> {
        const [transaction] = await (tx ?? this.db)
            .update(TransactionEntityTable)
            .set(input)
            .where(eq(TransactionEntityTable.id, id))
            .returning();

        return transaction;
    }

    getAll(limit = 20, filters: TransactionFilterInterface = DEFAULT_TRANSACTION_FILTER) {
        const where = this.buildWhere(filters);

        return this.db.query.TransactionEntityTable.findMany({
            with: this.transactionRelations,
            orderBy: (transaction, { desc }) => [desc(transaction.operatedAt)],
            limit,
            ...(isDefined(where) ? { where } : {})
        });
    }

    getAllWithOffset(limit: number, offset: number) {
        return this.db.query.TransactionEntityTable.findMany({
            with: { [TransactionAssociationEnum.ENTRIES]: true },
            orderBy: (transaction, { desc }) => [desc(transaction.id)],
            limit,
            offset,
            where: isNull(TransactionEntityTable.deletedAt)
        });
    }

    getById(id: number) {
        return this.db.query.TransactionEntityTable.findFirst({
            where: eq(TransactionEntityTable.id, id),
            with: this.transactionRelations
        });
    }

    async truncate(tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(TransactionEntityTable);
    }

    async findExternalIdsByExternalSource(externalSource: ExternalSourceEnum): Promise<string[]> {
        const results = await this.db
            .select({ externalId: TransactionEntityTable.externalId })
            .from(TransactionEntityTable)
            .where(
                and(
                    eq(TransactionEntityTable.externalSource, externalSource),
                    isNotNull(TransactionEntityTable.externalId),
                    isNull(TransactionEntityTable.deletedAt)
                )
            );

        return results.map(row => row.externalId).filter((id): id is string => id !== null);
    }

    async findByAccountId(accountId: number): Promise<TransactionEntityInterface[]> {
        return await this.db.query.TransactionEntityTable.findMany({
            where: or(eq(TransactionEntityTable.fromAccountId, accountId), eq(TransactionEntityTable.toAccountId, accountId)),
            orderBy: (transaction, { desc }) => [desc(transaction.operatedAt)]
        });
    }

    async getTransactionTimeByAccountId(accountId: number, mode: 'latest' | 'earliest'): Promise<Date | null> {
        const aggregateSql =
            mode === 'latest'
                ? sql<number | null>`MAX(${TransactionEntityTable.operatedAt})`
                : sql<number | null>`MIN(${TransactionEntityTable.operatedAt})`;

        const result = await this.db
            .select({ operatedAt: aggregateSql })
            .from(TransactionEntityTable)
            .where(
                and(
                    or(eq(TransactionEntityTable.fromAccountId, accountId), eq(TransactionEntityTable.toAccountId, accountId)),
                    ne(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT)
                )
            );

        const time = result[0]?.operatedAt;
        if (isPositiveNumber(time)) {
            return new Date(time * 1000);
        }

        return null;
    }

    async archiveByAccountIds(accountIds: number[], tx?: TX): Promise<void> {
        await (tx ?? this.db)
            .update(TransactionEntityTable)
            .set({ deletedAt: new Date() })
            .where(
                and(
                    or(inArray(TransactionEntityTable.toAccountId, accountIds), inArray(TransactionEntityTable.fromAccountId, accountIds)),
                    ne(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER)
                )
            );
    }

    async restoreByAccountIds(accountIds: number[], tx?: TX): Promise<void> {
        await (tx ?? this.db)
            .update(TransactionEntityTable)
            .set({ deletedAt: null })
            .where(or(inArray(TransactionEntityTable.toAccountId, accountIds), inArray(TransactionEntityTable.fromAccountId, accountIds)));
    }

    async findTransfersByAccountId(accountId: number, tx?: TX): Promise<TransactionWithEntriesEntityInterface[]> {
        return await (tx ?? this.db).query.TransactionEntityTable.findMany({
            where: this.buildTransfersByAccountIdWhere(accountId),
            with: this.transactionRelations
        });
    }

    async findTransfersForConversion(accountId: number, tx?: TX): Promise<TransactionWithEntriesEntityInterface[]> {
        return await (tx ?? this.db).query.TransactionEntityTable.findMany({
            where: this.buildTransfersByAccountIdWhere(accountId),
            with: { [TransactionAssociationEnum.ENTRIES]: true }
        });
    }

    async deleteByAccountId(accountId: number, tx?: TX): Promise<void> {
        await (tx ?? this.db)
            .delete(TransactionEntityTable)
            .where(
                and(
                    or(eq(TransactionEntityTable.fromAccountId, accountId), eq(TransactionEntityTable.toAccountId, accountId)),
                    ne(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER)
                )
            );
    }

    async convertTransfersFromAccountToIncome(accountId: number, tx?: TX, additionalFilter?: SQL): Promise<void> {
        await (tx ?? this.db)
            .update(TransactionEntityTable)
            .set({ type: TransactionTypeEnum.INCOME, fromAccountId: sql`NULL`, exchangeRate: 1 })
            .where(
                and(
                    eq(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER),
                    eq(TransactionEntityTable.fromAccountId, accountId),
                    additionalFilter
                )
            );
    }

    async convertTransfersToAccountToExpense(accountId: number, tx?: TX, additionalFilter?: SQL): Promise<void> {
        await (tx ?? this.db)
            .update(TransactionEntityTable)
            .set({ type: TransactionTypeEnum.EXPENSE, toAccountId: sql`NULL`, exchangeRate: 1 })
            .where(
                and(
                    eq(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER),
                    eq(TransactionEntityTable.toAccountId, accountId),
                    additionalFilter
                )
            );
    }

    async unconsolidateTransfersByAccountIds(accountIds: number[], tx?: TX): Promise<void> {
        const autoConsolidatedFilter = like(TransactionEntityTable.comment, '%[Automatically consolidated from:%');

        for (const accountId of accountIds) {
            await this.convertTransfersFromAccountToIncome(accountId, tx, autoConsolidatedFilter);
            await this.convertTransfersToAccountToExpense(accountId, tx, autoConsolidatedFilter);
        }
    }

    protected override buildAccountCondition(accountIds: number[] | null) {
        if (isNotEmptyArray(accountIds)) {
            const condition = or(
                inArray(TransactionEntityTable.fromAccountId, accountIds),
                inArray(TransactionEntityTable.toAccountId, accountIds)
            );

            return isDefined(condition) ? [condition] : [];
        }

        return [];
    }

    private buildTransfersByAccountIdWhere(accountId: number) {
        return and(
            eq(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER),
            or(eq(TransactionEntityTable.fromAccountId, accountId), eq(TransactionEntityTable.toAccountId, accountId))
        );
    }

    private buildWhere({ types, tagIds, categoryIds, accountIds, date }: TransactionFilterInterface) {
        const conditions: SQL[] = [
            ...this.buildAccountCondition(accountIds),
            ...(isNotEmptyArray(types) ? [this.buildTypeCondition(types)] : []),
            ...(isDefined(categoryIds) ? [this.buildCategoryCondition(categoryIds)] : []),
            ...(isNotEmptyArray(tagIds) ? [this.buildTagCondition(tagIds)] : []),
            ...(isDefined(date) ? [this.buildDateCondition(date)] : [])
        ].filter(isDefined);

        return isNotEmptyArray(conditions) ? and(...conditions) : null;
    }

    private buildTypeCondition(types: TransactionTypeEnum[]) {
        const typeConditions = [
            inArray(TransactionEntityTable.type, types),
            ...(types.includes(TransactionTypeEnum.EXPENSE) ? [this.buildAdjustmentCondition(TransactionEntryTypeEnum.CREDIT)] : []),
            ...(types.includes(TransactionTypeEnum.INCOME) ? [this.buildAdjustmentCondition(TransactionEntryTypeEnum.DEBIT)] : [])
        ].filter(isDefined);

        return isNotEmptyArray(typeConditions) ? or(...typeConditions) : null;
    }

    private buildAdjustmentCondition(type: TransactionEntryTypeEnum) {
        return and(
            eq(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT),
            inArray(
                TransactionEntityTable.id,
                this.db
                    .select({ transactionId: TransactionEntryEntityTable.transactionId })
                    .from(TransactionEntryEntityTable)
                    .where(eq(TransactionEntryEntityTable.type, type))
            )
        );
    }
}
