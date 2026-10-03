import { AccountTypeEnum, ExternalSourceEnum, SyncModeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { seed } from '../seed/seed';

export const seedMonobankForwardSyncAccounts = (externalIds: readonly string[], forwardSyncFromAt: Date) =>
    Effect.gen(function* () {
        for (const externalId of externalIds) {
            const account = yield* seed.account({
                externalId,
                externalSource: ExternalSourceEnum.MONOBANK,
                type: AccountTypeEnum.BANK_SYNC
            });
            yield* seed.sync({
                accountId: account.id,
                forwardSyncFromAt,
                mode: SyncModeEnum.FORWARD,
                provider: ExternalSourceEnum.MONOBANK
            });
        }
    });
