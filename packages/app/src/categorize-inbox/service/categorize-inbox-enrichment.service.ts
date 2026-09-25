import { CategoryRerankLlmService } from '@budgie/ai';
import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { AiSubsystemNameEnum } from '../../ai/enum/ai-subsystem-name.enum';
import { aiModelResidencyService } from '../../ai/service/ai-model-residency.service';
import { SnapshotStore } from '../../ai/service/base-subsystem.service';
import { chatService } from '../../ai/service/chat.service';
import { embeddingSuggestionService } from '../../ai/service/embedding-suggestion.service';
import { CategorizeInboxEnrichmentStatusEnum } from '../enum/categorize-inbox-enrichment-status.enum';

import type { CategorizeInboxEnrichmentRequestInterface } from '../interface/categorize-inbox-enrichment-request.interface';
import type { CategorizeInboxEnrichmentSnapshotInterface } from '../interface/categorize-inbox-enrichment-snapshot.interface';
import type { CategorizeInboxEnrichmentInterface } from '../interface/categorize-inbox-enrichment.interface';
import type { CategoryRerankExampleInterface } from '@budgie/ai';
import type { CategoryEntityInterface } from '@budgie/contracts';

class CategorizeInboxEnrichmentService extends SnapshotStore<CategorizeInboxEnrichmentSnapshotInterface> {
    private generation = 0;
    private categorySignature = '';
    private cache = new Map<string, CategorizeInboxEnrichmentInterface>();
    private rerankedKeys = new Set<string>();
    private exampleCache = new Map<string, CategoryRerankExampleInterface[]>();

    constructor() {
        super({
            status: CategorizeInboxEnrichmentStatusEnum.IDLE,
            enrichments: new Map(),
            processedCount: 0,
            totalCount: 0
        });
    }

    @Log(
        (generation, requests, categories) =>
            `enter generation=${generation} requestCount=${requests.length} categoryCount=${categories.length}`,
        (...[, generation, requests, categories]) =>
            `done generation=${generation} requestCount=${requests.length} categoryCount=${categories.length}`,
        (error, generation, requests, categories) =>
            `throw generation=${generation} requestCount=${requests.length} categoryCount=${categories.length} error=${getErrorMessage(error)}`
    )
    private async run(
        generation: number,
        requests: CategorizeInboxEnrichmentRequestInterface[],
        categories: Pick<CategoryEntityInterface, 'id' | 'title' | 'titleEn'>[]
    ): Promise<void> {
        const isEmbeddingReady = await this.runEmbeddingPhase(generation, requests);

        if (!isEmbeddingReady) {
            if (generation === this.generation) {
                this.setSnapshot({ status: CategorizeInboxEnrichmentStatusEnum.UNAVAILABLE });
            }

            return;
        }

        if (generation !== this.generation) {
            return;
        }

        await this.runRerankPhase(generation, requests, categories);

        if (generation === this.generation) {
            this.setSnapshot({ status: CategorizeInboxEnrichmentStatusEnum.DONE });
        }
    }

    start(
        requests: CategorizeInboxEnrichmentRequestInterface[],
        categories: Pick<CategoryEntityInterface, 'id' | 'title' | 'titleEn'>[]
    ): void {
        if (!isAiEnabled()) {
            this.setSnapshot({ status: CategorizeInboxEnrichmentStatusEnum.UNAVAILABLE });

            return;
        }

        this.generation += 1;
        const currentGeneration = this.generation;
        this.syncCategorySignature(categories);
        const pendingRequests = requests.filter(
            request => !this.cache.has(request.clusterKey) || (request.needsRerank && !this.rerankedKeys.has(request.clusterKey))
        );

        if (!isNotEmptyArray(pendingRequests)) {
            this.setSnapshot({ status: CategorizeInboxEnrichmentStatusEnum.DONE, enrichments: new Map(this.cache) });

            return;
        }

        this.setSnapshot({
            status: CategorizeInboxEnrichmentStatusEnum.RUNNING,
            enrichments: new Map(this.cache),
            processedCount: 0,
            totalCount: pendingRequests.length
        });

        void this.run(currentGeneration, pendingRequests, categories).catch(emptyFn);
    }

    stop(): void {
        this.generation += 1;
    }

    private syncCategorySignature(categories: Pick<CategoryEntityInterface, 'id' | 'title' | 'titleEn'>[]): void {
        const nextCategorySignature = categories.map(category => category.id).join(',');

        if (nextCategorySignature === this.categorySignature) {
            return;
        }

        this.categorySignature = nextCategorySignature;
        this.cache = new Map();
        this.rerankedKeys = new Set();
        this.exampleCache = new Map();
    }

