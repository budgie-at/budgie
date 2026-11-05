import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Atom from 'effect/reactivity/Atom';
import * as Semaphore from 'effect/Semaphore';

import { isDefined } from '@rnw-community/shared';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { NativeCallError } from '../../@generic/error/native-call.error';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { LlamaConfigInterface } from '../interface/llama-config.interface';
import { LlamaSubsystemSnapshotInterface } from '../interface/llama-subsystem-snapshot.interface';
import { GPU_LAYERS } from '../utils/ai-constants.util';
import { getRootErrorMessage } from '../utils/get-root-error-message.util';
import { patchAtom } from '../utils/patch-atom.util';

import type { AiModelDownloadService } from './ai-model-download.service';
import type * as Context from 'effect/Context';
import type { LlamaContext } from 'llama.rn';

export class LlamaModelService implements AiSubsystemServiceInterface {
    readonly contextLock = Semaphore.makeUnsafe(1);

    readonly start = Effect.gen({ self: this }, function* () {
        if (this.isReady) {
            return;
        }
        yield* this.releaseContext();
        const modelPath = this.modelDownload.modelPath(this.config.name);
        if (!isDefined(modelPath)) {
            patchAtom(this.snapshot, { status: AiSubsystemStatusEnum.DOWNLOADING });

            return;
        }
        patchAtom(this.snapshot, { status: AiSubsystemStatusEnum.INITIALIZING });
        const { initLlama } = yield* Effect.promise(() => import('llama.rn'));
        this.context = yield* Effect.promise(() =>
            initLlama({
                model: modelPath,
                n_ctx: this.config.contextSize,
                n_gpu_layers: GPU_LAYERS,
                embedding: this.config.embedding,
                ...(isDefined(this.config.poolingType) && { pooling_type: this.config.poolingType })
            })
        );
        patchAtom(this.snapshot, { status: AiSubsystemStatusEnum.READY, errorMessage: null });
    }).pipe(
        Effect.catchCause(cause =>
            Effect.sync(() => {
                patchAtom(this.snapshot, {
                    status: AiSubsystemStatusEnum.ERROR,
                    errorMessage: cause.pipe(Cause.squash, getRootErrorMessage)
                });
            })
        ),
        effect => this.contextLock.withPermit(Effect.uninterruptible(effect)),
        Effect.withSpan('LlamaModelService.start')
    );

    readonly stop = Effect.gen({ self: this }, function* () {
        const { status } = appAtomRegistry.get(this.snapshot);
        if (status === AiSubsystemStatusEnum.SUSPENDED || status === AiSubsystemStatusEnum.DISABLED) {
            return;
        }
        yield* this.releaseContext();
        patchAtom(this.snapshot, { status: AiSubsystemStatusEnum.SUSPENDED });
    }).pipe(effect => this.contextLock.withPermit(Effect.uninterruptible(effect)), Effect.withSpan('LlamaModelService.stop'));

    context: LlamaContext | null = null;

    readonly snapshot: Atom.Writable<LlamaSubsystemSnapshotInterface>;

    constructor(
        private readonly config: LlamaConfigInterface,
        private readonly modelDownload: Context.Service.Shape<typeof AiModelDownloadService>
    ) {
        this.snapshot = config.snapshot;
    }

    get isReady(): boolean {
        return appAtomRegistry.get(this.snapshot).status === AiSubsystemStatusEnum.READY;
    }

    private releaseContext(): Effect.Effect<void, NativeCallError> {
        const { context } = this;

        return isDefined(context)
            ? Effect.tryPromise({ try: () => context.release(), catch: cause => NativeCallError.make({ cause }) }).pipe(
                  Effect.tap(() =>
                      Effect.sync(() => {
                          this.context = null;
                      })
                  ),
                  Effect.tapError(error =>
                      Effect.sync(() => {
                          patchAtom(this.snapshot, { status: AiSubsystemStatusEnum.ERROR, errorMessage: getRootErrorMessage(error) });
                      })
                  )
              )
            : Effect.void;
    }
}
