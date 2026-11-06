import { ExternalSourceEnum, TransactionRepository } from '@budgie/contracts';
import { AccountBalanceIncrementalService, BalanceAdjustmentService, TransactionService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { sumSignedAccountEntries } from '../utils/sum-signed-account-entries.util';

export class InzhurOpeningBalanceService extends Context.Service<InzhurOpeningBalanceService>()(
    '@budgie/sync/InzhurOpeningBalanceService',
    {
        make: Effect.gen(function* () {
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const balanceAdjustmentService = yield* BalanceAdjustmentService;
            const transactionRepository = yield* TransactionRepository;
            const transactionService = yield* TransactionService;
            const externalId = 'inzhur:before-export';
            const title = 'Balance before export';

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

            const replace = Effect.fn('InzhurOpeningBalanceService.replace')(function* (
                accountId: number,
                amount: number,
                createdAt: Date
            ) {
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

                const id = yield* balanceAdjustmentService.create(accountId, amount, existing?.operatedAt ?? createdAt, title);

                yield* transactionRepository.updateById(id, { externalId, externalSource: ExternalSourceEnum.INZHUR });
                yield* accountBalanceIncrementalService.updateBalancesByAccountIds([accountId]);
            });

            return {
                replace,
                shift: Effect.fn('InzhurOpeningBalanceService.shift')(function* (
                    accountId: number,
                    delta: number,
                    fundAccountIds: readonly number[]
                ) {
                    const existing = yield* findExisting(accountId);
                    const openingTimes = (yield* Effect.forEach(fundAccountIds, fundAccountId =>
                        transactionService.getEarliestTransactionTimeByAccountId(fundAccountId)
                    )).filter(isDefined);
                    const now = yield* DateTime.nowAsDate;
                    const openingAt = isNotEmptyArray(openingTimes)
                        ? DateTime.toDateUtc(DateTime.makeUnsafe(Math.min(...openingTimes.map(time => time.getTime()))))
                        : now;

                    yield* replace(accountId, (existing?.amount ?? 0) + delta, openingAt);
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(InzhurOpeningBalanceService, InzhurOpeningBalanceService.make).pipe(
        Layer.provide([
            AccountBalanceIncrementalService.layer,
            BalanceAdjustmentService.layer,
            TransactionRepository.layer,
            TransactionService.layer
        ])
    );
}
