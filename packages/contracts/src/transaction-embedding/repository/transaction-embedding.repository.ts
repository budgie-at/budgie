import { and, count, eq, isNull } from 'drizzle-orm';

import { AccountAssociationEnum } from '../../account/enum/account-association.enum';
import { TransactionAssociationEnum } from '../../transaction/enum/transaction-association.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryAssociationEnum } from '../../transaction-entry/enum/transaction-entry-association.enum';
import { TransactionTagsAssociationEnum } from '../../transaction-tags/enum/transaction-tags-association.enum';
import { PendingEmbeddingRowInterface } from '../interface/pending-embedding-row.interface';

import type { DB } from '../../@generic/type/db.type';

export class TransactionEmbeddingRepository {
    constructor(private readonly db: DB) {}

    async countPending(tx?: DB): Promise<number> {
        const [row] = await (tx ?? this.db)
            .select({ value: count() })
            .from(TransactionEntityTable)
            .where(and(eq(TransactionEntityTable.needsEmbedding, true), isNull(TransactionEntityTable.deletedAt)));

        return row.value;
    }

    async findPending(limit: number, tx?: DB): Promise<PendingEmbeddingRowInterface[]> {
        return (tx ?? this.db).query.TransactionEntityTable.findMany({
            where: and(eq(TransactionEntityTable.needsEmbedding, true), isNull(TransactionEntityTable.deletedAt)),
            orderBy: (transaction, { asc }) => [asc(transaction.id)],
            limit,
            with: {
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
            }
        });
    }
}
