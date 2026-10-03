import { AccountTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { seed } from '../seed/seed';

import type { ExternalSourceEnum } from '@budgie/contracts';

export const seedBankSyncAccount = (title: string, externalSource: ExternalSourceEnum | null, iban: string, instrumentId?: number) =>
    Effect.gen(function* () {
        return yield* seed.account({
            title,
            type: AccountTypeEnum.BANK_SYNC,
            externalSource,
            iban,
            ...(instrumentId && { instrumentId })
        });
    });
