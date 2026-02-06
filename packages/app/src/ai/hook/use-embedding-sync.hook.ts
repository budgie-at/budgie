import { useEffect, useRef } from 'react';

import { isNotEmptyArray } from '@rnw-community/shared';

import { titleEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { EMBEDDING_BATCH_LIMIT } from '../constant/embedding.constant';
import { LlmInterface } from '../context/llm.context';
import { EmbeddingLlmService } from '../service/embedding-llm.service';
import { serializeEmbedding } from '../util/serialize-embedding.util';

export const useEmbeddingSync = (llm: LlmInterface): void => {
    const isSyncingRef = useRef(false);

    useEffect(() => {
        if (!llm.isReady || isSyncingRef.current) {
            return;
        }

        const syncEmbeddings = async (): Promise<void> => {
            isSyncingRef.current = true;

            try {
                const unembeddedTitles = await titleEmbeddingRepository.findUnembeddedTitles(EMBEDDING_BATCH_LIMIT);

                if (!isNotEmptyArray(unembeddedTitles)) {
                    return;
                }

                const service = new EmbeddingLlmService(llm);
                const embeddings = await service.generateEmbeddings(unembeddedTitles);

                for (const [title, embeddingVector] of embeddings) {
                    const serialized = serializeEmbedding(embeddingVector);
                    await titleEmbeddingRepository.upsert(title, serialized, embeddingVector.length); // eslint-disable-line no-await-in-loop -- Sequential DB writes for upsert consistency
                }
            } finally {
                isSyncingRef.current = false;
            }
        };

        void syncEmbeddings();
    }, [llm, llm.isReady]);
};
