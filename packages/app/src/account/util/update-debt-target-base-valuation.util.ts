import { accountRepository } from '../../@generic/drizzle/db/db';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';

import type { AccountEntityInterface, DB } from '@budgie/contracts';

export const updateDebtTargetBaseValuation = async (
    account: AccountEntityInterface,
    operatedAt: Date,
    tx: DB
): Promise<AccountEntityInterface> => {
    const valuation = await entryBaseValuationService.valueMicroUnitEntry({
        accountId: account.id,
        amount: account.targetBalance,
        operatedAt,
        externalSource: null,
        tx
    });

    return accountRepository.updateById(
        account.id,
        {
            targetBaseInstrumentId: valuation.baseInstrumentId,
            targetBaseExchangeRate: valuation.baseExchangeRate,
            targetBaseAmount: valuation.baseAmount
        },
        tx
    );
};
