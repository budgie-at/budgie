import { AccountTypeEnum, ExternalSourceEnum, SyncModeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { seed } from '../seed/seed';

import type { SyncCreateEntityInterface } from '@budgie/contracts';

export const seedMonobankTokenAccount = (externalId: string, token: string, syncState: Partial<SyncCreateEntityInterface> = {}) =>
    Effect.gen(function* () {
        const account = yield* seed.account({
            externalId,
            externalSource: ExternalSourceEnum.MONOBANK,
            type: AccountTypeEnum.BANK_SYNC,
            instrumentId: 1
        });
        const sync = yield* seed.sync({
            accountId: account.id,
            token,
            provider: ExternalSourceEnum.MONOBANK,
            mode: SyncModeEnum.FORWARD,
            ...syncState
        });

        return { account, sync };
    });
