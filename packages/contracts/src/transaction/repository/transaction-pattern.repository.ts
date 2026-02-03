import { SQL, and, desc, eq, gte, isNotNull, isNull, lte, ne, sql } from 'drizzle-orm';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { UserIconNameEnum } from '../../@generic/enum/user-icon-name.enum';
import { DB } from '../../@generic/type/db.type';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { RepeatedTransactionPatternInterface } from '../interface/repeated-transaction-pattern.interface';
import { TransactionPatternQueryInterface } from '../interface/transaction-pattern-query.interface';
import { TransactionEntityTable } from '../table/transaction-entity.table';

interface PatternRowInterface {
    readonly categoryId: number | null;
    readonly categoryTitle: string | null;
    readonly categoryIcon: UserIconNameEnum | null;
    readonly title: string;
    readonly averageAmount: number;
    readonly occurrenceCount: number;
    readonly lastOccurrence: number;
}

interface ValidPatternRowInterface {
    readonly categoryId: number;
    readonly categoryTitle: string;
    readonly categoryIcon: UserIconNameEnum;
    readonly title: string;
    readonly averageAmount: number;
    readonly occurrenceCount: number;
    readonly lastOccurrence: number;
}

const isValidPatternRow = (row: PatternRowInterface): row is ValidPatternRowInterface =>
    isDefined(row.categoryId) && isDefined(row.categoryTitle) && isDefined(row.categoryIcon);

const DEFAULT_LIMIT = 10;
const MIN_OCCURRENCES = 2;

export class TransactionPatternRepository {
    constructor(private db: DB) {}

    async findRepeatedPatterns(query: TransactionPatternQueryInterface): Promise<RepeatedTransactionPatternInterface[]> {
        const conditions = this.buildPatternConditions(query);
        const patternRows = await this.executePatternQuery(conditions, query.limit ?? DEFAULT_LIMIT);

        return this.enrichPatternsWithTags(patternRows);
    }

    private buildPatternConditions(query: TransactionPatternQueryInterface): SQL[] {
        const entryType = this.getEntryTypeForTransactionType(query.type);

        const weekdayCondition = sql`CAST(strftime('%w', ${TransactionEntityTable.operatedAt}, 'unixepoch') AS INTEGER) = ${query.weekday}`;

        const timeCondition = sql`
            CAST(strftime('%H', ${TransactionEntityTable.operatedAt}, 'unixepoch') AS INTEGER) * 60 +
            CAST(strftime('%M', ${TransactionEntityTable.operatedAt}, 'unixepoch') AS INTEGER)
            BETWEEN ${query.timeWindowStartMinutes} AND ${query.timeWindowEndMinutes}
        `;

        const conditions: SQL[] = [
            eq(TransactionEntityTable.type, query.type),
            isNull(TransactionEntityTable.deletedAt),
            weekdayCondition,
            timeCondition,
            eq(TransactionEntryEntityTable.type, entryType),
            ne(AccountEntityTable.type, AccountTypeEnum.DEBT),
            isNotNull(TransactionEntryEntityTable.categoryId)
        ];

        this.addOptionalConditions(conditions, query);

        return conditions;
    }

    private addOptionalConditions(conditions: SQL[], query: TransactionPatternQueryInterface): void {
        if (isPositiveNumber(query.accountId)) {
            conditions.push(eq(TransactionEntryEntityTable.accountId, query.accountId));
        }

        if (isPositiveNumber(query.categoryId)) {
            conditions.push(eq(TransactionEntryEntityTable.categoryId, query.categoryId));
        }

        if (isPositiveNumber(query.amountMin)) {
            conditions.push(gte(TransactionEntryEntityTable.amount, query.amountMin));
        }

        if (isPositiveNumber(query.amountMax)) {
            conditions.push(lte(TransactionEntryEntityTable.amount, query.amountMax));
        }
    }

    private async executePatternQuery(conditions: SQL[], limit: number): Promise<PatternRowInterface[]> {
        return this.db
            .select({
                categoryId: TransactionEntryEntityTable.categoryId,
                categoryTitle: CategoryEntityTable.title,
                categoryIcon: CategoryEntityTable.icon,
                title: TransactionEntityTable.title,
                averageAmount: sql<number>`CAST(AVG(${TransactionEntryEntityTable.amount}) AS INTEGER)`.as('averageAmount'),
                occurrenceCount: sql<number>`COUNT(DISTINCT ${TransactionEntityTable.id})`.as('occurrenceCount'),
                lastOccurrence: sql<number>`MAX(${TransactionEntityTable.operatedAt})`.as('lastOccurrence')
            })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
            .leftJoin(CategoryEntityTable, eq(TransactionEntryEntityTable.categoryId, CategoryEntityTable.id))
            .where(and(...conditions))
            .groupBy(TransactionEntryEntityTable.categoryId, TransactionEntityTable.title)
            .having(sql`COUNT(DISTINCT ${TransactionEntityTable.id}) >= ${MIN_OCCURRENCES}`)
            .orderBy(desc(sql`COUNT(DISTINCT ${TransactionEntityTable.id})`))
            .limit(limit);
    }

    private async enrichPatternsWithTags(patternRows: PatternRowInterface[]): Promise<RepeatedTransactionPatternInterface[]> {
        if (!isNotEmptyArray(patternRows)) {
            return [];
        }

        const validRows = patternRows.filter(isValidPatternRow);
        const tagPromises = validRows.map(row => this.findMostCommonTagsForPattern(row.categoryId, row.title));
        const tagResults = await Promise.all(tagPromises);

        return validRows.map((row, index) => ({
            categoryId: row.categoryId,
            categoryTitle: row.categoryTitle,
            categoryIcon: row.categoryIcon,
            tagIds: tagResults[index],
            title: row.title,
            averageAmount: row.averageAmount,
            occurrenceCount: row.occurrenceCount,
            lastOccurrence: new Date(row.lastOccurrence * 1000)
        }));
    }

    private async findMostCommonTagsForPattern(categoryId: number, title: string): Promise<number[]> {
        const tagRows = await this.db
            .select({
                tagId: TransactionTagsEntityTable.tagId
            })
            .from(TransactionTagsEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionTagsEntityTable.transactionId, TransactionEntityTable.id))
            .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .where(
                and(
                    eq(TransactionEntryEntityTable.categoryId, categoryId),
                    eq(TransactionEntityTable.title, title),
                    isNull(TransactionEntityTable.deletedAt)
                )
            )
            .groupBy(TransactionTagsEntityTable.tagId)
            .orderBy(desc(sql`COUNT(${TransactionTagsEntityTable.tagId})`))
            .limit(5);

        return tagRows.map(row => row.tagId);
    }

    private getEntryTypeForTransactionType(type: TransactionTypeEnum): TransactionEntryTypeEnum {
        return type === TransactionTypeEnum.EXPENSE ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT;
    }
}
