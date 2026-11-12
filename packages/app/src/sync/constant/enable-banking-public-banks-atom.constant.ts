import { EnableBankingSyncService } from '@budgie/sync';
import * as Effect from 'effect/Effect';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';

export const enableBankingPublicBanksAtom = appAtomRuntime.atom(
    Effect.flatMap(EnableBankingSyncService, service => service.listPublicBanks())
);
