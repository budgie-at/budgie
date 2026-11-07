import { AccountTypeEnum, TransactionEntityTable, Db, TransactionTypeEnum, transactionFilters } from '@budgie/contracts';
import { inArray } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

export class OwnTransferRepository extends Context.Service<OwnTransferRepository>()('@budgie/sync/OwnTransferRepository', {
    make: Effect.succeed({
        findTransactions: Db.query(db =>
            db.query.TransactionEntityTable.findMany({
                where: {
                    RAW: table =>
                        inArray(
                            table.id,
                            db
                                .select({ id: TransactionEntityTable.id })
                                .from(TransactionEntityTable)
                                .where(transactionFilters.buildVisibleTransactionCondition())
                        ),
                    updatedBy: { isNull: true },
                    externalSource: { isNotNull: true },
                    type: { in: [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME] }
                },
                with: { entries: { where: transactionFilters.ledgerEntryFilter } }
            })
        ),
        findUntrackedOwnAccount: (instrumentId: number, externalId: string) =>
            Db.query(db =>
                db.query.AccountEntityTable.findFirst({
                    where: { externalId, instrumentId, isExternal: false, deletedAt: { isNull: true } }
                })
            ),
        findAccounts: Db.query(db =>
            db.query.AccountEntityTable.findMany({
                where: { isExternal: false, NOT: { type: AccountTypeEnum.DEBT } }
            })
        ),
        findIdentities: Db.query(db =>
            db.query.BankIntegrationEntityTable.findMany({
                where: { deletedAt: { isNull: true }, label: { isNotNull: true } },
                columns: { label: true }
            })
        )
    })
}) {
    static readonly layer = Layer.effect(OwnTransferRepository, OwnTransferRepository.make);
}
