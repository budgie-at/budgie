import { AiInvokeError, ChatInvoker } from '@budgie/ai';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { NativeCallError } from '../../@generic/error/native-call.error';
import { chatModelSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiNotReadyError } from '../error/ai-not-ready.error';
import { CHAT_CONTEXT_SIZE, CHAT_MODEL_FILENAME, CHAT_MODEL_URL } from '../utils/ai-constants.util';
import { runCompletion } from '../utils/run-completion.util';

import { LlamaModelService } from './llama-model.service';

import type { GenerateOptionsInterface } from '@budgie/ai';

export class ChatService extends Context.Service<ChatService>()('@budgie/app/ChatService', {
    make: Effect.sync(() => {
        const model = new LlamaModelService({
            modelUrl: CHAT_MODEL_URL,
            modelFilename: CHAT_MODEL_FILENAME,
            contextSize: CHAT_CONTEXT_SIZE,
            embedding: false,
            snapshot: chatModelSnapshotAtom
        });

        return {
            model,
            get isReady(): boolean {
                return model.isReady;
            },
            generate: (
                systemPrompt: string,
                userMessage: string,
                options?: GenerateOptionsInterface
            ): Effect.Effect<string, AiInvokeError> =>
                model.contextLock.withPermit(
                    Effect.suspend(() => {
                        const { context } = model;

                        return model.isReady && isDefined(context)
                            ? runCompletion(context, systemPrompt, userMessage, options)
                            : Effect.fail(new AiInvokeError({ cause: new AiNotReadyError({ subsystem: AiSubsystemNameEnum.CHAT }) }));
                    })
                ),
            interrupt: Effect.gen(function* () {
                const { context } = model;
                if (isDefined(context)) {
                    yield* Effect.tryPromise({
                        try: () => Promise.resolve(context.stopCompletion()),
                        catch: cause => new NativeCallError({ cause })
                    });
                }
                yield* model.contextLock.withPermit(Effect.void);
            }).pipe(Effect.uninterruptible)
        };
    })
}) {
    static readonly layer = Layer.effect(ChatService, ChatService.make);

    static readonly invokerLayer = Layer.effect(ChatInvoker, ChatService).pipe(Layer.provide(ChatService.layer));
}
