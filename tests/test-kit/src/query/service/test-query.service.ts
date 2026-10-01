import { MccCategoryEntityTable, TransactionEntityTable, TransactionEntryEntityTable, TransactionTagsEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import type { DB, TransactionConsolidationTypeEnum } from '@budgie/contracts';

export class TestQueryService {
    constructor(private readonly database: DB) {}

    fetchCanonicalsOfType(consolidationType: TransactionConsolidationTypeEnum) {
        return Effect.gen({ self: this }, function* () {
            return yield* this.database
                .select()
                .from(TransactionEntityTable)
                .where(eq(TransactionEntityTable.consolidationType, consolidationType));
        });
    }

    fetchTransactionById(id: number) {
        return Effect.gen({ self: this }, function* () {
            const row = yield* this.findTransactionById(id);

            if (!isDefined(row)) {
                throw new Error(`Transaction ${id} not found`);
            }

            return row;
        });
    }

    findTransactionById(id: number) {
        return Effect.gen({ self: this }, function* () {
            const [row] = yield* this.database.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, id)).all();

            return row;
        });
    }

    fetchChildTransactionIds(parentTransactionId: number) {
        return Effect.gen({ self: this }, function* () {
            const rows = yield* this.database
                .select({ id: TransactionEntityTable.id })
                .from(TransactionEntityTable)
                .where(eq(TransactionEntityTable.consolidationParentTransactionId, parentTransactionId));

            return rows.map(row => row.id);
        });
    }

    fetchEntriesByTransactionId(transactionId: number) {
        return Effect.gen({ self: this }, function* () {
            return yield* this.database
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.transactionId, transactionId));
        });
    }

    fetchEntryByExternalId(externalId: string) {
        return Effect.gen({ self: this }, function* () {
            const [row] = yield* this.database
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.externalId, externalId));

            if (!isDefined(row)) {
                throw new Error(`Transaction entry ${externalId} not found`);
            }

            return row;
        });
    }

    fetchTransactionTagIds(transactionId: number) {
        return Effect.gen({ self: this }, function* () {
            const rows = yield* this.database
                .select({ tagId: TransactionTagsEntityTable.tagId })
                .from(TransactionTagsEntityTable)
                .where(eq(TransactionTagsEntityTable.transactionId, transactionId));

            return rows.map(row => row.tagId);
        });
    }

    findMccByCode(mcc: string) {
        return Effect.gen({ self: this }, function* () {
            const [row] = yield* this.database.select().from(MccCategoryEntityTable).where(eq(MccCategoryEntityTable.mcc, mcc)).all();

            if (!isDefined(row)) {
                throw new Error(`MCC ${mcc} not found`);
            }

            return { id: row.id, mccGroupId: row.mccGroupId };
        });
    }
}
