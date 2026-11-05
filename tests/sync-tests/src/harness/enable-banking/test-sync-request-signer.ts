import { makeNodeRsaSigner } from '@budgie-at/test-kit';
import { SyncDeferredError, SyncProviderEnum, SyncRequestSigner, SyncUnauthorizedError } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

const provider = SyncProviderEnum.ENABLE_BANKING;
const rsaSigner = makeNodeRsaSigner();
const missingKeyIds = new Set<string>();
const unavailableKeyIds = new Set<string>();
const undeletableKeyIds = new Set<string>();
const deletedKeyIds: string[] = [];

export const testSigner = {
    verify: rsaSigner.verify,
    deletedKeyIds,
    markMissing: (keyId: string): void => {
        missingKeyIds.add(keyId);
    },
    markUndeletable: (keyId: string): void => {
        undeletableKeyIds.add(keyId);
    },
    clearUndeletable: (keyId: string): void => {
        undeletableKeyIds.delete(keyId);
    },
    markUnavailable: (keyId: string): void => {
        unavailableKeyIds.add(keyId);
    },
    reset: (): void => {
        missingKeyIds.clear();
        unavailableKeyIds.clear();
        undeletableKeyIds.clear();
        deletedKeyIds.length = 0;
    }
};

export const testSyncRequestSignerLayer = Layer.succeed(SyncRequestSigner, {
    sign: (keyId: string, signingInput: string) => {
        if (missingKeyIds.has(keyId)) {
            return Effect.fail(new SyncUnauthorizedError({ provider, message: 'Signing key is missing' }));
        }

        if (unavailableKeyIds.has(keyId)) {
            return Effect.fail(new SyncDeferredError({ provider, message: 'Secure storage is locked' }));
        }

        return Effect.succeed(rsaSigner.sign(signingInput));
    },
    deleteKey: (keyId: string) =>
        undeletableKeyIds.has(keyId)
            ? Effect.fail(new SyncDeferredError({ provider, message: 'secure-storage-unavailable' }))
            : Effect.sync(() => {
                  deletedKeyIds.push(keyId);
              })
});
