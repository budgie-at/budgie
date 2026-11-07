import {
    ExternalSourceEnum,
    TRANSFER_PAIR_TIME_WINDOW_SECONDS,
    AccountTypeEnum,
    TransactionEntityTable,
    Db,
    TransactionTypeEnum,
    transactionFilters
} from '@budgie/contracts';
import { inArray } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export class OwnTransferRepository extends Context.Service<OwnTransferRepository>()('@budgie/sync/OwnTransferRepository', {
    make: Effect.succeed({
        findTransactions: (scope: ConsolidationScanScopeInterface | null) =>
            Db.query(db =>
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
                        ...(isDefined(scope) && {
                            operatedAt: {
                                gte: new Date(scope.operatedAtFrom.getTime() - TRANSFER_PAIR_TIME_WINDOW_SECONDS * 1000),
                                lte: new Date(scope.operatedAtTo.getTime() + TRANSFER_PAIR_TIME_WINDOW_SECONDS * 1000)
                            }
                        }),
                        updatedBy: { isNull: true },
                        externalSource: { isNotNull: true },
                        type: { in: [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME] }
                    },
                    with: { entries: { where: transactionFilters.ledgerEntryFilter } }
                })
            ),
        findAccounts: Db.query(db =>
            db.query.AccountEntityTable.findMany({
                where: { deletedAt: { isNull: true }, isExternal: false, NOT: { type: AccountTypeEnum.DEBT } }
            })
        ),
        findIdentities: Db.query(db =>
            db.query.BankIntegrationEntityTable.findMany({
                where: { provider: ExternalSourceEnum.MONOBANK, deletedAt: { isNull: true }, label: { isNotNull: true } },
                columns: { label: true }
            })
        )
    })
}) {
    static readonly layer = Layer.effect(OwnTransferRepository, OwnTransferRepository.make);
}
