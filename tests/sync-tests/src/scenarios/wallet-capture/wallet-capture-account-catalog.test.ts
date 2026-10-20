import { WalletCaptureNativeService } from '@app/wallet-capture/service/wallet-capture-native.service';
import { AccountEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb, TestLayer, seed, walletCaptureNativeStub } from '../../harness/wallet-capture';

describe('Wallet capture account mirror', () => {
    it.effect('publishes only active non-archived accounts to the Shortcuts account catalog', () =>
        Effect.gen(function* () {
            const walletCaptureNativeService = yield* WalletCaptureNativeService;
            yield* seed.instrument();
            const activeAccount = yield* seed.account({ title: 'Wallet card' });
            const inactiveAccount = yield* seed.account({ title: 'Hidden card' });
            const archivedAccount = yield* seed.account({ title: 'Archived card' });

            yield* testDb.update(AccountEntityTable).set({ isActive: false }).where(eq(AccountEntityTable.id, inactiveAccount.id));
            yield* testDb
                .update(AccountEntityTable)
                .set({ deletedAt: new Date('2026-08-07T12:00:00.000Z') })
                .where(eq(AccountEntityTable.id, archivedAccount.id));

            yield* walletCaptureNativeService.refreshAccounts();

            expect(walletCaptureNativeStub.getCatalog('walletAccount')).toEqual([
                { id: String(activeAccount.id), title: activeAccount.title }
            ]);
        }).pipe(Effect.provide(TestLayer))
    );
});
