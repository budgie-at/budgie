import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { categorizeInboxMerchantKeyService } from './categorize-inbox-merchant-key.service';

import type { CategorizeInboxPosteriorInterface } from '../interface/categorize-inbox-posterior.interface';
import type {
    CategoryEntityInterface,
    CategoryEvidenceRowInterface,
    CategoryScoreResultInterface,
    CategorizeInboxRowInterface,
    TransactionTypeEnum
} from '@budgie/contracts';

export class CategorizeInboxEvidenceIndex {
    private static readonly FUSION = {
        oldWeight: 0.5,
        exactConcentration: 1,
        normalizedConcentration: 2,
        prefixConcentration: 4,
        mccConcentration: 6,
        embeddingWeight: 0.5,
        rerankCandidateCount: 8,
        rerankCandidateCoverage: 0.9,
        fallbackCandidateCount: 30
    } as const;

    private static readonly EMPTY_COUNTS: ReadonlyMap<number, number> = new Map();

    private readonly exact = new Map<string, Map<number, number>>();
    private readonly normalized = new Map<string, Map<number, number>>();
    private readonly prefix = new Map<string, Map<number, number>>();
    private readonly mcc = new Map<string, Map<number, number>>();
    private readonly global = new Map<string, Map<number, number>>();
    private readonly categoryIdsByType = new Map<TransactionTypeEnum, readonly number[]>();
    private readonly globalPriorByType = new Map<TransactionTypeEnum, ReadonlyMap<number, number>>();
    private readonly fallbackCategoryIds: readonly number[];

    constructor(evidence: readonly CategoryEvidenceRowInterface[], categories: readonly Pick<CategoryEntityInterface, 'id'>[]) {
        this.fallbackCategoryIds = categories.map(category => category.id);

        evidence.forEach(row => {
            this.addRow(row);
        });
    }

    computePosterior(rows: readonly CategorizeInboxRowInterface[]): CategorizeInboxPosteriorInterface {
        const [{ type }] = rows;
        const keys = rows.map(row => categorizeInboxMerchantKeyService.buildKeys(row.title));
        const mccCounts = this.buildMccCounts(rows);

        return this.fusePosterior(
            {
                type,
                categoryIds: this.resolveCategoryIds(type),
                prior: this.smooth(mccCounts, this.resolveGlobalPrior(type), CategorizeInboxEvidenceIndex.FUSION.mccConcentration),
                exactCounts: this.mergeCounts(this.exact, type, new Set(rows.map(row => row.title.toLowerCase()))),
                normalizedCounts: this.mergeCounts(this.normalized, type, new Set(keys.map(merchantKey => merchantKey.normalizedKey))),
                prefixCounts: this.mergeCounts(
                    this.prefix,
                    type,
                    new Set(keys.map(merchantKey => merchantKey.prefixKey).filter(isDefined))
                ),
                mccCounts
            },
            []
        );
    }

    fusePosterior(
        posterior: Omit<CategorizeInboxPosteriorInterface, 'probabilities' | 'embeddingShares'>,
        embeddingScores: readonly CategoryScoreResultInterface[]
    ): CategorizeInboxPosteriorInterface {
        const { FUSION } = CategorizeInboxEvidenceIndex;
        const embeddingShares = this.buildEmbeddingShares(embeddingScores, posterior.categoryIds);
        const prefixSmoothed = this.smooth(
            posterior.prefixCounts,
            this.blendEmbedding(posterior.prior, embeddingShares),
            FUSION.prefixConcentration
        );
        const normalizedSmoothed = this.smooth(posterior.normalizedCounts, prefixSmoothed, FUSION.normalizedConcentration);

        return {
            ...posterior,
            embeddingShares,
            probabilities: this.smooth(posterior.exactCounts, normalizedSmoothed, FUSION.exactConcentration)
        };
    }

    selectRerankCandidates(posterior: CategorizeInboxPosteriorInterface): number[] {
        const { FUSION } = CategorizeInboxEvidenceIndex;
        const topCandidates = CategorizeInboxEvidenceIndex.rankCategories(posterior.probabilities).slice(0, FUSION.rerankCandidateCount);

        if (this.sumValues(topCandidates.map(([, probability]) => probability)) >= FUSION.rerankCandidateCoverage) {
            return topCandidates.map(([categoryId]) => categoryId);
        }

        const globalCounts = this.global.get(posterior.type) ?? CategorizeInboxEvidenceIndex.EMPTY_COUNTS;

        return CategorizeInboxEvidenceIndex.rankCategories(
            new Map(posterior.categoryIds.map(categoryId => [categoryId, globalCounts.get(categoryId) ?? 0]))
        )
            .slice(0, FUSION.fallbackCandidateCount)
            .map(([categoryId]) => categoryId);
    }

