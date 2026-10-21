import { AccountTypeEnum, ExternalSourceEnum, SyncModeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { seed } from '../seed/seed';

export const seedMonobankForwardSyncAccounts = (externalIds: readonly string[], forwardSyncFromAt: Date) =>
    Effect.forEach(externalIds, externalId =>
        Effect.gen(function* () {
            const account = yield* seed.account({
                externalId,
                externalSource: ExternalSourceEnum.MONOBANK,
                type: AccountTypeEnum.BANK_SYNC
            });
            const sync = yield* seed.sync({
                accountId: account.id,
                forwardSyncFromAt,
                mode: SyncModeEnum.FORWARD,
                provider: ExternalSourceEnum.MONOBANK
            });

            return sync.id;
        })
    );
