import { ConsolidationCoordinatorService, buildConsolidationScanScopeSql } from '@budgie/consolidation';
import { Db, HOUSEHOLD_SYNC_ZONE, TransactionTypeEnum } from '@budgie/contracts';
import {
    AccountBalanceIncrementalService,
    InstallmentPlanService,
    LedgerWorkload,
    TransactionDebtSettlementService,
    TransactionTransferService
} from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Semaphore from 'effect/Semaphore';

import { isPositiveNumber } from '@rnw-community/shared';

import type { HouseholdTransferCandidateInterface } from '../interface/household-transfer-candidate.interface';
import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export class TransferConsolidationService extends Context.Service<TransferConsolidationService>()(
    '@budgie/sync/TransferConsolidationService',
    {
        make: Effect.gen(function* () {
            const ledgerWorkload = yield* LedgerWorkload;
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const installmentPlanService = yield* InstallmentPlanService;
            const transactionDebtSettlementService = yield* TransactionDebtSettlementService;
            const transactionTransferService = yield* TransactionTransferService;
            const exclusive = yield* Semaphore.make(1);

            const runExclusive = <A, E, R>(effect: Effect.Effect<A, E, R>) => exclusive.withPermit(ledgerWorkload.runForeground(effect));

            const updateBalancesAfterConsolidation = Effect.fnUntraced(function* (consolidated: number) {
                if (isPositiveNumber(consolidated)) {
                    yield* accountBalanceIncrementalService.updateAllBalances(true);
                }
            });

            const convertHouseholdTransfers = Effect.fnUntraced(function* (scope: ConsolidationScanScopeInterface | null) {
                const candidates = yield* Db.query(db =>
                    db.$client.unsafe<HouseholdTransferCandidateInterface>(
                        `SELECT entry.transaction_id AS transactionId, MIN(target.id) AS targetAccountId
                        FROM transaction_entries entry
                        INNER JOIN transactions source ON source.id = entry.transaction_id
                        INNER JOIN accounts target ON target.iban = entry.to_iban
                        WHERE entry.deleted_at IS NULL
                            AND entry.original_transaction_id IS NULL
                            AND entry.to_iban IS NOT NULL
                            AND entry.to_iban != ''
                            AND source.deleted_at IS NULL
                            AND source.consolidation_parent_transaction_id IS NULL
                            AND source.consolidation_type IS NULL
                            AND source.type IN ('${TransactionTypeEnum.EXPENSE}', '${TransactionTypeEnum.INCOME}')
                            AND target.deleted_at IS NULL
                            AND target.is_active = 1
                            AND target.sync_zone = '${HOUSEHOLD_SYNC_ZONE}'
                            AND target.integration_id IS NULL
                            AND (target.external_source IS NULL OR target.external_source = '')
                            AND target.id != entry.account_id
                            AND (SELECT COUNT(*) FROM accounts rival WHERE rival.iban = entry.to_iban AND rival.deleted_at IS NULL AND rival.is_active = 1) = 1
                            ${buildConsolidationScanScopeSql(scope, 'source.operated_at')}
                        GROUP BY entry.transaction_id
                        HAVING COUNT(*) = 1`
                    )
                );
                let converted = 0;

                for (const candidate of candidates) {
                    if (yield* transactionTransferService.convertToTransferAccount(candidate.transactionId, candidate.targetAccountId)) {
                        converted += 1;
                    }
                }

                return converted;
            });

            return {
                consolidate: Effect.fn('TransferConsolidationService.consolidate')(function* (
                    scope: ConsolidationScanScopeInterface | null
                ) {
                    const coordinated = yield* consolidationCoordinatorService.consolidate(scope);
                    const converted = yield* convertHouseholdTransfers(scope);
                    const result = { found: coordinated.found + converted, consolidated: coordinated.consolidated + converted };

                    yield* updateBalancesAfterConsolidation(result.consolidated);
                    yield* installmentPlanService.attachDueParts();
                    yield* transactionDebtSettlementService.repairDebtPaymentCategories();

                    return result;
                }, runExclusive),
                moveAtmCashWithdrawalsToCash: Effect.fn('TransferConsolidationService.moveAtmCashWithdrawalsToCash')(function* (
                    transactionIds: readonly number[]
                ) {
                    const consolidated = yield* consolidationCoordinatorService.moveAtmCashWithdrawalsToCash(transactionIds);

                    yield* updateBalancesAfterConsolidation(consolidated);

                    return consolidated;
                }, runExclusive)
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransferConsolidationService, TransferConsolidationService.make).pipe(
        Layer.provide([
            ConsolidationCoordinatorService.layer,
            AccountBalanceIncrementalService.layer,
            InstallmentPlanService.layer,
            TransactionDebtSettlementService.layer,
            TransactionTransferService.layer
        ])
    );
}
