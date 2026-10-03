import { AccountTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { seed } from './seed';

export const seedBankAndCashAccounts = () =>
    Effect.gen(function* () {
        return {
            bankAccount: yield* seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 }),
            cashAccount: yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 })
        };
    });
