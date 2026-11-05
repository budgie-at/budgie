import { ExternalSourceEnum, TransactionRepository, convertFromMicroUnits, convertToMicroUnits } from '@budgie/contracts';
import { AccountBalanceIncrementalService, BalanceAdjustmentService, TransactionService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { INZHUR_OPERATION_EXTERNAL_ID_PREFIX } from '../constant/inzhur-operation-external-id-prefix.constant';
import { INZHUR_RECONCILE_EXTERNAL_ID_PREFIX } from '../constant/inzhur-reconcile-external-id-prefix.constant';
import { sumSignedAccountEntries } from '../utils/sum-signed-account-entries.util';

import type { InzhurReconciliationInterface } from '../interface/inzhur-reconciliation.interface';

export class InzhurQuantityReconcileService extends Context.Service<InzhurQuantityReconcileService>()(
    '@budgie/sync/InzhurQuantityReconcileService',
    {
        make: Effect.gen(function* () {
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const balanceAdjustmentService = yield* BalanceAdjustmentService;
            const transactionRepository = yield* TransactionRepository;
            const transactionService = yield* TransactionService;
            const noonSuffix = 'T12:00:00.000Z';
            const endOfDaySuffix = 'T23:59:59.999Z';
            const adjustmentTitle = 'Holdings correction';

            return {
                hasOperationsLedger: Effect.fn('InzhurQuantityReconcileService.hasOperationsLedger')(function* (cashAccountId: number) {
                    const idByExternalId = yield* transactionService.findIdMapByExternalSource(ExternalSourceEnum.INZHUR, [cashAccountId]);

                    return [...idByExternalId.keys()].some(externalId => externalId.startsWith(INZHUR_OPERATION_EXTERNAL_ID_PREFIX));
                }),
                reconcile: Effect.fn('InzhurQuantityReconcileService.reconcile')(function* (
                    statementDate: string,
                    targetQuantityByAccountId: ReadonlyMap<number, number>
                ) {
                    const accountIds = [...targetQuantityByAccountId.keys()];
                    const endOfDay = new Date(`${statementDate}${endOfDaySuffix}`);
                    const idByExternalId = yield* transactionService.findIdMapByExternalSource(ExternalSourceEnum.INZHUR, accountIds);
                    const reconciliations: InzhurReconciliationInterface[] = [];

                    for (const [accountId, targetQuantity] of targetQuantityByAccountId) {
                        const externalId = `${INZHUR_RECONCILE_EXTERNAL_ID_PREFIX}${statementDate}:${accountId}`;
                        const previousId = idByExternalId.get(externalId);

                        if (isDefined(previousId)) {
                            yield* transactionService.deleteById(previousId);
                        }

                        const transactions = yield* transactionRepository.findByAccountIdsWithEntries([accountId]);
                        const quantity = transactions
                            .filter(transaction => transaction.operatedAt <= endOfDay)
                            .reduce((sum, transaction) => sum + sumSignedAccountEntries(transaction.entries, accountId), 0);
                        const differenceMicroUnits = convertToMicroUnits(targetQuantity) - quantity;

                        if (differenceMicroUnits !== 0) {
                            const id = yield* balanceAdjustmentService.create(
                                accountId,
                                differenceMicroUnits,
                                new Date(`${statementDate}${noonSuffix}`),
                                adjustmentTitle
                            );

                            yield* transactionRepository.updateById(id, { externalId, externalSource: ExternalSourceEnum.INZHUR });
                            yield* accountBalanceIncrementalService.updateBalancesByAccountIds([accountId]);
                            reconciliations.push({ accountId, difference: convertFromMicroUnits(differenceMicroUnits) });
                        }
                    }

                    return reconciliations;
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(InzhurQuantityReconcileService, InzhurQuantityReconcileService.make).pipe(
        Layer.provide([
            AccountBalanceIncrementalService.layer,
            BalanceAdjustmentService.layer,
            TransactionRepository.layer,
            TransactionService.layer
        ])
    );
}
