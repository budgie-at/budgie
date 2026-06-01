import { eq } from 'drizzle-orm';

import { MccCategoryEntityTable, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';

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
        const row = this.database.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, id)).all()[0];

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
        const row = this.database
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, externalId))
            .all()[0];

        if (!isDefined(row)) {
            throw new Error(`Transaction entry ${externalId} not found`);
        }

        return row;
    }

    findMccByCode(mcc: string): Pick<MccCategoryEntityInterface, 'id' | 'mccGroupId'> {
        const row = this.database.select().from(MccCategoryEntityTable).where(eq(MccCategoryEntityTable.mcc, mcc)).all()[0];

        if (!isDefined(row)) {
            throw new Error(`MCC ${mcc} not found`);
        }

        return { id: row.id, mccGroupId: row.mccGroupId };
    }
}
