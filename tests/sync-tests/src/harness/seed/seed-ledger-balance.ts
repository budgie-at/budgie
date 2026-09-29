import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';

import { seed } from './seed';

export const seedLedgerBalance = async (accountId: number, amount: number): Promise<void> => {
    const ledgerBalance = (await accountBalanceRepository.getLedgerBalances([accountId])).get(accountId) ?? 0;

    seed.bankPairIncome(
        { externalId: `opening-balance-${accountId}`, operatedAt: new Date() },
        { accountId, amount: amount - ledgerBalance }
    );
    await accountBalanceIncrementalService.updateBalancesByAccountIds([accountId]);
};
