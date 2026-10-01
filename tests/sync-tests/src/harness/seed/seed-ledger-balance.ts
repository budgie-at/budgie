import { AccountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { AccountBalanceRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { seed } from './seed';

export const seedLedgerBalance = Effect.fnUntraced(function* (accountId: number, amount: number) {
    const accountBalanceRepository = yield* AccountBalanceRepository;
    const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
    const ledgerBalance = (yield* accountBalanceRepository.getLedgerBalances([accountId])).get(accountId) ?? 0;

    yield* seed.bankPairIncome(
        { externalId: `opening-balance-${accountId}`, operatedAt: new Date() },
        { accountId, amount: amount - ledgerBalance }
    );
    yield* accountBalanceIncrementalService.updateBalancesByAccountIds([accountId]);
});
