import { ExternalSourceEnum, TransactionRepository } from '@budgie/contracts';
import { AccountBalanceIncrementalService, BalanceAdjustmentService, TransactionService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { sumSignedAccountEntries } from '../utils/sum-signed-account-entries.util';

export class InzhurBeforeTrackingService extends Context.Service<InzhurBeforeTrackingService>()(
    '@budgie/sync/InzhurBeforeTrackingService',
    {
        make: Effect.gen(function* () {
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const balanceAdjustmentService = yield* BalanceAdjustmentService;
            const transactionRepository = yield* TransactionRepository;
            const transactionService = yield* TransactionService;
            const externalId = 'inzhur:before-tracking';
            const investedTitle = 'Invested before tracking';
            const balanceTitle = 'Balance before tracking';

            const findExisting = Effect.fnUntraced(function* (accountId: number) {
                const id = (yield* transactionService.findIdMapByExternalSource(ExternalSourceEnum.INZHUR, [accountId])).get(externalId);
                const transaction = isDefined(id) ? yield* transactionRepository.getByIdWithEntries(id) : null;

                return isDefined(transaction)
                    ? {
                          id: transaction.id,
                          operatedAt: transaction.operatedAt,
                          amount: sumSignedAccountEntries(transaction.entries, accountId)
                      }
                    : null;
            });

            const replace = Effect.fn('InzhurBeforeTrackingService.replace')(function* (accountId: number, amount: number) {
                const existing = yield* findExisting(accountId);

                if (existing?.amount === amount) {
                    return;
                }

                if (isDefined(existing)) {
                    yield* transactionService.deleteById(existing.id);
                }

                if (amount === 0) {
                    return;
                }

                const id = yield* balanceAdjustmentService.create(
                    accountId,
                    amount,
                    existing?.operatedAt ?? new Date(),
                    amount < 0 ? investedTitle : balanceTitle
                );

                yield* transactionRepository.updateById(id, { externalId, externalSource: ExternalSourceEnum.INZHUR });
                yield* accountBalanceIncrementalService.updateBalancesByAccountIds([accountId]);
            });

            return {
                replace,
                shift: Effect.fn('InzhurBeforeTrackingService.shift')(function* (accountId: number, delta: number) {
                    const existing = yield* findExisting(accountId);

                    yield* replace(accountId, (existing?.amount ?? 0) + delta);
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(InzhurBeforeTrackingService, InzhurBeforeTrackingService.make).pipe(
        Layer.provide([
            AccountBalanceIncrementalService.layer,
            BalanceAdjustmentService.layer,
            TransactionRepository.layer,
            TransactionService.layer
        ])
    );
}
