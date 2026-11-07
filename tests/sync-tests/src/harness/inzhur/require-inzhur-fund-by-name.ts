import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { requireInzhurSetup } from './require-inzhur-setup';

export const requireInzhurFundByName = Effect.fnUntraced(function* (name: string) {
    const { fundAccounts } = yield* requireInzhurSetup();
    const account = fundAccounts.find(({ title }) => title === name);

    if (!isDefined(account)) {
        return yield* Effect.die(new Error(`Fund account ${name} not found`));
    }

    return account;
});
