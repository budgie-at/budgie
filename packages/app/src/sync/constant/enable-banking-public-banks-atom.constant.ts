import { EnableBankingSyncService, WISE_ASPSP_NAME } from '@budgie/sync';
import * as Effect from 'effect/Effect';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';

export const enableBankingPublicBanksAtom = appAtomRuntime.atom(
    Effect.flatMap(EnableBankingSyncService, service => service.listPublicBanks()).pipe(
        Effect.map(banks => banks.filter(bank => bank.name !== WISE_ASPSP_NAME)),
        Effect.tapCause(Effect.logError)
    )
);
