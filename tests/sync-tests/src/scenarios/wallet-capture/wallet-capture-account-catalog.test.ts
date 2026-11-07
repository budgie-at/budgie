import { SiriCatalogKindEnum } from '@app/siri/enum/siri-catalog-kind.enum';
import { SiriMetadataKeyEnum } from '@app/siri/enum/siri-metadata-key.enum';
import { SiriCatalogService } from '@app/siri/service/siri-catalog.service';
import { AccountEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb, TestLayer, seed, walletCaptureNativeStub } from '../../harness/wallet-capture';

describe('Wallet capture account mirror', () => {
    it.effect('publishes only active non-archived accounts to the Shortcuts account catalog', () =>
        Effect.gen(function* () {
            const siriCatalogService = yield* SiriCatalogService;
            yield* seed.instrument();
            const activeAccount = yield* seed.account({ title: 'Wallet card' });
            const inactiveAccount = yield* seed.account({ title: 'Hidden card' });
            const archivedAccount = yield* seed.account({ title: 'Archived card' });

            yield* testDb.update(AccountEntityTable).set({ isActive: false }).where(eq(AccountEntityTable.id, inactiveAccount.id));
            yield* testDb
                .update(AccountEntityTable)
                .set({ deletedAt: new Date('2026-08-07T12:00:00.000Z') })
                .where(eq(AccountEntityTable.id, archivedAccount.id));

            yield* siriCatalogService.publish();

            const [answer] = walletCaptureNativeStub.getCatalog(SiriCatalogKindEnum.ACCOUNT_ANSWER);

            expect(walletCaptureNativeStub.getCatalog(SiriCatalogKindEnum.WALLET_ACCOUNT)).toEqual([
                { id: String(activeAccount.id), title: activeAccount.title }
            ]);
            expect(answer.metadata).toHaveProperty(SiriMetadataKeyEnum.BALANCE);

            yield* siriCatalogService.mask();

            const [lockedAnswer] = walletCaptureNativeStub.getCatalog(SiriCatalogKindEnum.ACCOUNT_ANSWER);

            expect(walletCaptureNativeStub.getCatalog(SiriCatalogKindEnum.WALLET_ACCOUNT)).toHaveLength(1);
            expect(lockedAnswer.metadata).toHaveProperty(SiriMetadataKeyEnum.IS_LOCKED, 'true');
            expect(lockedAnswer.metadata).not.toHaveProperty(SiriMetadataKeyEnum.BALANCE);
        }).pipe(Effect.provide(TestLayer))
    );
});
