import { DividendPayoutEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { importInzhurStatement } from './import-inzhur-statement';
import { SECOND_URI } from './inzhur-statement-fixtures.constant';
import { setInzhurPayout } from './set-inzhur-payout';
import { setUpInzhurWithBaseline } from './set-up-inzhur-with-baseline';

export const importWithBankPayoutReit = Effect.fnUntraced(function* (openingCash: number) {
    const accounts = yield* setUpInzhurWithBaseline(openingCash, 1000, 2);
    yield* setInzhurPayout(accounts.reitAccount.id, DividendPayoutEnum.BANK);
    const summary = yield* importInzhurStatement(SECOND_URI);

    return { ...accounts, summary };
});
