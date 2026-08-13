import { MccCategoryEntityTable, TransactionEntityTable, TransactionEntryEntityTable, TransactionTagsEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';

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
        const row = this.findTransactionById(id);

        if (!isDefined(row)) {
            throw new Error(`Transaction ${id} not found`);
        }

        return row;
    }

    findTransactionById(id: number): TransactionEntityInterface | undefined {
        const [row] = this.database.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, id)).all();

        return row;
    }

    fetchChildTransactionIds(parentTransactionId: number): number[] {
        return this.database
            .select({ id: TransactionEntityTable.id })
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.consolidationParentTransactionId, parentTransactionId))
            .all()
            .map(row => row.id);
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

    findMccByCode(mcc: string): Pick<MccCategoryEntityInterface, 'id' | 'mccGroupId'> {
        const [row] = this.database.select().from(MccCategoryEntityTable).where(eq(MccCategoryEntityTable.mcc, mcc)).all();

        if (!isDefined(row)) {
            throw new Error(`MCC ${mcc} not found`);
        }

        return { id: row.id, mccGroupId: row.mccGroupId };
    }
}
