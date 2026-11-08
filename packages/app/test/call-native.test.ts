import { ICloudErrorCode } from '@budgie/cloud-sync';
import { describe, expect, it } from '@effect/vitest';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import { vi } from 'vitest';

import { callNative } from '../src/cloud-sync/utils/call-native.util';

vi.mock('@lingui/core/macro', () => ({ msg: (message: unknown) => message, t: (parts: TemplateStringsArray) => parts.join('') }));

describe('shared iCloud native call', () => {
    it.effect.each([
        ICloudErrorCode.ACCOUNT_UNAVAILABLE,
        ICloudErrorCode.NETWORK_UNAVAILABLE,
        ICloudErrorCode.QUOTA_EXCEEDED,
        ICloudErrorCode.BACKUP_KEY_UNAVAILABLE,
        ICloudErrorCode.ENCRYPTED_DATA_RESET
    ])('preserves the native code and underlying message for %s', code =>
        Effect.gen(function* () {
            const exit = yield* Effect.exit(
                callNative(() => Promise.reject(Object.assign(new Error('Native wrapper\n→ Caused by: detail'), { code })))
            );
            expect(Exit.isFailure(exit)).toBe(true);
            if (Exit.isFailure(exit)) {
                expect(Cause.squash(exit.cause)).toMatchObject({ _tag: 'CloudSyncTransportError', code, message: 'detail' });
            }
        })
    );
});
