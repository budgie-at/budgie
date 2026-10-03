import { WalletCaptureAccountMirrorService } from '@app/wallet-capture/service/wallet-capture-account-mirror.service';
import { AccountEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb, TestLayer, seed, walletCaptureNativeStub } from '../../harness/wallet-capture';

describe('Wallet capture account mirror', () => {
    it.effect('writes only active non-archived accounts to the native picker store', () =>
        Effect.gen(function* () {
            const walletCaptureAccountMirrorService = yield* WalletCaptureAccountMirrorService;
            yield* seed.instrument();
            const activeAccount = yield* seed.account({ title: 'Wallet card' });
            const inactiveAccount = yield* seed.account({ title: 'Hidden card' });
            const archivedAccount = yield* seed.account({ title: 'Archived card' });

            yield* testDb.update(AccountEntityTable).set({ isActive: false }).where(eq(AccountEntityTable.id, inactiveAccount.id));
            yield* testDb
                .update(AccountEntityTable)
                .set({ deletedAt: new Date('2026-08-07T12:00:00.000Z') })
                .where(eq(AccountEntityTable.id, archivedAccount.id));

            yield* walletCaptureAccountMirrorService.refresh();

            expect(walletCaptureNativeStub.getAccounts()).toEqual([{ id: activeAccount.id, title: activeAccount.title }]);
        }).pipe(Effect.provide(TestLayer))
    );
});