    private async runEmbeddingPhase(generation: number, requests: CategorizeInboxEnrichmentRequestInterface[]): Promise<boolean> {
        const embeddingRequests = requests.filter(request => !this.cache.has(request.clusterKey));
        let isEmbeddingReady = false;

        if (!isNotEmptyArray(embeddingRequests)) {
            return true;
        }

        try {
            isEmbeddingReady = await aiModelResidencyService.acquire(AiSubsystemNameEnum.EMBEDDING);

            if (isEmbeddingReady) {
                await this.runEmbeddingPass(generation, embeddingRequests);
            }
        } finally {
            aiModelResidencyService.release(AiSubsystemNameEnum.EMBEDDING);
        }

        return isEmbeddingReady;
    }

    private async runEmbeddingPass(generation: number, requests: CategorizeInboxEnrichmentRequestInterface[]): Promise<void> {
        await requests.reduce<Promise<number>>(async (previousProcessedCountPromise, request) => {
            const previousProcessedCount = await previousProcessedCountPromise;

            if (generation !== this.generation) {
                return previousProcessedCount;
            }

            const evidence = await embeddingSuggestionService.scoreCategoryEvidence(request.title, request.mccDescription, request.comment);

            if (generation !== this.generation) {
                return previousProcessedCount;
            }

            this.storeEnrichment(request.clusterKey, { embeddingScores: evidence.scores, llmCategoryId: null });
            this.exampleCache.set(
                request.clusterKey,
                evidence.examples.map(example => ({ title: example.title, categoryId: example.categoryId }))
            );
            const processedCount = previousProcessedCount + 1;
            this.setSnapshot({ enrichments: new Map(this.cache), processedCount });

            await microPause();

            return processedCount;
        }, Promise.resolve(0));
    }

    private async runRerankPhase(
        generation: number,
        requests: CategorizeInboxEnrichmentRequestInterface[],
        categories: Pick<CategoryEntityInterface, 'id' | 'title' | 'titleEn'>[]
    ): Promise<void> {
        const rerankRequests = requests.filter(request => request.needsRerank && !this.rerankedKeys.has(request.clusterKey));

        if (!isNotEmptyArray(rerankRequests)) {
            return;
        }

        try {
            if (await aiModelResidencyService.acquire(AiSubsystemNameEnum.CHAT)) {
                await this.runRerankPass(generation, rerankRequests, categories);
            }
        } finally {
            aiModelResidencyService.release(AiSubsystemNameEnum.CHAT);
        }
    }

    private async runRerankPass(
        generation: number,
        requests: CategorizeInboxEnrichmentRequestInterface[],
        categories: Pick<CategoryEntityInterface, 'id' | 'title' | 'titleEn'>[]
    ): Promise<void> {
        const rerankService = new CategoryRerankLlmService(chatService);

        await requests.reduce<Promise<void>>(async (previousRequestPromise, request) => {
            await previousRequestPromise;

            if (generation !== this.generation) {
                return;
            }

            await this.rerankOne(generation, rerankService, request, categories);

            await microPause();
        }, Promise.resolve());
    }

    private async rerankOne(
        generation: number,
        rerankService: CategoryRerankLlmService,
        request: CategorizeInboxEnrichmentRequestInterface,
        categories: Pick<CategoryEntityInterface, 'id' | 'title' | 'titleEn'>[]
    ): Promise<void> {
        const existing = this.cache.get(request.clusterKey);
        const embeddingCategoryIds = existing?.embeddingScores.map(score => score.categoryId) ?? [];
        const candidateIds = new Set([...request.candidateCategoryIds, ...embeddingCategoryIds]);
        const candidates = [...candidateIds]
            .map(categoryId => categories.find(category => category.id === categoryId))
            .filter(isDefined)
            .map(category => ({ id: category.id, title: category.title, titleEn: category.titleEn }));

        const llmCategoryId = await rerankService.pickCategory(
            {
                title: request.title,
                mccDescription: request.mccDescription,
                rowCount: request.rowCount,
                typicalAmountLabel: request.typicalAmountLabel
            },
            candidates,
            this.exampleCache.get(request.clusterKey) ?? []
        );

        if (generation !== this.generation) {
            return;
        }

        this.rerankedKeys.add(request.clusterKey);
        this.storeEnrichment(request.clusterKey, { embeddingScores: existing?.embeddingScores ?? [], llmCategoryId });
        this.setSnapshot({ enrichments: new Map(this.cache) });
    }

    private storeEnrichment(clusterKey: string, enrichment: CategorizeInboxEnrichmentInterface): void {
        this.cache.set(clusterKey, enrichment);
    }
}

export const categorizeInboxEnrichmentService = new CategorizeInboxEnrichmentService();
