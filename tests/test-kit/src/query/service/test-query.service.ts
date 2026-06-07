import {
    MccCategoryEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTagsEntityTable
} from '@budgie/contracts';
import { and, eq, isNull } from 'drizzle-orm';

import { isDefined } from '@rnw-community/shared';

import type {
    DB,
    MccCategoryEntityInterface,
    TransactionConsolidationTypeEnum,
    TransactionEntityInterface,
    TransactionEntryEntityInterface
} from '@budgie/contracts';

export class TestQueryService {
    constructor(private readonly database: DB) {}

    fetchCanonicalsOfType(consolidationType: TransactionConsolidationTypeEnum): TransactionEntityInterface[] {
        return this.database
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.consolidationType, consolidationType))
            .all();
    }

    fetchTransactionById(id: number): TransactionEntityInterface {
        const [row] = this.database.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, id)).all();

        if (!isDefined(row)) {
            throw new Error(`Transaction ${id} not found`);
        }

        return row;
    }

    fetchEntriesByTransactionId(transactionId: number): TransactionEntryEntityInterface[] {
        return this.database
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, transactionId))
            .all();
    }

    fetchEntryByExternalId(externalId: string): TransactionEntryEntityInterface {
        const [row] = this.database
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, externalId))
            .all();

        if (!isDefined(row)) {
            throw new Error(`Transaction entry ${externalId} not found`);
        }

        return row;
    }

    fetchTransactionTagIds(transactionId: number): number[] {
        return this.database
            .select({ tagId: TransactionTagsEntityTable.tagId })
            .from(TransactionTagsEntityTable)
            .where(eq(TransactionTagsEntityTable.transactionId, transactionId))
            .all()
            .map(row => row.tagId);
    }

    fetchLiveBalanceByAccount(accountId: number): number {
        const rows = this.database
            .select({ type: TransactionEntryEntityTable.type, amount: TransactionEntryEntityTable.amount })
            .from(TransactionEntryEntityTable)
            .where(
                and(
                    eq(TransactionEntryEntityTable.accountId, accountId),
                    isNull(TransactionEntryEntityTable.deletedAt),
                    isNull(TransactionEntryEntityTable.originalTransactionId)
                )
            )
            .all();

        return rows.reduce((balance, row) => {
            if (row.type === TransactionEntryTypeEnum.DEBIT) {
                return balance + row.amount;
            }

            return balance - row.amount;
        }, 0);
    }

    findMccByCode(mcc: string): Pick<MccCategoryEntityInterface, 'id' | 'mccGroupId'> {
        const [row] = this.database.select().from(MccCategoryEntityTable).where(eq(MccCategoryEntityTable.mcc, mcc)).all();

        if (!isDefined(row)) {
            throw new Error(`MCC ${mcc} not found`);
        }

        return { id: row.id, mccGroupId: row.mccGroupId };
    }
}
