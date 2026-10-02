import { AccountBalanceRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

export const fetchDebtProgress = Effect.fnUntraced(function* (accountId: number) {
    const accountBalanceRepository = yield* AccountBalanceRepository;
    const progress = (yield* accountBalanceRepository.getDebtAccountProgressByAccountId(accountId)).at(0);

    if (!isDefined(progress)) {
        return yield* Effect.die(new Error(`No debt progress row for account ${accountId}`));
    }

    return progress;
});
