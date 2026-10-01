import { homedir } from 'node:os';
import { basename, join } from 'node:path';

import { EMBEDDING_CONTEXT_SIZE, EMBEDDING_MODEL_FILENAME, EMBEDDING_MODEL_URL } from '@app/ai/util/ai-constants.util';
import * as Effect from 'effect/Effect';
import { http, passthrough } from 'msw';
import { getLlama, resolveModelFile } from 'node-llama-cpp';

import { isNotEmptyString } from '@rnw-community/shared';

import { mockServer } from '../scenario/mock-server';

const modelSource = process.env['BUDGIE_EMBEDDING_MODEL'];

const normalize = (vector: readonly number[]): Float32Array => {
    const norm = Math.hypot(...vector);

    return Float32Array.from(vector, value => value / norm);
};

export const embedCategorizationEvalTexts = Effect.fnUntraced(function* (documents: readonly string[], queries: readonly string[]) {
    const directory = join(homedir(), '.cache', 'budgie-models');

    mockServer.use(http.all('*', () => passthrough()));

    const modelPath = yield* Effect.tryPromise(() =>
        isNotEmptyString(modelSource)
            ? resolveModelFile(modelSource, directory)
            : resolveModelFile(EMBEDDING_MODEL_URL, { directory, fileName: EMBEDDING_MODEL_FILENAME })
    );
    const isEmbeddingGemma = basename(modelPath).toLowerCase().includes('embeddinggemma');
    const llama = yield* Effect.acquireRelease(
        Effect.tryPromise(() => getLlama()),
        instance => Effect.promise(() => instance.dispose())
    );
    const model = yield* Effect.tryPromise(() => llama.loadModel({ modelPath }));
    const context = yield* Effect.tryPromise(() => model.createEmbeddingContext({ contextSize: EMBEDDING_CONTEXT_SIZE }));
    const embedAll = (texts: readonly string[], prefix: string) =>
        Effect.forEach(new Set(texts), text =>
            Effect.map(
                Effect.tryPromise(() => context.getEmbeddingFor(`${prefix}${text}`)),
                embedding => [text, normalize(embedding.vector)] as const
            )
        ).pipe(Effect.map(vectors => new Map(vectors)));

    return {
        modelFile: basename(modelPath),
        documentVectors: yield* embedAll(documents, isEmbeddingGemma ? 'title: none | text: ' : ''),
        queryVectors: yield* embedAll(queries, isEmbeddingGemma ? 'task: search result | query: ' : '')
    };
}, Effect.scoped);
