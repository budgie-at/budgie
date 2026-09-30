import * as Cause from 'effect/Cause';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as Semaphore from 'effect/Semaphore';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { ManualAudioStreamAdapter } from '../adapter/manual-audio-stream.adapter';
import { aiAtomRegistry } from '../constant/ai-atom-registry.constant';
import { sttSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { STT_BEAM_SIZE, STT_MAX_THREADS, STT_MAX_TRANSCRIPTION_LEN, STT_TEMPERATURE } from '../constant/stt-realtime-options.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiNotReadyError } from '../error/ai-not-ready.error';
import { getRootErrorMessage } from '../utils/get-root-error-message.util';
import { patchAtom } from '../utils/patch-atom.util';

import { WhisperModelService } from './whisper-model.service';

import type { WhisperContext } from 'whisper.rn';

export class SttService extends Context.Service<SttService>()('@budgie/app/SttService', {
    make: Effect.gen(function* () {
        const whisperModelService = yield* WhisperModelService;
        const streamLock = yield* Semaphore.make(1);
        let context: WhisperContext | null = null;
        let whisper: typeof import('whisper.rn') | null = null;
        let audioStream: ManualAudioStreamAdapter | null = null;
        let streamLanguage: string | null = null;

        const isReady = (): boolean => aiAtomRegistry.get(sttSnapshotAtom).status === AiSubsystemStatusEnum.READY;

        const transcribe = Effect.fnUntraced(function* (stream: ManualAudioStreamAdapter) {
            const audioData = stream.getCapturedAudio();
            const whisperContext = context;

            if (!isPositiveNumber(audioData.byteLength)) {
                return '';
            }
            if (!isDefined(whisperContext)) {
                return yield* new AiNotReadyError({ subsystem: AiSubsystemNameEnum.STT });
            }
            const audioBuffer = new ArrayBuffer(audioData.byteLength);
            new Uint8Array(audioBuffer).set(audioData);
            const result = yield* Effect.tryPromise(
                () =>
                    whisperContext.transcribeData(audioBuffer, {
                        ...(isDefined(streamLanguage) && { language: streamLanguage }),
                        translate: false,
                        maxThreads: STT_MAX_THREADS,
                        temperature: STT_TEMPERATURE,
                        temperatureInc: STT_TEMPERATURE,
                        maxLen: STT_MAX_TRANSCRIPTION_LEN,
                        beamSize: STT_BEAM_SIZE
                    }).promise
            );

            return result.result.trim();
        });

        const beginStream = (language: string | null): void => {
            patchAtom(sttSnapshotAtom, { errorMessage: null, committedTranscription: '', nonCommittedTranscription: '' });
            audioStream = new ManualAudioStreamAdapter();
            streamLanguage = language;
        };

        const stopStream = Effect.fn('SttService.stopStream')(
            function* (commitFinalText: boolean) {
                const stream = audioStream;
                if (!isDefined(stream)) {
                    return commitFinalText ? aiAtomRegistry.get(sttSnapshotAtom).committedTranscription : '';
                }
                const finalText = commitFinalText ? yield* transcribe(stream) : '';
                patchAtom(sttSnapshotAtom, { committedTranscription: finalText, nonCommittedTranscription: '' });

                return finalText;
            },
            effect =>
                streamLock.withPermit(
                    Effect.ensuring(
                        effect,
                        Effect.sync(() => {
                            audioStream = null;
                            streamLanguage = null;
                        })
                    )
                )
        );

        return {
            snapshot: sttSnapshotAtom,
            start: Effect.fn('SttService.start')(
                function* () {
                    if (isReady()) {
                        return;
                    }
                    patchAtom(sttSnapshotAtom, { status: AiSubsystemStatusEnum.DOWNLOADING, downloadProgress: 0 });
                    const modelPath = yield* whisperModelService.download(downloadProgress => {
                        patchAtom(sttSnapshotAtom, { downloadProgress });
                    });
                    patchAtom(sttSnapshotAtom, { status: AiSubsystemStatusEnum.INITIALIZING });
                    const whisperModule = yield* Effect.tryPromise(() => import('whisper.rn'));
                    whisper = whisperModule;
                    context = yield* Effect.tryPromise(() => whisperModule.initWhisper({ filePath: modelPath }));
                    patchAtom(sttSnapshotAtom, { status: AiSubsystemStatusEnum.READY, errorMessage: null });
                },
                effect =>
                    Effect.catchCause(effect, cause =>
                        Effect.sync(() => {
                            context = null;
                            whisperModelService.delete();
                            patchAtom(sttSnapshotAtom, {
                                status: AiSubsystemStatusEnum.ERROR,
                                errorMessage: getRootErrorMessage(Cause.squash(cause))
                            });
                        })
                    )
            ),
            stop: Effect.fn('SttService.stop')(function* () {
                const { status } = aiAtomRegistry.get(sttSnapshotAtom);
                if (status === AiSubsystemStatusEnum.SUSPENDED || status === AiSubsystemStatusEnum.DISABLED) {
                    return;
                }
                yield* Effect.ignore(stopStream(false));
                context = null;
                const whisperModule = whisper;
                const exit = yield* Effect.exit(
                    isDefined(whisperModule) ? Effect.tryPromise(() => whisperModule.releaseAllWhisper()) : Effect.void
                );
                patchAtom(
                    sttSnapshotAtom,
                    Exit.isSuccess(exit)
                        ? {
                              status: AiSubsystemStatusEnum.SUSPENDED,
                              downloadProgress: 0,
                              committedTranscription: '',
                              nonCommittedTranscription: ''
                          }
                        : { status: AiSubsystemStatusEnum.SUSPENDED }
                );
            }),
            streamStart: Effect.fn('SttService.streamStart')(function* (language: string | null) {
                if (!isReady() || !isDefined(context)) {
                    yield* new AiNotReadyError({ subsystem: AiSubsystemNameEnum.STT });
                }
                if (isDefined(audioStream)) {
                    yield* Effect.ignore(stopStream(false));
                }

                beginStream(language);
            }),
            stopStream,
            streamInsert: (waveform: Float32Array): void => {
                audioStream?.push(waveform);
            }
        };
    })
}) {
    static readonly layer = Layer.effect(SttService, SttService.make).pipe(Layer.provide(WhisperModelService.layer));
}
