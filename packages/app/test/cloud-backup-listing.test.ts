import { CloudSyncTransportError, ICloudErrorCode } from '@budgie/cloud-sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { vi } from 'vitest';

import { cloudBackupListing } from '../src/cloud-backup/hook/use-cloud-backups.hook';
import { CloudRestoreService } from '../src/cloud-backup/service/cloud-restore.service';

vi.mock('@lingui/core/macro', () => ({ msg: (message: unknown) => message, t: (parts: TemplateStringsArray) => parts.join('') }));
vi.mock('../src/@generic/runtime/app.runtime', () => ({ appAtomRuntime: { atom: vi.fn() } }));
vi.mock('../src/cloud-backup/service/cloud-restore.service', async () => {
    const Context = await import('effect/Context');

    return { CloudRestoreService: Context.Service<object>('test/ListingRestore') };
});

describe('cloud backup listing state', () => {
    it.effect.each([ICloudErrorCode.NETWORK_UNAVAILABLE, ICloudErrorCode.ENCRYPTED_DATA_RESET])(
        'distinguishes listing failure from encrypted data reset: %s',
        code =>
            Effect.gen(function* () {
                const listing = yield* cloudBackupListing.pipe(
                    Effect.provide(
                        Layer.mock(CloudRestoreService)({
                            listBackups: () => Effect.fail(CloudSyncTransportError.make({ code, message: 'unavailable' }))
                        })
                    )
                );
                expect(listing).toEqual({
                    groups: [],
                    hasFailed: code !== ICloudErrorCode.ENCRYPTED_DATA_RESET,
                    isUnreadable: code === ICloudErrorCode.ENCRYPTED_DATA_RESET
                });
            })
    );
    it.effect('clears failure on a successful retry', () =>
        Effect.gen(function* () {
            expect(
                yield* cloudBackupListing.pipe(Effect.provide(Layer.mock(CloudRestoreService)({ listBackups: () => Effect.succeed([]) })))
            ).toEqual({ groups: [], hasFailed: false, isUnreadable: false });
        })
    );
});
