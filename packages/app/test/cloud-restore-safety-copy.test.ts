import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as TestClock from 'effect/testing/TestClock';
import { beforeEach, vi } from 'vitest';

import { RESTORE_SAFETY_COPY_LIFETIME_MILLISECONDS } from '../src/cloud-backup/constant/restore-safety-copy-lifetime.constant';
import { RESTORE_SAFETY_FILES } from '../src/cloud-backup/constant/restore-safety-files.constant';
import { recoverInterruptedRestore } from '../src/cloud-backup/utils/recover-interrupted-restore.util';

const storage = vi.hoisted(() => new Map<string, number>());
vi.mock('expo-file-system', () => {
    class Entry {
        readonly uri: string;

        constructor(parent: string | Entry, name: string) {
            this.uri = `${typeof parent === 'string' ? parent : parent.uri}/${name}`;
        }

        get exists() {
            return storage.has(this.uri);
        }

        get lastModified() {
            return storage.get(this.uri) ?? null;
        }

        delete() {
            storage.delete(this.uri);
        }
    }

    return { File: Entry, Directory: Entry, Paths: { document: 'documents' } };
});

const safetyPath = `documents/SQLite/${RESTORE_SAFETY_FILES.copy}`;

describe('restore safety copy expiry', () => {
    beforeEach(() => void storage.clear());
    it.effect('keeps the shared safety copy for seven days and removes it only after expiry', () =>
        Effect.gen(function* () {
            storage.set(safetyPath, 0);
            yield* TestClock.setTime(RESTORE_SAFETY_COPY_LIFETIME_MILLISECONDS);
            yield* recoverInterruptedRestore;
            expect(storage.has(safetyPath)).toBe(true);
            yield* TestClock.adjust(1);
            yield* recoverInterruptedRestore;
            expect(storage.has(safetyPath)).toBe(false);
        })
    );
});
