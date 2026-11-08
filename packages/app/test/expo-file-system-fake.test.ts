import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { beforeEach } from 'vitest';

import { File, resetStorage, storage } from './fixture/expo-file-system-fake';

beforeEach(() => {
    resetStorage();
    storage.crashAfterRemove = false;
    storage.failMoveFrom = null;
});

it.effect('mirrors Expo file creation, missing reads and mutable move URIs', () =>
    Effect.sync(() => {
        const source = new File('documents', 'source');
        const destination = new File('documents', 'destination');
        expect(() => source.textSync()).toThrow('ENOENT');
        source.create();
        expect(() => void source.create()).toThrow('EEXIST');
        source.writeSync('contents');
        destination.create();
        expect(() => void source.moveSync(destination)).toThrow('EEXIST');
        expect(source.textSync()).toBe('contents');
        source.moveSync(destination, { overwrite: true });
        expect(source.uri).toBe(destination.uri);
        expect(source.textSync()).toBe('contents');
        expect(storage.files.has('documents/source')).toBe(false);
    })
);

it.effect('deletes the destination before checking a missing move source', () =>
    Effect.sync(() => {
        const destination = new File('documents', 'destination');
        destination.create();
        expect(() => void new File('documents', 'missing').moveSync(destination, { overwrite: true })).toThrow('ENOENT');
        expect(destination.exists).toBe(false);
    })
);

it.effect('updates the URI after the asynchronous move', () =>
    Effect.gen(function* () {
        const source = new File('documents', 'source');
        source.create();
        source.writeSync('contents');
        yield* Effect.promise(() => source.move(new File('documents', 'destination')));
        expect(source.uri).toBe('documents/destination');
        expect(source.textSync()).toBe('contents');
    })
);

it.effect('removes deleted mtimes and carries them through moves', () =>
    Effect.sync(() => {
        const source = new File('documents', 'source');
        source.create();
        storage.modified.set(source.uri, 123);
        source.moveSync(new File('documents', 'destination'));
        expect(storage.modified.has('documents/source')).toBe(false);
        expect(source.lastModified).toBe(123);
        source.delete();
        expect(storage.modified.has(source.uri)).toBe(false);
    })
);

it.effect('deletes the destination before checking a missing copy source', () =>
    Effect.sync(() => {
        const destination = new File('documents', 'destination');
        destination.create();
        storage.modified.set(destination.uri, 123);
        expect(() => new File('documents', 'missing').copy(destination, { overwrite: true })).toThrow('ENOENT');
        expect(destination.exists).toBe(false);
        expect(destination.lastModified).toBeNull();
    })
);