    private addRow(row: CategoryEvidenceRowInterface): void {
        const weight = row.recentCount + CategorizeInboxEvidenceIndex.FUSION.oldWeight * (row.count - row.recentCount);

        this.increment(this.global, row.type, row.categoryId, weight);

        if (isDefined(row.mccCategoryId)) {
            this.increment(this.mcc, this.buildKey(row.type, String(row.mccCategoryId)), row.categoryId, weight);
        }

        if (!isNotEmptyString(row.title.trim())) {
            return;
        }

        const { normalizedKey, prefixKey } = categorizeInboxMerchantKeyService.buildKeys(row.title);

        this.increment(this.exact, this.buildKey(row.type, row.title.toLowerCase()), row.categoryId, weight);
        this.increment(this.normalized, this.buildKey(row.type, normalizedKey), row.categoryId, weight);

        if (isDefined(prefixKey)) {
            this.increment(this.prefix, this.buildKey(row.type, prefixKey), row.categoryId, weight);
        }
    }

    private resolveCategoryIds(type: TransactionTypeEnum): readonly number[] {
        const cached = this.categoryIdsByType.get(type);

        if (isDefined(cached)) {
            return cached;
        }

        const globalCounts = this.global.get(type);
        const categoryIds =
            isDefined(globalCounts) && isPositiveNumber(globalCounts.size) ? [...globalCounts.keys()] : this.fallbackCategoryIds;

        this.categoryIdsByType.set(type, categoryIds);

        return categoryIds;
    }

    private resolveGlobalPrior(type: TransactionTypeEnum): ReadonlyMap<number, number> {
        const cached = this.globalPriorByType.get(type);

        if (isDefined(cached)) {
            return cached;
        }

        const categoryIds = this.resolveCategoryIds(type);
        const globalCounts = this.global.get(type) ?? CategorizeInboxEvidenceIndex.EMPTY_COUNTS;
        const total = this.sumValues(globalCounts.values());
        const globalPrior = new Map(
            categoryIds.map(categoryId => [categoryId, ((globalCounts.get(categoryId) ?? 0) + 1) / (total + categoryIds.length)])
        );

        this.globalPriorByType.set(type, globalPrior);

        return globalPrior;
    }

    private buildMccCounts(rows: readonly CategorizeInboxRowInterface[]): Map<number, number> {
        const mccRowCounts = new Map<number, number>();
        const counts = new Map<number, number>();

        rows.forEach(row => {
            if (isDefined(row.mccCategoryId)) {
                mccRowCounts.set(row.mccCategoryId, (mccRowCounts.get(row.mccCategoryId) ?? 0) + 1);
            }
        });

        mccRowCounts.forEach((mccRowCount, mccCategoryId) => {
            const share = mccRowCount / rows.length;
            const mccCounts = this.mcc.get(this.buildKey(rows[0].type, String(mccCategoryId))) ?? CategorizeInboxEvidenceIndex.EMPTY_COUNTS;

            mccCounts.forEach((count, categoryId) => {
                counts.set(categoryId, (counts.get(categoryId) ?? 0) + share * count);
            });
        });

        return counts;
    }

    private buildEmbeddingShares(scores: readonly CategoryScoreResultInterface[], categoryIds: readonly number[]): Map<number, number> {
        const knownCategoryIds = new Set(categoryIds);
        const relevantScores = scores.filter(score => knownCategoryIds.has(score.categoryId) && isPositiveNumber(score.score));
        const total = this.sumValues(relevantScores.map(score => score.score));

        return new Map(relevantScores.map(score => [score.categoryId, score.score / total]));
    }

    private blendEmbedding(prior: ReadonlyMap<number, number>, embeddingShares: ReadonlyMap<number, number>): ReadonlyMap<number, number> {
        const { embeddingWeight } = CategorizeInboxEvidenceIndex.FUSION;

        if (!isPositiveNumber(embeddingShares.size)) {
            return prior;
        }

        return new Map(
            [...prior].map(([categoryId, probability]) => [
                categoryId,
                embeddingWeight * (embeddingShares.get(categoryId) ?? 0) + (1 - embeddingWeight) * probability
            ])
        );
    }

    private smooth(counts: ReadonlyMap<number, number>, prior: ReadonlyMap<number, number>, concentration: number): Map<number, number> {
        const total = this.sumValues(counts.values());

        return new Map(
            [...prior].map(([categoryId, probability]) => [
                categoryId,
                ((counts.get(categoryId) ?? 0) + concentration * probability) / (total + concentration)
            ])
        );
    }

    private mergeCounts(
        level: ReadonlyMap<string, ReadonlyMap<number, number>>,
        type: TransactionTypeEnum,
        keys: ReadonlySet<string>
    ): Map<number, number> {
        const merged = new Map<number, number>();

        keys.forEach(key => {
            level
                .get(this.buildKey(type, key))
                ?.forEach((count, categoryId) => merged.set(categoryId, (merged.get(categoryId) ?? 0) + count));
        });

        return merged;
    }

    private increment(level: Map<string, Map<number, number>>, key: string, categoryId: number, weight: number): void {
        const counts = level.get(key) ?? new Map<number, number>();

        counts.set(categoryId, (counts.get(categoryId) ?? 0) + weight);
        level.set(key, counts);
    }

    private buildKey(type: TransactionTypeEnum, key: string): string {
        return `${type}|${key}`;
    }

    private sumValues(values: Iterable<number>): number {
        return [...values].reduce((total, value) => total + value, 0);
    }

    static rankCategories(probabilities: ReadonlyMap<number, number>): [number, number][] {
        return [...probabilities].sort(([leftId, left], [rightId, right]) => right - left || leftId - rightId);
    }
}
