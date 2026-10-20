import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { NativeCallError } from '@app/@generic/error/native-call.error';
import { chatModelSnapshotAtom, embeddingModelSnapshotAtom, sttSnapshotAtom } from '@app/ai/constant/ai-snapshot-atoms.constant';
import { AiSubsystemNameEnum } from '@app/ai/enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '@app/ai/enum/ai-subsystem-status.enum';
import { AiModelResidencyService } from '@app/ai/service/ai-model-residency.service';
import { ChatService } from '@app/ai/service/chat.service';
import { LocalEmbeddingService } from '@app/ai/service/embedding.service';
import { SttService } from '@app/ai/service/stt.service';
import { WhisperModelService } from '@app/ai/service/whisper-model.service';
import { describe, expect, it } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Fiber from 'effect/Fiber';
import * as Layer from 'effect/Layer';
import { beforeEach, vi } from 'vitest';

import { emptyFn, isDefined } from '@rnw-community/shared';

const native = vi.hoisted(() => {
    const context = {
        release: vi.fn(() => Promise.resolve()),
        stopCompletion: vi.fn((): undefined | Promise<void> => Promise.resolve()),
        completion: vi.fn(() => Promise.resolve({ text: 'done', interrupted: false })),
        embedding: vi.fn(() => Promise.resolve({ embedding: [1] }))
    };
    const whisperContext = { transcribeData: vi.fn(() => ({ promise: Promise.resolve({ result: 'done' }) })) };

    return {
        context,
        whisperContext,
        initialize: vi.fn(() => Promise.resolve(context)),
        initializeWhisper: vi.fn(() => Promise.resolve(whisperContext)),
        releaseWhisper: vi.fn(() => Promise.resolve())
    };
});

vi.mock('llama.rn', () => ({ initLlama: native.initialize }));
vi.mock('whisper.rn', () => ({ initWhisper: native.initializeWhisper, releaseAllWhisper: native.releaseWhisper }));
vi.mock('@app/ai/utils/download-model.util', () => ({ downloadModel: () => Effect.succeed('/tmp/model') }));

beforeEach(() => {
    native.context.release.mockReset().mockResolvedValue(void 0);
    native.context.stopCompletion.mockReset().mockResolvedValue(void 0);
    native.context.completion.mockReset().mockResolvedValue({ text: 'done', interrupted: false });
    native.context.embedding.mockReset().mockResolvedValue({ embedding: [1] });
    native.initialize.mockReset().mockResolvedValue(native.context);
    native.initializeWhisper.mockReset().mockResolvedValue(native.whisperContext);
    native.whisperContext.transcribeData.mockReset().mockReturnValue({ promise: Promise.resolve({ result: 'done' }) });
    native.releaseWhisper.mockReset().mockResolvedValue(void 0);
    appAtomRegistry.update(sttSnapshotAtom, previous => ({ ...previous, status: AiSubsystemStatusEnum.IDLE }));
    for (const snapshot of [chatModelSnapshotAtom, embeddingModelSnapshotAtom]) {
        appAtomRegistry.update(snapshot, previous => ({ ...previous, status: AiSubsystemStatusEnum.IDLE }));
    }
});

const transcriptionSampleCount = 6_400;

const sttLayer = Layer.mock(WhisperModelService, { download: () => Effect.succeed('/tmp/whisper'), delete: emptyFn });

const holdNativeCall = Effect.fnUntraced(function* <A>(result: A) {
    const services = yield* Effect.context();
    const completed = yield* Deferred.make<boolean>();
    const entered = yield* Deferred.make<boolean>();

    return {
        entered: Deferred.await(entered),
        complete: Deferred.succeed(completed, true),
        invoke: () =>
            Effect.runPromiseWith(services)(
                Deferred.succeed(entered, true).pipe(Effect.andThen(Deferred.await(completed)), Effect.as(result))
            )
    };
});

const interruptAndStop = Effect.fnUntraced(function* <A, E, B, E2, R>(running: Fiber.Fiber<A, E>, stop: Effect.Effect<B, E2, R>) {
    const interrupting = yield* Effect.forkChild(Fiber.interrupt(running));
    const stopping = yield* Effect.forkChild(stop);
    yield* Effect.yieldNow;

    return {
        running: !isDefined(running.pollUnsafe()),
        stopping: !isDefined(stopping.pollUnsafe()),
        join: Effect.andThen(Fiber.join(interrupting), Fiber.join(stopping))
    };
});

