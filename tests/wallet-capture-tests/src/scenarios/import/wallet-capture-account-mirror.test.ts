import { walletCaptureAccountMirrorService } from '@app/wallet-capture/service/wallet-capture-account-mirror.service';
import { AccountEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { walletCaptureNativeStub } from '../../harness/native/wallet-capture-native.stub';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

describe('Wallet capture account mirror', () => {
    it('writes only active non-archived accounts to the native picker store', async () => {
        seed.instrument();
        const activeAccount = seed.account({ title: 'Wallet card' });
        const inactiveAccount = seed.account({ title: 'Hidden card' });
        const archivedAccount = seed.account({ title: 'Archived card' });

        testDb.update(AccountEntityTable).set({ isActive: false }).where(eq(AccountEntityTable.id, inactiveAccount.id)).run();
        testDb
            .update(AccountEntityTable)
            .set({ deletedAt: new Date('2026-08-07T12:00:00.000Z') })
            .where(eq(AccountEntityTable.id, archivedAccount.id))
            .run();

        await expect(walletCaptureAccountMirrorService.refresh()).resolves.toBeUndefined();

        expect(walletCaptureNativeStub.getAccounts()).toEqual([{ id: activeAccount.id, title: activeAccount.title }]);
    });
});
