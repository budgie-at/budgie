import { AccountRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import type { DividendPayoutEnum } from '@budgie/contracts';

export const setInzhurPayout = Effect.fnUntraced(function* (accountId: number, dividendPayout: DividendPayoutEnum) {
    const accountRepository = yield* AccountRepository;

    yield* accountRepository.updateById(accountId, { dividendPayout });
});
