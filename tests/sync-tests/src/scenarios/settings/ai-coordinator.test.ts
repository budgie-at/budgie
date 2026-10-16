import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { NativeCallError } from '@app/@generic/error/native-call.error';
import { Workload } from '@app/@generic/service/workload.service';
import {
    aiCoordinatorSnapshotAtom,
    embeddingProgressSnapshotAtom,
    translationDrainerSnapshotAtom,
    translationProgressSnapshotAtom
} from '@app/ai/constant/ai-snapshot-atoms.constant';
import { AiSubsystemNameEnum } from '@app/ai/enum/ai-subsystem-name.enum';
import { AiCoordinatorService } from '@app/ai/service/ai-coordinator.service';
import { AiEmbeddingStatusService } from '@app/ai/service/ai-embedding-status.service';
import { AiModelResidencyService } from '@app/ai/service/ai-model-residency.service';
import { ChatService } from '@app/ai/service/chat.service';
import { EmbeddingDrainerService } from '@app/ai/service/embedding-drainer.service';
import { TranslationDrainerService } from '@app/ai/service/translation-drainer.service';
import { EmbeddingProgressStore } from '@app/ai/store/embedding-progress.store';
import { TranslationProgressStore } from '@app/ai/store/translation-progress.store';
import { Db, SettingsRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as Queue from 'effect/Queue';
import * as SubscriptionRef from 'effect/SubscriptionRef';
import * as TestClock from 'effect/testing/TestClock';
import { vi } from 'vitest';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { Fiber, testDb } from '../../harness';

import type { AiFeatureSettingsInterface } from '@app/ai/interface/ai-feature-settings.interface';

const appState = vi.hoisted(() => ({
    addEventListener: vi.fn((_event: string, _listener: (state: 'active' | 'background') => void) => ({ remove: vi.fn() }))
}));

const native = vi.hoisted(() => ({
    context: { stopCompletion: vi.fn(() => void 0), release: vi.fn(() => Promise.resolve()) }
}));

vi.mock('llama.rn', () => ({ initLlama: () => Promise.resolve(native.context) }));
vi.mock('@app/ai/utils/download-model.util', () => ({ downloadModel: () => Effect.succeed('/tmp/model') }));

vi.mock('react-native', () => ({ AppState: { currentState: 'active', addEventListener: appState.addEventListener } }));

const makeLifecycle = Effect.fnUntraced(function* (
    features: AiFeatureSettingsInterface = {
        isAiVoiceInputEnabled: false,
        isAiSuggestionsEnabled: false,
        isAiTranslationsEnabled: true
    }
) {
    const repository = yield* SettingsRepository;
    yield* repository.update({ isAiEnabled: true, ...features });
    appAtomRegistry.set(aiCoordinatorSnapshotAtom, { isAvailable: true, isSuspended: false });
    const started = yield* Queue.unbounded<boolean>();
    const stopping = yield* Deferred.make<boolean>();
    const resumes: AiSubsystemNameEnum[][] = [];
    const drainerStarts: string[] = [];
    const recordStart = (drainer: string) => () =>
        Effect.sync(() => {
            drainerStarts.push(drainer);
        });
    let shutdown: Effect.Effect<void, NativeCallError> = Effect.void;
    let idle: Effect.Effect<void> = Effect.void;
    const chat = yield* ChatService.make;
    const coordinator = yield* AiCoordinatorService.make.pipe(
        Effect.provide(
            Layer.mergeAll(
                Layer.mock(Workload, { foregroundCount: yield* SubscriptionRef.make(0) }),
                Layer.mock(AiModelResidencyService, {
                    resume: enabled =>
                        Effect.sync(() => {
                            resumes.push([...enabled]);
                        }),
                    suspend: () =>
                        Effect.andThen(
                            Deferred.succeed(stopping, true),
                            Effect.suspend(() => shutdown)
                        )
                }),
                Layer.succeed(ChatService, chat),
                Layer.mock(EmbeddingDrainerService, { drainers: [], start: recordStart('embedding') }),
                Layer.mock(AiEmbeddingStatusService, { migrateModel: () => Effect.void }),
                Layer.mock(TranslationDrainerService, {
                    snapshot: translationDrainerSnapshotAtom,
                    cancelBoost: emptyFn,
                    start: recordStart('translation'),
                    stop: () => Effect.void,
                    halt: () => Effect.void,
                    schedule: () => Effect.void,
                    whenIdle: () => Effect.suspend(() => idle),
                    setForegroundBusy: () => Effect.void
                }),
                Layer.mock(TranslationProgressStore, { snapshot: translationProgressSnapshotAtom, refresh: () => Effect.void }),
                Layer.mock(EmbeddingProgressStore, {
                    snapshot: embeddingProgressSnapshotAtom,
                    refresh: () => Effect.asVoid(Queue.offer(started, true))
                }),
                Layer.succeed(SettingsRepository, repository)
            )
        )
    );
    yield* coordinator.start();
    yield* Queue.take(started);

    return {
        coordinator,
        chat,
        repository,
        drainerStarts,
        resumes,
        stopping,
        started,
        holdShutdown: Effect.gen(function* () {
            const released = yield* Deferred.make<boolean>();
            shutdown = Effect.asVoid(Deferred.await(released));

            return { release: Deferred.succeed(released, true) };
        }),
        setIdle: (effect: typeof idle) => {
            idle = effect;
        },
        setShutdown: (effect: typeof shutdown) => {
            shutdown = effect;
        }
    };
});

describe('AiCoordinatorService lifecycle', () => {
    it.effect('reaches suspension and replacement after synchronous native chat interruption', () =>
        Effect.gen(function* () {
            const { coordinator, chat, resumes, stopping, started } = yield* makeLifecycle();
            yield* chat.model.start();
            expect(chat.model.context).toBe(native.context);
            yield* coordinator.restart();
            expect(Deferred.isDoneUnsafe(stopping)).toBe(true);
            yield* Queue.take(started);
            expect(native.context.stopCompletion).toHaveReturnedWith(void 0);
            expect(resumes).toEqual([[AiSubsystemNameEnum.CHAT], [AiSubsystemNameEnum.CHAT]]);
            yield* coordinator.stop();
            yield* chat.model.stop();
        }).pipe(Effect.provide(SettingsRepository.layer), Effect.provideService(Db, testDb))
    );

    it.effect('joins shutdown before restart and uses the latest committed feature flags', () =>
        Effect.gen(function* () {
            const { coordinator, repository, resumes, stopping, started, holdShutdown } = yield* makeLifecycle();
            const { release } = yield* holdShutdown;
            const restarting = yield* Effect.forkChild(coordinator.restart());
            yield* Deferred.await(stopping);
            yield* repository.update({ isAiTranslationsEnabled: false, isAiSuggestionsEnabled: true });
            yield* Effect.sync(() => {
                expect(resumes).toHaveLength(1);
                expect(!isDefined(restarting.pollUnsafe())).toBe(true);
            });
            yield* release;
            yield* Effect.andThen(Fiber.join(restarting), Queue.take(started));
            expect(resumes).toEqual([[AiSubsystemNameEnum.CHAT], [AiSubsystemNameEnum.EMBEDDING]]);
            yield* Effect.andThen(repository.update({ isAiEnabled: false, isAiSuggestionsEnabled: false }), coordinator.restart());
            expect(resumes).toHaveLength(2);
            yield* coordinator.stop();
        }).pipe(Effect.provide(SettingsRepository.layer), Effect.provideService(Db, testDb))
    );

    it.effect('keeps rapid queued restarts disabled after the final committed toggle', () =>
        Effect.gen(function* () {
            const { coordinator, repository, resumes, stopping, holdShutdown } = yield* makeLifecycle();
            const { release } = yield* holdShutdown;
            const first = yield* Effect.forkChild(coordinator.restart());
            yield* Deferred.await(stopping);
            yield* repository.update({ isAiVoiceInputEnabled: true });
            const second = yield* Effect.forkChild(coordinator.restart());
            yield* repository.update({ isAiEnabled: false, isAiVoiceInputEnabled: false, isAiTranslationsEnabled: false });
            const third = yield* Effect.forkChild(coordinator.restart());
            yield* release;
            yield* Fiber.joinAll([first, second, third]);
            expect(resumes).toHaveLength(1);
            yield* coordinator.stop();
        }).pipe(Effect.provide(SettingsRepository.layer), Effect.provideService(Db, testDb))
    );
});

describe('AI shutdown recovery', () => {
    it.effect.each(['release', 'timeout'] as const)('fails closed on shutdown %s and recovers on retry', failure =>
        Effect.gen(function* () {
            const { coordinator, resumes, started, setIdle, setShutdown } = yield* makeLifecycle();
            const settled = yield* Deferred.make<boolean>();
            const failed = yield* Effect.gen(function* () {
                if (failure === 'timeout') {
                    setIdle(Effect.asVoid(Deferred.await(settled)));
                } else {
                    setShutdown(Effect.fail(new NativeCallError({ cause: 'release failed' })));
                }
                const restarting = yield* Effect.forkChild(Effect.exit(coordinator.restart()));
                if (failure === 'timeout') {
                    yield* TestClock.adjust('5001 millis');
                }
                yield* Deferred.succeed(settled, true);

                return yield* Fiber.join(restarting);
            });
            expect(Exit.isFailure(failed)).toBe(true);
            expect(resumes).toHaveLength(1);
            setIdle(Effect.void);
            setShutdown(Effect.void);
            yield* coordinator.restart();
            yield* Queue.take(started);
            expect(resumes).toHaveLength(2);
            yield* coordinator.stop();
        }).pipe(Effect.provide(SettingsRepository.layer), Effect.provideService(Db, testDb))
    );

    it.effect('retries a failed background shutdown before foreground replacement', () =>
        Effect.gen(function* () {
            const { coordinator, started, stopping, setShutdown } = yield* makeLifecycle();
            const listener = appState.addEventListener.mock.calls.at(-1)?.[1];
            yield* Effect.gen(function* () {
                setShutdown(Effect.fail(new NativeCallError({ cause: 'release failed' })));
                listener?.('background');
                yield* TestClock.adjust(60_000);
                yield* Deferred.await(stopping);
            });
            const retrying = yield* Deferred.make<boolean>();
            setShutdown(Effect.andThen(Deferred.succeed(retrying, true), Effect.fail(new NativeCallError({ cause: 'release failed' }))));
            listener?.('active');
            const transition = yield* Effect.race(Effect.as(Deferred.await(retrying), 'retry'), Effect.as(Queue.take(started), 'restart'));
            setShutdown(Effect.void);
            yield* coordinator.stop();
            expect(transition).toBe('retry');
        }).pipe(Effect.provide(SettingsRepository.layer), Effect.provideService(Db, testDb))
    );
});

describe('AI background transitions', () => {
    it.effect('cancels a pending background timer before restarting the foreground scope', () =>
        Effect.gen(function* () {
            const { coordinator, started } = yield* makeLifecycle();
            const listener = appState.addEventListener.mock.calls.at(-1)?.[1];
            listener?.('background');
            yield* TestClock.adjust(100);
            listener?.('active');
            yield* coordinator.restart();
            yield* Queue.take(started);
            yield* coordinator.stop();
        }).pipe(Effect.provide(SettingsRepository.layer), Effect.provideService(Db, testDb))
    );

    it.effect('orders background release and foreground restart without a scope-close deadlock', () =>
        Effect.gen(function* () {
            const { coordinator, resumes, stopping, holdShutdown } = yield* makeLifecycle();
            const { release } = yield* holdShutdown;
            const listener = appState.addEventListener.mock.calls.at(-1)?.[1];
            listener?.('background');
            yield* TestClock.adjust(60_000);
            yield* Deferred.await(stopping);
            listener?.('active');
            const restarting = yield* Effect.forkChild(coordinator.restart());
            yield* Effect.yieldNow;
            expect(resumes).toHaveLength(1);
            yield* release.pipe(Effect.andThen(Fiber.join(restarting)), Effect.andThen(coordinator.stop()));
        }).pipe(Effect.provide(SettingsRepository.layer), Effect.provideService(Db, testDb))
    );
});

const cases = [
    {
        features: { isAiVoiceInputEnabled: true, isAiSuggestionsEnabled: false, isAiTranslationsEnabled: false },
        subsystems: [AiSubsystemNameEnum.CHAT, AiSubsystemNameEnum.EMBEDDING, AiSubsystemNameEnum.STT],
        startedDrainers: []
    },
    {
        features: { isAiVoiceInputEnabled: false, isAiSuggestionsEnabled: false, isAiTranslationsEnabled: true },
        subsystems: [AiSubsystemNameEnum.CHAT],
        startedDrainers: ['translation']
    }
];

describe('AiCoordinatorService.start', () => {
    it.effect.each(cases)('loads only the models and drainers of enabled features %#', ({ features, subsystems, startedDrainers }) =>
        Effect.gen(function* () {
            const { coordinator, resumes, drainerStarts } = yield* makeLifecycle(features);

            expect(resumes).toEqual([subsystems]);
            expect(drainerStarts).toEqual(startedDrainers);
            yield* coordinator.stop();
        }).pipe(Effect.provide(SettingsRepository.layer), Effect.provideService(Db, testDb))
    );
});
