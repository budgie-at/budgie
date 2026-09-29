import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined } from '@rnw-community/shared';

import { aiAtomRegistry } from '../constant/ai-atom-registry.constant';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { LlamaConfigInterface } from '../interface/llama-config.interface';
import { LlamaSubsystemSnapshotInterface } from '../interface/llama-subsystem-snapshot.interface';
import { GPU_LAYERS } from '../util/ai-constants.util';
import { downloadModel } from '../util/download-model.util';
import { getRootErrorMessage } from '../utils/get-root-error-message.util';
import { patchAtom } from '../utils/patch-atom.util';

import type { LlamaContext } from 'llama.rn';

export class LlamaModelService implements AiSubsystemServiceInterface {
    readonly snapshot = Atom.keepAlive(
        Atom.make<LlamaSubsystemSnapshotInterface>({ status: AiSubsystemStatusEnum.IDLE, downloadProgress: 0, errorMessage: null })
    );

    readonly start = Effect.fn('LlamaModelService.start')(
        function* (this: LlamaModelService) {
            if (this.isReady) {
                return;
            }
            yield* Effect.ignore(this.releaseContext());
            patchAtom(this.snapshot, { status: AiSubsystemStatusEnum.DOWNLOADING, downloadProgress: 0 });
            const modelPath = yield* downloadModel(this.config.modelUrl, this.config.modelFilename, downloadProgress => {
                patchAtom(this.snapshot, { downloadProgress });
            });
            patchAtom(this.snapshot, { status: AiSubsystemStatusEnum.INITIALIZING });
            const { initLlama } = yield* Effect.tryPromise(() => import('llama.rn'));
            this.context = yield* Effect.tryPromise(() =>
                initLlama({
                    model: modelPath,
                    n_ctx: this.config.contextSize,
                    n_gpu_layers: GPU_LAYERS,
                    embedding: this.config.embedding,
                    ...(isDefined(this.config.poolingType) && { pooling_type: this.config.poolingType })
                })
            );
            patchAtom(this.snapshot, { status: AiSubsystemStatusEnum.READY, errorMessage: null });
        },
        effect =>
            Effect.catchCause(effect, cause =>
                Effect.sync(() => {
                    patchAtom(this.snapshot, {
                        status: AiSubsystemStatusEnum.ERROR,
                        errorMessage: getRootErrorMessage(Cause.squash(cause))
                    });
                })
            )
    );

    readonly stop = Effect.fn('LlamaModelService.stop')(function* (this: LlamaModelService) {
        const { status } = aiAtomRegistry.get(this.snapshot);
        if (status === AiSubsystemStatusEnum.SUSPENDED || status === AiSubsystemStatusEnum.DISABLED) {
            return;
        }
        const exit = yield* Effect.exit(this.releaseContext());
        patchAtom(this.snapshot, { status: AiSubsystemStatusEnum.SUSPENDED, ...(Exit.isSuccess(exit) && { downloadProgress: 0 }) });
    });

    readonly resetError = Effect.fn('LlamaModelService.resetError')(function* (this: LlamaModelService) {
        yield* Effect.ignore(this.releaseContext());
        patchAtom(this.snapshot, { status: AiSubsystemStatusEnum.IDLE, errorMessage: null });
    });

    context: LlamaContext | null = null;

    constructor(private readonly config: LlamaConfigInterface) {}

    get isReady(): boolean {
        return aiAtomRegistry.get(this.snapshot).status === AiSubsystemStatusEnum.READY;
    }

    private releaseContext(): Effect.Effect<void, Cause.UnknownError> {
        const { context } = this;
        this.context = null;

        return isDefined(context) ? Effect.tryPromise(() => context.release()) : Effect.void;
    }
}
