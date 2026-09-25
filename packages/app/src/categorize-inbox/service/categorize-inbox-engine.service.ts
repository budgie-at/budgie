import { LanguageEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { CATEGORIZE_INBOX_MASKED_PAN_PATTERN } from '../constant/categorize-inbox-masked-pan-pattern.constant';
import { CategorizeInboxCandidateSourceEnum } from '../enum/categorize-inbox-candidate-source.enum';
import { CategorizeInboxClusterKindEnum } from '../enum/categorize-inbox-cluster-kind.enum';
import { CategorizeInboxConfidenceEnum } from '../enum/categorize-inbox-confidence.enum';
import { CategorizeInboxListItemKindEnum } from '../enum/categorize-inbox-list-item-kind.enum';
import { CategorizeInboxSectionEnum } from '../enum/categorize-inbox-section.enum';
import { CategorizeInboxTransferKindEnum } from '../enum/categorize-inbox-transfer-kind.enum';

import { CategorizeInboxEvidenceIndex } from './categorize-inbox-evidence-index';
import { categorizeInboxMerchantKeyService } from './categorize-inbox-merchant-key.service';

import type { CategorizeInboxBuildContextInterface } from '../interface/categorize-inbox-build-context.interface';
import type { CategorizeInboxBuildInputInterface } from '../interface/categorize-inbox-build-input.interface';
import type { CategorizeInboxBuildInterface } from '../interface/categorize-inbox-build.interface';
import type { CategorizeInboxCandidateInterface } from '../interface/categorize-inbox-candidate.interface';
import type { CategorizeInboxClusterInterface } from '../interface/categorize-inbox-cluster.interface';
import type { CategorizeInboxEnrichmentRequestInterface } from '../interface/categorize-inbox-enrichment-request.interface';
import type { CategorizeInboxEnrichmentInterface } from '../interface/categorize-inbox-enrichment.interface';
import type { CategorizeInboxPosteriorInterface } from '../interface/categorize-inbox-posterior.interface';
import type { CategorizeInboxInterface } from '../interface/categorize-inbox.interface';
import type { CategorizeInboxListItemType } from '../type/categorize-inbox-list-item.type';
import type {
    CategoryEntityInterface,
    CategoryEvidenceRowInterface,
    CategorizeInboxRowInterface,
    InstrumentEntityInterface
} from '@budgie/contracts';

class CategorizeInboxEngineService {
    private static readonly FUSION = {
        llmWeight: 0.35,
        highProbability: 0.85,
        highNormalizedCount: 2,
        mediumProbability: 0.55,
        rerankProbability: 0.65,
        chipCount: 3,
        enrichmentLimit: 60,
        rerankLimit: 20,
        impactAmountOffset: 10,
        impactConfidenceDiscount: 0.5,
        ruleValueMinLength: 3
    } as const;

    private static readonly ATM_MCC_CODES: ReadonlySet<string> = new Set(['6010', '6011']);
    private static readonly CARD_TRANSFER_MCC_CODES: ReadonlySet<string> = new Set(['4829']);

    private static readonly ATM_KEYWORDS: Record<LanguageEnum, readonly string[]> = {
        [LanguageEnum.EN]: ['atm', 'cash\\s+withdrawal'],
        [LanguageEnum.UK]: ['банкомат', 'зняття\\s+готівки'],
        [LanguageEnum.DE]: ['bankomat', 'geldautomat', 'bargeld'],
        [LanguageEnum.FR]: ['distributeur', 'retrait'],
        [LanguageEnum.ES]: ['cajero', 'retiro']
    };

    private static readonly CARD_TRANSFER_KEYWORDS: Record<LanguageEnum, readonly string[]> = {
        [LanguageEnum.EN]: ['card\\s+transfer', 'transfer\\s+to\\s+card'],
        [LanguageEnum.UK]: ['переказ\\s+на\\s+картку', 'переказ\\s+з\\s+картки', 'з\\s+картки'],
        [LanguageEnum.DE]: ['umbuchung', 'überweisung\\s+an'],
        [LanguageEnum.FR]: ['virement\\s+carte'],
        [LanguageEnum.ES]: ['transferencia\\s+a\\s+tarjeta']
    };

    private static readonly ATM_PATTERN = CategorizeInboxEngineService.buildKeywordPattern(CategorizeInboxEngineService.ATM_KEYWORDS);
    private static readonly CARD_TRANSFER_PATTERN = CategorizeInboxEngineService.buildKeywordPattern(
        CategorizeInboxEngineService.CARD_TRANSFER_KEYWORDS
    );

    private static readonly MASKED_PAN_PATTERN = new RegExp(CATEGORIZE_INBOX_MASKED_PAN_PATTERN, 'u');
    private static readonly RULE_WORD_PATTERN = /\p{L}{2,}/gu;

    private static readonly SECTION_ORDER: readonly CategorizeInboxSectionEnum[] = [
        CategorizeInboxSectionEnum.CONFIDENT,
        CategorizeInboxSectionEnum.TRANSFERS,
        CategorizeInboxSectionEnum.REVIEW,
        CategorizeInboxSectionEnum.ONE_OFFS
    ];

    private lastBuild: CategorizeInboxBuildInterface | null = null;

    @Log(
        input =>
            `enter rowCount=${input.rows.length} evidenceCount=${input.evidence.length} categoryCount=${input.categories.length} defaultInstrumentId=${input.defaultInstrument.id}`,
        (result, input) =>
            `done rowCount=${input.rows.length} evidenceCount=${input.evidence.length} categoryCount=${input.categories.length} defaultInstrumentId=${input.defaultInstrument.id} clusterCount=${result.inbox.clusters.length} confidentRowCount=${result.inbox.confidentRowCount} requestCount=${result.enrichmentRequests.length}`,
        (error, input) =>
            `throw rowCount=${input.rows.length} evidenceCount=${input.evidence.length} categoryCount=${input.categories.length} defaultInstrumentId=${input.defaultInstrument.id} error=${getErrorMessage(error)}`
    )
    private build(input: CategorizeInboxBuildInputInterface): CategorizeInboxBuildInterface {
        const rows = [...this.groupRows(input.rows, row => String(row.transactionId)).values()].map(([row]) => row);

        categorizeInboxMerchantKeyService.prepare([...rows.map(row => row.title), ...input.evidence.map(row => row.title)]);

        const context: CategorizeInboxBuildContextInterface = {
            index: new CategorizeInboxEvidenceIndex(input.evidence, input.categories),
            defaultInstrumentId: input.defaultInstrument.id,
            posteriors: new Map()
        };
        const clusters = this.buildClusters(rows, context).sort((left, right) => this.compareClusters(left, right));
        const confidentClusters = clusters.filter(cluster => cluster.section === CategorizeInboxSectionEnum.CONFIDENT);

        return {
            input,
            inbox: {
                clusters,
                items: this.buildListItems(clusters),
                totalRowCount: rows.length,
                confidentRowCount: this.sumValues(confidentClusters.map(cluster => cluster.rowCount)),
                confidentAssignments: confidentClusters.map(cluster => ({
                    clusterKey: cluster.key,
                    categoryId: cluster.candidates[0].categoryId,
                    transactionIds: cluster.rows.map(row => row.transactionId),
                    ruleConditionValue: cluster.ruleConditionValue
                }))
            },
            enrichmentRequests: this.buildEnrichmentRequests(clusters, input.defaultInstrument.symbol, context),
            index: context.index,
            posteriors: context.posteriors
        };
    }

    buildInboxWithRequests(
        rows: CategorizeInboxRowInterface[],
        evidence: CategoryEvidenceRowInterface[],
        categories: Pick<CategoryEntityInterface, 'id'>[],
        defaultInstrument: Pick<InstrumentEntityInterface, 'id' | 'symbol'>
    ): CategorizeInboxBuildInterface {
        const { lastBuild } = this;

        if (
            isDefined(lastBuild) &&
            lastBuild.input.rows === rows &&
            lastBuild.input.evidence === evidence &&
            lastBuild.input.categories === categories &&
            lastBuild.input.defaultInstrument.id === defaultInstrument.id &&
            lastBuild.input.defaultInstrument.symbol === defaultInstrument.symbol
        ) {
            return lastBuild;
        }

        this.lastBuild = this.build({ rows, evidence, categories, defaultInstrument });

        return this.lastBuild;
    }

    applyEnrichments(
        build: CategorizeInboxBuildInterface,
        enrichments: ReadonlyMap<string, CategorizeInboxEnrichmentInterface>
    ): CategorizeInboxInterface {
        if (!isPositiveNumber(enrichments.size)) {
            return build.inbox;
        }

        const clusters = build.inbox.clusters.map(cluster => this.enrichCluster(cluster, build, enrichments.get(cluster.key)));
        const clustersByKey = new Map(clusters.map(cluster => [cluster.key, cluster]));

        return {
            ...build.inbox,
            clusters,
            items: build.inbox.items.map(item =>
                item.kind === CategorizeInboxListItemKindEnum.CLUSTER
                    ? { ...item, cluster: clustersByKey.get(item.key) ?? item.cluster }
                    : item
            )
        };
    }

    private buildClusters(
        rows: readonly CategorizeInboxRowInterface[],
        context: CategorizeInboxBuildContextInterface
    ): CategorizeInboxClusterInterface[] {
        const transferKinds = new Map(rows.map(row => [row, this.detectTransferKind(row)]));
        const clusters: CategorizeInboxClusterInterface[] = [];
        const transferRows: CategorizeInboxRowInterface[] = [];

        this.groupRows(rows, row => `${row.type}|${categorizeInboxMerchantKeyService.buildKeys(row.title).normalizedKey}`).forEach(
            (groupRows, key) => {
                const groupTransferRows = groupRows.filter(row => isDefined(transferKinds.get(row)));
                const posterior = isNotEmptyArray(groupTransferRows) ? this.resolvePosterior(key, groupRows, context) : null;

                if (!isDefined(posterior) || this.resolveConfidence(posterior, true, false) === CategorizeInboxConfidenceEnum.HIGH) {
                    clusters.push(this.buildCluster(key, groupRows, null, context));

                    return;
                }

                context.posteriors.delete(key);
                transferRows.push(...groupTransferRows);

                const categoryRows = groupRows.filter(row => !isDefined(transferKinds.get(row)));

                if (isNotEmptyArray(categoryRows)) {
                    clusters.push(this.buildCluster(key, categoryRows, null, context));
                }
            }
        );

        this.groupRows(transferRows, row => `${row.type}|TRANSFER|${transferKinds.get(row)}|${row.accountId}`).forEach((groupRows, key) => {
            clusters.push(this.buildCluster(key, groupRows, transferKinds.get(groupRows[0]) ?? null, context));
        });

        return clusters;
    }

    private buildCluster(
        key: string,
        rows: CategorizeInboxRowInterface[],
        transferKind: CategorizeInboxTransferKindEnum | null,
        context: CategorizeInboxBuildContextInterface
    ): CategorizeInboxClusterInterface {
        const isCategory = !isDefined(transferKind);
        const posterior = this.resolvePosterior(key, rows, context);
        const confidence = this.resolveConfidence(posterior, isCategory, false);
        const titles = rows.map(row => row.title);
        const displayTitle = this.mostFrequent(titles) ?? '';

        return {
            key,
            kind: isCategory ? CategorizeInboxClusterKindEnum.CATEGORY : CategorizeInboxClusterKindEnum.TRANSFER,
            type: rows[0].type,
            displayTitle,
            variantCount: new Set(titles).size,
            rows,
            rowCount: rows.length,
            totalBaseAmount: this.sumBaseAmount(rows, context.defaultInstrumentId),
            sourceAccountId: this.mostFrequent(rows.map(row => row.accountId)) ?? rows[0].accountId,
            candidates: this.buildCandidates(posterior, null),
            confidence,
            topProbability: CategorizeInboxEvidenceIndex.rankCategories(posterior.probabilities)[0]?.[1] ?? 0,
            transferKind,
            ruleConditionValue: this.buildRuleConditionValue(titles, displayTitle),
            section: this.resolveSection(confidence, isCategory, rows.length)
        };
    }

    private resolvePosterior(
        key: string,
        rows: readonly CategorizeInboxRowInterface[],
        context: CategorizeInboxBuildContextInterface
    ): CategorizeInboxPosteriorInterface {
        const cached = context.posteriors.get(key);

        if (isDefined(cached)) {
            return cached;
        }

        const posterior = context.index.computePosterior(rows);

        context.posteriors.set(key, posterior);

        return posterior;
    }

    private enrichCluster(
        cluster: CategorizeInboxClusterInterface,
        build: CategorizeInboxBuildInterface,
        enrichment?: CategorizeInboxEnrichmentInterface
    ): CategorizeInboxClusterInterface {
        const posterior = build.posteriors.get(cluster.key);

        if (!isDefined(enrichment) || !isDefined(posterior) || cluster.confidence === CategorizeInboxConfidenceEnum.HIGH) {
            return cluster;
        }

        const isCategory = cluster.kind === CategorizeInboxClusterKindEnum.CATEGORY;
        const enrichedPosterior = build.index.fusePosterior(posterior, enrichment.embeddingScores);

        return {
            ...cluster,
            candidates: this.buildCandidates(enrichedPosterior, enrichment.llmCategoryId),
            confidence: this.resolveConfidence(posterior, isCategory, isNotEmptyArray(enrichment.embeddingScores))
        };
    }

    private buildEnrichmentRequests(
        clusters: readonly CategorizeInboxClusterInterface[],
        currencySymbol: string,
        context: CategorizeInboxBuildContextInterface
    ): CategorizeInboxEnrichmentRequestInterface[] {
        const requestClusters = clusters
            .filter(
                cluster =>
                    cluster.kind === CategorizeInboxClusterKindEnum.CATEGORY && cluster.confidence !== CategorizeInboxConfidenceEnum.HIGH
            )
            .sort((left, right) => this.computeImpact(right) - this.computeImpact(left))
            .slice(0, CategorizeInboxEngineService.FUSION.enrichmentLimit);
        const rerankKeys = new Set(
            requestClusters
                .filter(
                    cluster =>
                        cluster.confidence !== CategorizeInboxConfidenceEnum.MEDIUM ||
                        cluster.topProbability < CategorizeInboxEngineService.FUSION.rerankProbability
                )
                .slice(0, CategorizeInboxEngineService.FUSION.rerankLimit)
                .map(cluster => cluster.key)
        );

        return requestClusters.map(cluster => ({
            clusterKey: cluster.key,
            title: cluster.displayTitle,
            comment: this.mostFrequent(cluster.rows.map(row => row.comment).filter(isNotEmptyString)) ?? '',
            mccDescription: this.mostFrequent(cluster.rows.map(row => row.mccDescription).filter(isDefined)),
            rowCount: cluster.rowCount,
            typicalAmountLabel: this.buildTypicalAmountLabel(cluster.rows, currencySymbol),
            candidateCategoryIds: context.index.selectRerankCandidates(this.resolvePosterior(cluster.key, cluster.rows, context)),
            needsRerank: rerankKeys.has(cluster.key)
        }));
    }

    private buildListItems(clusters: readonly CategorizeInboxClusterInterface[]): CategorizeInboxListItemType[] {
        const sectionCounts = new Map<CategorizeInboxSectionEnum, number>();

        clusters.forEach(cluster => sectionCounts.set(cluster.section, (sectionCounts.get(cluster.section) ?? 0) + 1));

        return clusters.flatMap((cluster, index): CategorizeInboxListItemType[] => {
            const clusterItem: CategorizeInboxListItemType = { kind: CategorizeInboxListItemKindEnum.CLUSTER, key: cluster.key, cluster };

            if (index > 0 && clusters[index - 1].section === cluster.section) {
                return [clusterItem];
            }

            return [
                {
                    kind: CategorizeInboxListItemKindEnum.SECTION_HEADER,
                    key: `section-${cluster.section}`,
                    section: cluster.section,
                    count: sectionCounts.get(cluster.section) ?? 0
                },
                clusterItem
            ];
        });
    }

    private resolveConfidence(
        posterior: CategorizeInboxPosteriorInterface,
        isCategory: boolean,
        hasEmbeddingScores: boolean
    ): CategorizeInboxConfidenceEnum {
        const { FUSION } = CategorizeInboxEngineService;
        const [top] = CategorizeInboxEvidenceIndex.rankCategories(posterior.probabilities);
        const hasEvidence = this.hasEvidence(posterior);

        if (!isDefined(top)) {
            return CategorizeInboxConfidenceEnum.NONE;
        }

        const [categoryId, probability] = top;

        if (
            isCategory &&
            probability >= FUSION.highProbability &&
            (posterior.normalizedCounts.get(categoryId) ?? 0) >= FUSION.highNormalizedCount
        ) {
            return CategorizeInboxConfidenceEnum.HIGH;
        }

        if (hasEvidence && probability >= FUSION.mediumProbability) {
            return CategorizeInboxConfidenceEnum.MEDIUM;
        }

        return hasEvidence || hasEmbeddingScores ? CategorizeInboxConfidenceEnum.LOW : CategorizeInboxConfidenceEnum.NONE;
    }

    private hasEvidence(posterior: CategorizeInboxPosteriorInterface): boolean {
        return [posterior.normalizedCounts, posterior.prefixCounts, posterior.mccCounts].some(counts =>
            [...counts.values()].some(isPositiveNumber)
        );
    }

    private buildCandidates(
        posterior: CategorizeInboxPosteriorInterface,
        llmCategoryId: number | null
    ): CategorizeInboxCandidateInterface[] {
        const { llmWeight } = CategorizeInboxEngineService.FUSION;
        const fused = new Map(
            [...posterior.probabilities].map(([categoryId, probability]) => [
                categoryId,
                isDefined(llmCategoryId) ? (1 - llmWeight) * probability + (categoryId === llmCategoryId ? llmWeight : 0) : probability
            ])
        );

        if (isDefined(llmCategoryId) && !fused.has(llmCategoryId)) {
            fused.set(llmCategoryId, llmWeight);
        }

        return CategorizeInboxEvidenceIndex.rankCategories(fused)
            .slice(0, CategorizeInboxEngineService.FUSION.chipCount)
            .map(([categoryId, probability]) => ({
                categoryId,
                probability,
                source: this.resolveSource(categoryId, posterior, llmCategoryId)
            }));
    }

    private resolveSource(
        categoryId: number,
        posterior: CategorizeInboxPosteriorInterface,
        llmCategoryId: number | null
    ): CategorizeInboxCandidateSourceEnum {
        if (
            [posterior.exactCounts, posterior.normalizedCounts, posterior.prefixCounts].some(counts =>
                isPositiveNumber(counts.get(categoryId))
            )
        ) {
            return CategorizeInboxCandidateSourceEnum.HISTORY;
        }

        if (isPositiveNumber(posterior.mccCounts.get(categoryId))) {
            return CategorizeInboxCandidateSourceEnum.MCC;
        }

        if (isPositiveNumber(posterior.embeddingShares.get(categoryId))) {
            return CategorizeInboxCandidateSourceEnum.SIMILAR;
        }

        return categoryId === llmCategoryId ? CategorizeInboxCandidateSourceEnum.AI : CategorizeInboxCandidateSourceEnum.POPULAR;
    }

    private detectTransferKind(row: CategorizeInboxRowInterface): CategorizeInboxTransferKindEnum | null {
        const title = row.title.normalize('NFC').toLowerCase();
        const mccCode = row.mccCode ?? '';

        if (CategorizeInboxEngineService.ATM_MCC_CODES.has(mccCode) || CategorizeInboxEngineService.ATM_PATTERN.test(title)) {
            return CategorizeInboxTransferKindEnum.ATM_WITHDRAWAL;
        }

        if (
            CategorizeInboxEngineService.CARD_TRANSFER_MCC_CODES.has(mccCode) ||
            CategorizeInboxEngineService.MASKED_PAN_PATTERN.test(row.title) ||
            CategorizeInboxEngineService.CARD_TRANSFER_PATTERN.test(title)
        ) {
            return CategorizeInboxTransferKindEnum.CARD_TRANSFER;
        }

        return null;
    }

    private buildRuleConditionValue(titles: readonly string[], displayTitle: string): string {
        const loweredDisplayTitle = displayTitle.toLowerCase();
        const loweredTitles = [...new Set(titles.map(title => title.toLowerCase()))];
        const words = [...loweredDisplayTitle.matchAll(CategorizeInboxEngineService.RULE_WORD_PATTERN)];
        const sequences = words.flatMap((_, shortening) =>
            words
                .slice(words.length - 1 - shortening)
                .map((lastWord, start) => loweredDisplayTitle.slice(words[start].index, lastWord.index + lastWord[0].length))
        );

        return (
            sequences.find(
                sequence =>
                    sequence.length >= CategorizeInboxEngineService.FUSION.ruleValueMinLength &&
                    loweredTitles.every(title => title.includes(sequence))
            ) ?? displayTitle
        );
    }

    private resolveSection(confidence: CategorizeInboxConfidenceEnum, isCategory: boolean, rowCount: number): CategorizeInboxSectionEnum {
        if (confidence === CategorizeInboxConfidenceEnum.HIGH) {
            return CategorizeInboxSectionEnum.CONFIDENT;
        }

        if (!isCategory) {
            return CategorizeInboxSectionEnum.TRANSFERS;
        }

        return rowCount > 1 ? CategorizeInboxSectionEnum.REVIEW : CategorizeInboxSectionEnum.ONE_OFFS;
    }

    private compareClusters(left: CategorizeInboxClusterInterface, right: CategorizeInboxClusterInterface): number {
        return (
            CategorizeInboxEngineService.SECTION_ORDER.indexOf(left.section) -
                CategorizeInboxEngineService.SECTION_ORDER.indexOf(right.section) ||
            this.computeSortScore(right) - this.computeSortScore(left) ||
            left.key.localeCompare(right.key)
        );
    }

    private computeSortScore(cluster: CategorizeInboxClusterInterface): number {
        switch (cluster.section) {
            case CategorizeInboxSectionEnum.REVIEW:
                return this.computeImpact(cluster);
            case CategorizeInboxSectionEnum.ONE_OFFS:
                return Math.abs(convertFromMicroUnits(cluster.totalBaseAmount ?? cluster.rows[0].amount));
            default:
                return cluster.rowCount;
        }
    }

    private computeImpact(cluster: CategorizeInboxClusterInterface): number {
        const { FUSION } = CategorizeInboxEngineService;

        return (
            cluster.rowCount *
            Math.log10(FUSION.impactAmountOffset + Math.abs(convertFromMicroUnits(cluster.totalBaseAmount ?? 0))) *
            (1 - FUSION.impactConfidenceDiscount * cluster.topProbability)
        );
    }

    private buildTypicalAmountLabel(rows: readonly CategorizeInboxRowInterface[], currencySymbol: string): string {
        const baseAmounts = rows
            .map(row => row.baseAmount)
            .filter(isDefined)
            .map(amount => Math.abs(amount))
            .sort((left, right) => left - right);

        if (isNotEmptyArray(baseAmounts)) {
            return `${convertFromMicroUnits(baseAmounts[Math.floor(baseAmounts.length / 2)]).toFixed(2)} ${currencySymbol}`;
        }

        return `${convertFromMicroUnits(Math.abs(rows[0].amount)).toFixed(2)} ${rows[0].instrumentSymbol}`;
    }

    private sumBaseAmount(rows: readonly CategorizeInboxRowInterface[], defaultInstrumentId: number): number | null {
        const baseAmounts = rows
            .filter(row => row.baseInstrumentId === defaultInstrumentId)
            .map(row => row.baseAmount)
            .filter(isDefined);

        return isNotEmptyArray(baseAmounts) ? this.sumValues(baseAmounts) : null;
    }

    private groupRows(
        rows: readonly CategorizeInboxRowInterface[],
        keyOf: (row: CategorizeInboxRowInterface) => string
    ): Map<string, CategorizeInboxRowInterface[]> {
        const groups = new Map<string, CategorizeInboxRowInterface[]>();

        rows.forEach(row => {
            const key = keyOf(row);
            const group = groups.get(key);

            if (isDefined(group)) {
                group.push(row);
            } else {
                groups.set(key, [row]);
            }
        });

        return groups;
    }

    private mostFrequent<T>(values: readonly T[]): T | null {
        const counts = new Map<T, number>();

        values.forEach(value => counts.set(value, (counts.get(value) ?? 0) + 1));

        return (
            [...counts].reduce<[T, number] | null>((best, entry) => (!isDefined(best) || entry[1] > best[1] ? entry : best), null)?.[0] ??
            null
        );
    }

    private sumValues(values: Iterable<number>): number {
        return [...values].reduce((total, value) => total + value, 0);
    }

    private static buildKeywordPattern(keywords: Record<LanguageEnum, readonly string[]>): RegExp {
        return new RegExp(`(?<!\\p{L})(?:${Object.values(keywords).flat().join('|')})(?!\\p{L})`, 'u');
    }
}

export const categorizeInboxEngineService = new CategorizeInboxEngineService();
