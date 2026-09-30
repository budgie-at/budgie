import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import * as Effect from 'effect/Effect';

import { seed } from './seed';

export const seedLedgerBalance = Effect.fnUntraced(function* (accountId: number, amount: number) {
    const ledgerBalance = (yield* accountBalanceRepository.getLedgerBalances([accountId])).get(accountId) ?? 0;

    seed.bankPairIncome(
        { externalId: `opening-balance-${accountId}`, operatedAt: new Date() },
        { accountId, amount: amount - ledgerBalance }
    );
    yield* accountBalanceIncrementalService.updateBalancesByAccountIds([accountId]);
});
