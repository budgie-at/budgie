import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';

import { run } from '../scenario/test-runtime';

import { seed } from './seed';

export const seedLedgerBalance = async (accountId: number, amount: number): Promise<void> => {
    const ledgerBalance = (await run(accountBalanceRepository.getLedgerBalances([accountId]))).get(accountId) ?? 0;

    seed.bankPairIncome(
        { externalId: `opening-balance-${accountId}`, operatedAt: new Date() },
        { accountId, amount: amount - ledgerBalance }
    );
    await run(accountBalanceIncrementalService.updateBalancesByAccountIds([accountId]));
};
