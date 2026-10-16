import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { aiModelStorageAtom } from '@app/ai/constant/ai-model-storage-atom.constant';
import { chatModelSnapshotAtom, embeddingModelSnapshotAtom, sttSnapshotAtom } from '@app/ai/constant/ai-snapshot-atoms.constant';
import { AiSubsystemStatusEnum } from '@app/ai/enum/ai-subsystem-status.enum';
import { AiModelStorageService } from '@app/ai/service/ai-model-storage.service';
import { CHAT_MODEL_FILENAME } from '@app/ai/utils/ai-constants.util';
import { patchAtom } from '@app/ai/utils/patch-atom.util';
import { EMBEDDING_MODEL_FILENAME } from '@budgie/categorization';
import { Db, SettingsRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Fiber from 'effect/Fiber';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as AtomRegistry from 'effect/reactivity/AtomRegistry';
import { beforeEach, vi } from 'vitest';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { testDb } from '../../harness/scenario/setup';

const files = vi.hoisted(() => new Map<string, number>());
const native = vi.hoisted(() => ({ aiEnabled: true, deleteFile: vi.fn<(path: string) => void>(), readFile: vi.fn<() => void>() }));

vi.mock('expo-constants', () => ({ default: { expoConfig: { extra: native } } }));
vi.mock('expo-file-system', () => {
    class File {
        readonly path: string;
        readonly uri = '/tmp';

        constructor(...path: string[]) {
            this.path = path.slice(1).join('/');
        }

        get exists() {
            native.readFile();

            return files.has(this.path);
        }

        get size() {
            return files.get(this.path) ?? 0;
        }

        delete() {
            native.deleteFile(this.path);
            files.delete(this.path);
        }
    }

    return { Paths: { document: '/tmp' }, File, Directory: File };
});

beforeEach(() => {
    native.aiEnabled = true;
    native.deleteFile.mockReset();
    native.readFile.mockReset();
    files.clear();
    patchAtom(sttSnapshotAtom, { status: AiSubsystemStatusEnum.IDLE });
    for (const snapshot of [chatModelSnapshotAtom, embeddingModelSnapshotAtom]) {
        patchAtom(snapshot, { status: AiSubsystemStatusEnum.IDLE });
    }
});

const makeStorage = Effect.gen(function* () {
    const repository = yield* SettingsRepository;
    yield* repository.update({
        isAiEnabled: false,
        isAiVoiceInputEnabled: false,
        isAiSuggestionsEnabled: false,
        isAiTranslationsEnabled: false
    });

    return yield* AiModelStorageService.make;
});

const provideStorage = <A, E, R>(effect: Effect.Effect<A, E, R | SettingsRepository | Db>) =>
    effect.pipe(Effect.provide(SettingsRepository.layer), Effect.provideService(Db, testDb));

describe('AI model storage ownership', () => {
    it.effect.each([
        AiSubsystemStatusEnum.READY,
        AiSubsystemStatusEnum.DOWNLOADING,
        AiSubsystemStatusEnum.INITIALIZING,
        AiSubsystemStatusEnum.ERROR
    ])('retains a disabled but potentially owned %s model', status =>
        provideStorage(
            Effect.gen(function* () {
                const storage = yield* makeStorage;
                files.set(CHAT_MODEL_FILENAME, 1_000);
                patchAtom(chatModelSnapshotAtom, { status });
                expect(yield* storage.getUsage()).toEqual({ totalBytes: 1_000, unusedBytes: 0 });
                yield* storage.deleteUnused();
                expect(files.has(CHAT_MODEL_FILENAME)).toBe(true);
                patchAtom(chatModelSnapshotAtom, { status: AiSubsystemStatusEnum.SUSPENDED });
                yield* storage.deleteUnused();
                expect(files.has(CHAT_MODEL_FILENAME)).toBe(false);
            })
        )
    );

    it.effect('retains shared models and removes legacy files', () =>
        provideStorage(
            Effect.gen(function* () {
                const storage = yield* makeStorage;
                const repository = yield* SettingsRepository;
                files.set(CHAT_MODEL_FILENAME, 1_000);
                files.set(EMBEDDING_MODEL_FILENAME, 2_000);
                files.set('qwen2.5-1.5b-instruct-q8_0.gguf', 500);
                yield* repository.update({ isAiEnabled: true, isAiVoiceInputEnabled: true });
                yield* storage.deleteUnused();
                expect([...files.keys()]).toEqual([CHAT_MODEL_FILENAME, EMBEDDING_MODEL_FILENAME]);
                yield* repository.update({ isAiVoiceInputEnabled: false, isAiSuggestionsEnabled: true });
                yield* storage.deleteUnused();
                expect([...files.keys()]).toEqual([EMBEDDING_MODEL_FILENAME]);
            })
        )
    );

    it.effect('holds the real SQLite writer lock from the final settings read through deletion', () =>
        provideStorage(
            Effect.gen(function* () {
                const { storage, repository, reading, finishReading } = yield* Effect.gen(function* () {
                    yield* makeStorage;
                    const repository = yield* SettingsRepository;
                    const reading = yield* Deferred.make<boolean>();
                    const finishReading = yield* Deferred.make<boolean>();
                    const storage = yield* AiModelStorageService.make.pipe(
                        Effect.provideService(SettingsRepository, {
                            ...repository,
                            getSettings: () =>
                                repository
                                    .getSettings()
                                    .pipe(Effect.tap(() => Effect.andThen(Deferred.succeed(reading, true), Deferred.await(finishReading))))
                        })
                    );

                    return { storage, repository, reading, finishReading };
                });
                files.set(CHAT_MODEL_FILENAME, 1_000);
                const deletion = yield* Effect.forkChild(storage.deleteUnused());
                yield* Deferred.await(reading);
                const enable = yield* Effect.forkChild(
                    Db.transaction(repository.update({ isAiEnabled: true, isAiTranslationsEnabled: true }))
                );
                yield* Effect.yieldNow;
                expect(!isDefined(enable.pollUnsafe())).toBe(true);
                patchAtom(chatModelSnapshotAtom, { status: AiSubsystemStatusEnum.READY });
                yield* Deferred.succeed(finishReading, true);
                yield* Fiber.join(deletion);
                yield* Fiber.join(enable);
                expect(files.has(CHAT_MODEL_FILENAME)).toBe(true);
            })
        )
    );
});

describe('AI concurrent settings', () => {
    it.effect('rechecks enabled consumers after a concurrent committed settings change', () =>
        provideStorage(
            Effect.gen(function* () {
                const storage = yield* makeStorage;
                const repository = yield* SettingsRepository;
                const locked = yield* Deferred.make<boolean>();
                const commit = yield* Deferred.make<boolean>();
                const enabling = yield* Effect.forkChild(
                    Db.transaction(
                        Effect.gen(function* () {
                            yield* Deferred.succeed(locked, true);
                            yield* Deferred.await(commit);
                            yield* repository.update({ isAiEnabled: true, isAiVoiceInputEnabled: true });
                        })
                    )
                );
                yield* Deferred.await(locked);
                files.set(CHAT_MODEL_FILENAME, 1_000);
                files.set(EMBEDDING_MODEL_FILENAME, 2_000);
                const deleting = yield* Effect.forkChild(storage.deleteUnused());
                yield* Deferred.succeed(commit, true);
                yield* Effect.andThen(Fiber.join(enabling), Fiber.join(deleting));
                expect(files.size).toBe(2);
            })
        )
    );

    it.effect('treats persisted consent as unused in a disabled build without changing settings', () =>
        provideStorage(
            Effect.gen(function* () {
                const storage = yield* makeStorage;
                const repository = yield* SettingsRepository;
                yield* repository.update({
                    isAiEnabled: true,
                    isAiVoiceInputEnabled: true,
                    isAiSuggestionsEnabled: true,
                    isAiTranslationsEnabled: true
                });
                const before = yield* repository.getSettings();
                native.aiEnabled = false;
                files.set(CHAT_MODEL_FILENAME, 1_000);
                files.set(EMBEDDING_MODEL_FILENAME, 2_000);
                expect((yield* storage.getUsage()).unusedBytes).toBe(3_000);
                yield* storage.deleteUnused();
                expect(files.size).toBe(0);
                expect(yield* repository.getSettings()).toEqual(before);
            })
        )
    );

    it.effect('reports partial deletion failures and reflects remaining files on refresh', () =>
        provideStorage(
            Effect.gen(function* () {
                const storage = yield* makeStorage;
                files.set(CHAT_MODEL_FILENAME, 1_000);
                files.set(EMBEDDING_MODEL_FILENAME, 2_000);
                native.deleteFile.mockImplementationOnce(emptyFn).mockImplementationOnce(() => {
                    JSON.parse('invalid');
                });
                expect(Exit.isFailure(yield* Effect.exit(storage.deleteUnused()))).toBe(true);
                expect(yield* storage.getUsage()).toEqual({ totalBytes: 2_000, unusedBytes: 2_000 });
            })
        )
    );
});

describe('AI inventory reactivity', () => {
    it.effect('exposes inventory failure and recovers through the existing atom refresh', () =>
        provideStorage(
            Effect.gen(function* () {
                yield* makeStorage;
                files.set(CHAT_MODEL_FILENAME, 1_000);
                native.readFile.mockImplementation(() => {
                    JSON.parse('invalid');
                });
                appAtomRegistry.refresh(aiModelStorageAtom);
                const failed = yield* Effect.exit(AtomRegistry.getResult(appAtomRegistry, aiModelStorageAtom, { suspendOnWaiting: true }));
                expect(Exit.isFailure(failed)).toBe(true);
                expect(AsyncResult.isFailure(appAtomRegistry.get(aiModelStorageAtom))).toBe(true);
                native.readFile.mockReset();
                appAtomRegistry.refresh(aiModelStorageAtom);
                expect(yield* AtomRegistry.getResult(appAtomRegistry, aiModelStorageAtom, { suspendOnWaiting: true })).toEqual({
                    totalBytes: 1_000,
                    unusedBytes: 1_000
                });
            })
        )
    );

    it.effect('refreshes inventory on lifecycle status changes without refreshing for progress samples', () =>
        provideStorage(
            Effect.gen(function* () {
                yield* makeStorage;
                files.set(CHAT_MODEL_FILENAME, 1_000);
                patchAtom(chatModelSnapshotAtom, { status: AiSubsystemStatusEnum.READY });
                const unsubscribe = appAtomRegistry.subscribe(aiModelStorageAtom, emptyFn);
                yield* Effect.addFinalizer(() => Effect.sync(unsubscribe));
                yield* Effect.yieldNow;
                const ready = yield* AtomRegistry.getResult(appAtomRegistry, aiModelStorageAtom);
                expect(ready.unusedBytes).toBe(0);
                yield* Effect.gen(function* () {
                    const previous = appAtomRegistry.get(aiModelStorageAtom);
                    patchAtom(chatModelSnapshotAtom, { downloadProgress: 0.5 });
                    yield* Effect.yieldNow;
                    expect(appAtomRegistry.get(aiModelStorageAtom)).toBe(previous);
                });
                yield* Effect.gen(function* () {
                    patchAtom(chatModelSnapshotAtom, { status: AiSubsystemStatusEnum.SUSPENDED });
                    yield* Effect.yieldNow;
                    expect((yield* AtomRegistry.getResult(appAtomRegistry, aiModelStorageAtom)).unusedBytes).toBe(1_000);
                    expect(AsyncResult.isSuccess(appAtomRegistry.get(aiModelStorageAtom))).toBe(true);
                });
                yield* Effect.gen(function* () {
                    patchAtom(chatModelSnapshotAtom, { status: AiSubsystemStatusEnum.DOWNLOADING });
                    yield* AtomRegistry.getResult(appAtomRegistry, aiModelStorageAtom, { suspendOnWaiting: true });
                    files.set(CHAT_MODEL_FILENAME, 2_000);
                    patchAtom(chatModelSnapshotAtom, { status: AiSubsystemStatusEnum.READY });
                    yield* Effect.yieldNow;
                    expect(
                        (yield* AtomRegistry.getResult(appAtomRegistry, aiModelStorageAtom, { suspendOnWaiting: true })).totalBytes
                    ).toBe(2_000);
                });
            })
        )
    );
});
