import { homedir } from 'node:os';
import { join } from 'node:path';

import { EMBEDDING_CONTEXT_SIZE, EMBEDDING_MODEL_FILENAME, EMBEDDING_MODEL_URL } from '@app/ai/util/ai-constants.util';
import { EMBEDDING_DOCUMENT_PREFIX, EMBEDDING_QUERY_PREFIX } from '@budgie/categorization';
import * as Effect from 'effect/Effect';
import { getLlama, resolveModelFile } from 'node-llama-cpp';

const normalize = (vector: readonly number[]): Float32Array => {
    const norm = Math.hypot(...vector);

    return Float32Array.from(vector, value => value / norm);
};

export const embedCategorizationEvalTexts = Effect.fnUntraced(function* (documents: readonly string[], queries: readonly string[]) {
    const directory = join(homedir(), '.cache', 'budgie-models');

    const modelPath = yield* Effect.tryPromise(() =>
        resolveModelFile(EMBEDDING_MODEL_URL, { directory, fileName: EMBEDDING_MODEL_FILENAME })
    );
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
        modelFile: EMBEDDING_MODEL_FILENAME,
        documentVectors: yield* embedAll(documents, EMBEDDING_DOCUMENT_PREFIX),
        queryVectors: yield* embedAll(queries, EMBEDDING_QUERY_PREFIX)
    };
}, Effect.scoped);
