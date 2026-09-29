import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Atom from 'effect/reactivity/Atom';
import * as Semaphore from 'effect/Semaphore';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { ManualAudioStreamAdapter } from '../adapter/manual-audio-stream.adapter';
import { aiAtomRegistry } from '../constant/ai-atom-registry.constant';
import { STT_BEAM_SIZE, STT_MAX_THREADS, STT_MAX_TRANSCRIPTION_LEN, STT_TEMPERATURE } from '../constant/stt-realtime-options.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiNotReadyError } from '../error/ai-not-ready.error';
import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { SttSnapshotInterface } from '../interface/stt-snapshot.interface';
import { getRootErrorMessage } from '../utils/get-root-error-message.util';
import { patchAtom } from '../utils/patch-atom.util';

import { whisperModelService } from './whisper-model.service';

import type { WhisperContext } from 'whisper.rn';

class SttService implements AiSubsystemServiceInterface {
    readonly snapshot = Atom.keepAlive(
        Atom.make<SttSnapshotInterface>({
            status: AiSubsystemStatusEnum.IDLE,
            downloadProgress: 0,
            errorMessage: null,
            committedTranscription: '',
            nonCommittedTranscription: ''
        })
    );

    readonly start = Effect.fn('SttService.start')(
        function* (this: SttService) {
            if (this.isReady) {
                return;
            }
            patchAtom(this.snapshot, { status: AiSubsystemStatusEnum.DOWNLOADING, downloadProgress: 0 });
            const modelPath = yield* whisperModelService.download(downloadProgress => {
                patchAtom(this.snapshot, { downloadProgress });
            });
            patchAtom(this.snapshot, { status: AiSubsystemStatusEnum.INITIALIZING });
            const whisper = yield* Effect.tryPromise(() => import('whisper.rn'));
            this.whisper = whisper;
            this.context = yield* Effect.tryPromise(() => whisper.initWhisper({ filePath: modelPath }));
            patchAtom(this.snapshot, { status: AiSubsystemStatusEnum.READY, errorMessage: null });
        },
        effect =>
            Effect.catchCause(effect, cause =>
                Effect.sync(() => {
                    this.context = null;
                    whisperModelService.delete();
                    patchAtom(this.snapshot, {
                        status: AiSubsystemStatusEnum.ERROR,
                        errorMessage: getRootErrorMessage(Cause.squash(cause))
                    });
                })
            )
    );

    readonly stop = Effect.fn('SttService.stop')(function* (this: SttService) {
        const { status } = aiAtomRegistry.get(this.snapshot);
        if (status === AiSubsystemStatusEnum.SUSPENDED || status === AiSubsystemStatusEnum.DISABLED) {
            return;
        }
        yield* Effect.ignore(this.stopStream(false));
        this.context = null;
        const { whisper } = this;
        const exit = yield* Effect.exit(isDefined(whisper) ? Effect.tryPromise(() => whisper.releaseAllWhisper()) : Effect.void);
        patchAtom(
            this.snapshot,
            Exit.isSuccess(exit)
                ? {
                      status: AiSubsystemStatusEnum.SUSPENDED,
                      downloadProgress: 0,
                      committedTranscription: '',
                      nonCommittedTranscription: ''
                  }
                : { status: AiSubsystemStatusEnum.SUSPENDED }
        );
    });

    readonly resetError = Effect.fn('SttService.resetError')(function* (this: SttService) {
        yield* Effect.ignore(this.stopStream(false));
        patchAtom(this.snapshot, { status: AiSubsystemStatusEnum.IDLE, errorMessage: null });
    });

    readonly streamStart = Effect.fn('SttService.streamStart')(function* (this: SttService, language: string | null) {
        if (!this.isReady || !isDefined(this.context)) {
            yield* new AiNotReadyError({ subsystem: AiSubsystemNameEnum.STT });
        }
        if (isDefined(this.audioStream)) {
            yield* Effect.ignore(this.stopStream(false));
        }

        patchAtom(this.snapshot, { errorMessage: null, committedTranscription: '', nonCommittedTranscription: '' });
        this.audioStream = new ManualAudioStreamAdapter();
        this.streamLanguage = language;
    });

    readonly stopStream = Effect.fn('SttService.stopStream')(
        function* (this: SttService, commitFinalText: boolean) {
            const { audioStream } = this;
            if (!isDefined(audioStream)) {
                return commitFinalText ? this.committedTranscription : '';
            }
            const finalText = commitFinalText ? yield* this.transcribe(audioStream) : '';
            patchAtom(this.snapshot, { committedTranscription: finalText, nonCommittedTranscription: '' });

            return finalText;
        },
        effect =>
            this.streamLock.withPermit(
                Effect.ensuring(
                    effect,
                    Effect.sync(() => {
                        this.audioStream = null;
                        this.streamLanguage = null;
                    })
                )
            )
    );

    private readonly transcribe = Effect.fnUntraced(function* (this: SttService, audioStream: ManualAudioStreamAdapter) {
        const audioData = audioStream.getCapturedAudio();
        const { context } = this;

        if (!isPositiveNumber(audioData.byteLength)) {
            return '';
        }
        if (!isDefined(context)) {
            return yield* new AiNotReadyError({ subsystem: AiSubsystemNameEnum.STT });
        }
        const audioBuffer = new ArrayBuffer(audioData.byteLength);
        new Uint8Array(audioBuffer).set(audioData);
        const result = yield* Effect.tryPromise(
            () =>
                context.transcribeData(audioBuffer, {
                    ...(isDefined(this.streamLanguage) && { language: this.streamLanguage }),
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

    private readonly streamLock = Semaphore.makeUnsafe(1);
    private context: WhisperContext | null = null;
    private whisper: typeof import('whisper.rn') | null = null;
    private audioStream: ManualAudioStreamAdapter | null = null;
    private streamLanguage: string | null = null;

    get isReady(): boolean {
        return aiAtomRegistry.get(this.snapshot).status === AiSubsystemStatusEnum.READY;
    }

    get committedTranscription(): string {
        return aiAtomRegistry.get(this.snapshot).committedTranscription;
    }

    streamInsert(waveform: Float32Array): void {
        this.audioStream?.push(waveform);
    }
}

export const sttService = new SttService();