describe('AI native ownership', () => {
    it.effect('interrupts a loaded context when native stopCompletion returns synchronous undefined', () =>
        Effect.gen(function* () {
            const chat = yield* ChatService.make;
            yield* chat.model.start();
            expect(chat.model.context).toBe(native.context);
            native.context.stopCompletion.mockReturnValueOnce(void 0);
            yield* chat.interrupt;
            expect(native.context.stopCompletion).toHaveReturnedWith(void 0);
            yield* chat.model.stop();
        })
    );

    it.effect('preserves NativeCallError when native stopCompletion rejects', () =>
        Effect.gen(function* () {
            const chat = yield* ChatService.make;
            yield* chat.model.start();
            const cause = new Error('stop failed');
            native.context.stopCompletion.mockRejectedValueOnce(cause);
            expect(yield* Effect.flip(chat.interrupt)).toEqual(new NativeCallError({ cause }));
            yield* chat.model.stop();
        })
    );

    it.effect('retains the llama context and protected status when release fails, then retries', () =>
        Effect.gen(function* () {
            const chat = yield* ChatService.make;
            yield* chat.model.start();
            native.context.release.mockRejectedValueOnce(new Error('release failed'));
            expect(Exit.isFailure(yield* Effect.exit(chat.model.stop()))).toBe(true);
            expect(chat.model.context).toBe(native.context);
            expect(appAtomRegistry.get(chat.model.snapshot).status).not.toBe(AiSubsystemStatusEnum.SUSPENDED);
            yield* chat.model.stop();
            expect(native.context.release).toHaveBeenCalledTimes(2);
            expect(chat.model.context).toBeNull();
            expect(appAtomRegistry.get(chat.model.snapshot).status).toBe(AiSubsystemStatusEnum.SUSPENDED);
        })
    );

    it.effect('retains whisper ownership and retries a failed native release', () =>
        Effect.gen(function* () {
            const stt = yield* SttService.make;
            yield* stt.start();
            native.releaseWhisper.mockRejectedValueOnce(new Error('release failed'));
            expect(Exit.isFailure(yield* Effect.exit(stt.stop()))).toBe(true);
            expect(appAtomRegistry.get(stt.snapshot).status).toBe(AiSubsystemStatusEnum.ERROR);
            yield* stt.stop();
            expect(native.releaseWhisper).toHaveBeenCalledTimes(2);
            expect(appAtomRegistry.get(stt.snapshot).status).toBe(AiSubsystemStatusEnum.SUSPENDED);
        }).pipe(Effect.provide(sttLayer))
    );
});

describe('AI native ownership initialization', () => {
    it.effect('joins initialization before an interrupted owner can release its context', () =>
        Effect.gen(function* () {
            const chat = yield* ChatService.make;
            const initialization = yield* holdNativeCall(native.context);
            native.initialize.mockImplementation(initialization.invoke);
            const starting = yield* Effect.forkChild(chat.model.start());
            yield* initialization.entered;
            const interrupting = yield* Effect.forkChild(Fiber.interrupt(starting));
            yield* Effect.yieldNow;
            const stopping = yield* Effect.forkChild(chat.model.stop());
            yield* Effect.yieldNow;
            const pending = {
                starting: !isDefined(starting.pollUnsafe()),
                stopping: !isDefined(stopping.pollUnsafe()),
                prematureReleases: native.context.release.mock.calls.length
            };
            yield* initialization.complete.pipe(Effect.andThen(Fiber.join(interrupting)), Effect.andThen(Fiber.join(stopping)));
            yield* Effect.sync(() => {
                expect(pending).toEqual({ starting: true, stopping: true, prematureReleases: 0 });
                expect(native.context.release).toHaveBeenCalledTimes(1);
            });
        })
    );

    it.effect('keeps the completion lock until actual native completion settles after interruption', () =>
        Effect.gen(function* () {
            const chat = yield* ChatService.make;
            yield* chat.model.start();
            const completion = yield* holdNativeCall({ text: 'done', interrupted: true });
            native.context.completion.mockImplementation(completion.invoke);
            const generating = yield* Effect.forkChild(chat.generate('system', 'user'));
            yield* completion.entered;
            const interrupted = yield* interruptAndStop(generating, chat.interrupt);
            expect(interrupted.running).toBe(true);
            expect(interrupted.stopping).toBe(true);
            yield* completion.complete;
            yield* interrupted.join;
            yield* chat.model.stop();
        })
    );

    it.effect('joins whisper initialization before suspension', () =>
        Effect.gen(function* () {
            const stt = yield* SttService.make;
            const initialization = yield* holdNativeCall(native.whisperContext);
            native.initializeWhisper.mockImplementation(initialization.invoke);
            const starting = yield* Effect.forkChild(stt.start());
            yield* initialization.entered;
            const stopping = yield* Effect.forkChild(stt.stop());
            yield* Effect.yieldNow;
            const prematureReleases = native.releaseWhisper.mock.calls.length;
            yield* initialization.complete.pipe(Effect.andThen(Fiber.join(starting)), Effect.andThen(Fiber.join(stopping)));
            expect(prematureReleases).toBe(0);
            expect(native.releaseWhisper).toHaveBeenCalledTimes(1);
            expect(appAtomRegistry.get(stt.snapshot).status).toBe(AiSubsystemStatusEnum.SUSPENDED);
        }).pipe(Effect.provide(sttLayer))
    );
});

