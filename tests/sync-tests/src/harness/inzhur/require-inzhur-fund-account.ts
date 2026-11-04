import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { requireInzhurSetup } from './require-inzhur-setup';

export const requireInzhurFundAccount = Effect.fnUntraced(function* (isin: string) {
    const { fundAccounts } = yield* requireInzhurSetup();
    const account = fundAccounts.find(({ externalId }) => externalId === `inzhur:${isin}`);

    if (!isDefined(account)) {
        return yield* Effect.die(new Error(`Fund account ${isin} not found`));
    }

    return account;
});
