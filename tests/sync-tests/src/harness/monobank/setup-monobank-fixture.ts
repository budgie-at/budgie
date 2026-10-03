import { AccountTypeEnum, SyncModeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { seed } from '../seed/seed';

import { buildMonobank } from './build-monobank';
import { monobankStub } from './monobank-stub';

export const setupMonobankFixture = (
    externalId: string = 'mono-acc-1',
    mode: SyncModeEnum = SyncModeEnum.FORWARD,
    forwardSyncFromAt: Date = new Date()
) =>
    Effect.gen(function* () {
        const account = yield* seed.account({ externalId, type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        const sync = yield* seed.sync({ accountId: account.id, mode, forwardSyncFromAt });
        monobankStub.clientInfo(buildMonobank.clientInfoWith([externalId]));

        return { account, sync };
    });