describe('AI native ownership in-flight work', () => {
    it.effect('joins interrupted transcription before native release', () =>
        Effect.gen(function* () {
            const stt = yield* SttService.make;
            yield* Effect.gen(function* () {
                yield* stt.start();
                yield* stt.streamStart(null);
                stt.streamInsert(new Float32Array(transcriptionSampleCount).fill(0.5));
            });
            const transcription = yield* holdNativeCall({ result: 'done' });
            native.whisperContext.transcribeData.mockImplementation(() => ({ promise: transcription.invoke() }));
            const transcribing = yield* Effect.forkChild(stt.stopStream(true));
            yield* transcription.entered;
            const interrupted = yield* interruptAndStop(transcribing, stt.stop());
            const prematureReleases = native.releaseWhisper.mock.calls.length;
            yield* transcription.complete;
            yield* interrupted.join;
            expect(prematureReleases).toBe(0);
        }).pipe(Effect.provide(sttLayer))
    );

    it.effect('awaits residency resume and serializes its native initialization with suspension', () =>
        Effect.gen(function* () {
            const residency = yield* AiModelResidencyService.make.pipe(
                Effect.provide(
                    Layer.mergeAll(
                        Layer.succeed(ChatService, yield* ChatService.make),
                        Layer.succeed(LocalEmbeddingService, yield* LocalEmbeddingService.make),
                        Layer.mock(SttService, {
                            snapshot: sttSnapshotAtom,
                            streamInsert: emptyFn,
                            start: () => Effect.void,
                            stop: () => Effect.void
                        })
                    )
                )
            );
            yield* residency.acquire(AiSubsystemNameEnum.CHAT);
            const initialization = yield* holdNativeCall(native.context);
            native.initialize.mockImplementation(initialization.invoke);
            const resuming = yield* Effect.forkChild(residency.resume(new Set([AiSubsystemNameEnum.CHAT])));
            yield* initialization.entered;
            const suspending = yield* Effect.forkChild(residency.suspend());
            yield* Effect.yieldNow;
            const pending = { resuming: !isDefined(resuming.pollUnsafe()), prematureReleases: native.context.release.mock.calls.length };
            yield* initialization.complete.pipe(Effect.andThen(Fiber.join(resuming)), Effect.andThen(Fiber.join(suspending)));
            expect(pending).toEqual({ resuming: true, prematureReleases: 0 });
            expect(native.context.release).toHaveBeenCalledTimes(1);
        })
    );

    it.effect('joins embedding native work before interruption releases its caller', () =>
        Effect.gen(function* () {
            const embedding = yield* LocalEmbeddingService.make;
            yield* embedding.model.start();
            const completion = yield* holdNativeCall({ embedding: [1] });
            native.context.embedding.mockImplementation(completion.invoke);
            const generating = yield* Effect.forkChild(embedding.embed('text'));
            yield* completion.entered;
            const interrupted = yield* interruptAndStop(generating, embedding.model.stop());
            const pending = {
                generating: interrupted.running,
                stopping: interrupted.stopping,
                prematureReleases: native.context.release.mock.calls.length
            };
            yield* completion.complete;
            yield* interrupted.join;
            expect(pending).toEqual({ generating: true, stopping: true, prematureReleases: 0 });
        })
    );
});
