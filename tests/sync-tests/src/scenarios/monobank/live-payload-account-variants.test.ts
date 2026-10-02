import { CashbackTypeEnum, MonobankClient, MonobankSyncService, SyncAccountTypeEnum } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { AccountType } from '@liaugust/monobank-sdk';
import * as Effect from 'effect/Effect';

import { buildMonobank, monobankStub, TestLayer } from '../../harness';

import type { ClientInfo } from '@liaugust/monobank-sdk';

const { cashbackType, ...fopAccountWithoutCashback } = buildMonobank.account({ id: 'mono-fop', type: AccountType.Fop });

describe('monobank/live-payload-account-variants', () => {
    it.effect('previews madeInUkraine cards, cashback-less FOP accounts, and goal-less jars', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const clientInfo: ClientInfo = {
                ...buildMonobank.clientInfoWith([]),
                accounts: [buildMonobank.account({ id: 'mono-miu', type: AccountType.MadeInUkraine }), fopAccountWithoutCashback],
                jars: [buildMonobank.jar({ id: 'jar-goalless', goal: null })]
            };
            monobankStub.clientInfo(clientInfo);

            const previews = yield* monobankSyncService.fetchAccountsPreview('test-token');
            const accounts = yield* new MonobankClient('test-token').getAccounts();

            expect(previews.find(preview => preview.externalId === 'mono-miu')?.type).toBe(SyncAccountTypeEnum.MADE_IN_UKRAINE);
            expect(previews.find(preview => preview.externalId === 'mono-fop')?.type).toBe(SyncAccountTypeEnum.FOP);
            expect(previews.find(preview => preview.externalId === 'jar-goalless')?.type).toBe(SyncAccountTypeEnum.JAR);
            expect(accounts.find(account => account.id === 'mono-fop')?.cashbackType).toBe(CashbackTypeEnum.NONE);
        }).pipe(Effect.provide(TestLayer))
    );
});
