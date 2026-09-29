import * as Effect from 'effect/Effect';

import { accountRepository } from '../../@generic/drizzle/db/db';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';

import type { AccountEntityInterface } from '@budgie/contracts';

export const updateDebtTargetBaseValuation = Effect.fn('updateDebtTargetBaseValuation')(function* (
    account: AccountEntityInterface,
    operatedAt: Date
) {
    const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
        accountId: account.id,
        amount: account.targetBalance,
        operatedAt,
        externalSource: null
    });

    return yield* accountRepository.updateById(account.id, {
        targetBaseInstrumentId: valuation.baseInstrumentId,
        targetBaseExchangeRate: valuation.baseExchangeRate,
        targetBaseAmount: valuation.baseAmount
    });
});
