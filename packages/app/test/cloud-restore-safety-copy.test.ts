import { CloudSyncSafetyCopy } from '@budgie/cloud-sync';
import { P2pTransferTitleResolver } from '@budgie/consolidation';
import { LedgerWorkload } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as TestClock from 'effect/testing/TestClock';
import { beforeEach, vi } from 'vitest';

import { DatabaseRekeyService } from '../src/@generic/drizzle/service/database-rekey.service';
import { RESTORE_SAFETY_COPY_LIFETIME_MILLISECONDS } from '../src/cloud-backup/constant/restore-safety-copy-lifetime.constant';
import { RESTORE_SAFETY_FILES } from '../src/cloud-backup/constant/restore-safety-files.constant';
import { recoverInterruptedRestore } from '../src/cloud-backup/utils/recover-interrupted-restore.util';
import { writeRestoreSafetyCopy } from '../src/cloud-backup/utils/write-restore-safety-copy.util';
import { cloudSyncSafetyCopyLayer } from '../src/cloud-sync/layer/cloud-sync-safety-copy.layer';

import { storage } from './fixture/expo-file-system-fake';
import { inertDbLayer } from './fixture/inert-db-layer';

vi.mock('../src/@generic/drizzle/service/database-rekey.service', async () => {
    const Context = await import('effect/Context');
    const Layer = await import('effect/Layer');
    const Effect = await import('effect/Effect');
    const serviceName = 'test/SafetyRekey';

    return {
        DatabaseRekeyService: Object.assign(Context.Service<object>(serviceName), {
            layer: Layer.succeed(Context.Service<object>(serviceName), { exportEncryptedCopy: () => Effect.die('export failed') })
        })
    };
});
vi.mock('../src/@generic/drizzle/utils/read-database-key.util', async () => {
    const Effect = await import('effect/Effect');

    return { readDatabaseKey: Effect.succeed(null) };
});

vi.mock('@lingui/core/macro', () => ({ msg: (message: unknown) => message, t: (parts: TemplateStringsArray) => parts.join('') }));

vi.mock('expo-file-system', () => import('./fixture/expo-file-system-fake'));

const safetyPath = `documents/SQLite/${RESTORE_SAFETY_FILES.copy}`;

describe('restore safety copy expiry', () => {
    beforeEach(() => void storage.files.clear());
    it.effect('keeps the previous safety copy when sync export fails', () =>
        Effect.gen(function* () {
            storage.files.set(safetyPath, 'previous-copy');
            storage.modified.set(safetyPath, 123);
            const safety = yield* CloudSyncSafetyCopy;
            expect(Exit.isFailure(yield* Effect.exit(safety.create))).toBe(true);
            expect(storage.modified.get(safetyPath)).toBe(123);
        }).pipe(
            Effect.provide(cloudSyncSafetyCopyLayer),
            Effect.provide([
                inertDbLayer,
                FetchHttpClient.layer,
                Reactivity.layer,
                Layer.mock(LedgerWorkload)({}),
                Layer.succeed(P2pTransferTitleResolver, () => 'unused')
            ])
        )
    );
    it.effect('keeps the previous safety copy when exporting fails', () =>
        Effect.gen(function* () {
            storage.files.set(safetyPath, 'previous-copy');
            storage.modified.set(safetyPath, 123);
            expect(
                Exit.isFailure(
                    yield* Effect.exit(
                        writeRestoreSafetyCopy(null).pipe(
                            Effect.provide(Layer.mock(DatabaseRekeyService)({ exportEncryptedCopy: () => Effect.die('export failed') }))
                        )
                    )
                )
            ).toBe(true);
            expect(storage.modified.get(safetyPath)).toBe(123);
        }).pipe(Effect.provide(inertDbLayer))
    );
    it.effect('keeps the shared safety copy for seven days and removes it only after expiry', () =>
        Effect.gen(function* () {
            storage.files.set(safetyPath, 'copy');
            storage.modified.set(safetyPath, 0);
            yield* TestClock.setTime(RESTORE_SAFETY_COPY_LIFETIME_MILLISECONDS);
            yield* recoverInterruptedRestore;
            expect(storage.files.has(safetyPath)).toBe(true);
            yield* TestClock.adjust(1);
            yield* recoverInterruptedRestore;
            expect(storage.files.has(safetyPath)).toBe(false);
        })
    );
});
