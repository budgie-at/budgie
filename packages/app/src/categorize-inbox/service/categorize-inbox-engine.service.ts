import { LanguageEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { CategorizeInboxListItemKindEnum } from '../enum/categorize-inbox-list-item-kind.enum';
import { CategorizeInboxSectionEnum } from '../enum/categorize-inbox-section.enum';

import type { CategorizeInboxBuildContextInterface } from '../interface/categorize-inbox-build-context.interface';
import type { CategorizeInboxClusterInterface } from '../interface/categorize-inbox-cluster.interface';
import type { CategorizeInboxScoreInterface } from '../interface/categorize-inbox-score.interface';
import type { CategorizeInboxSessionInterface } from '../interface/categorize-inbox-session.interface';
import type { CategorizeInboxViewInterface } from '../interface/categorize-inbox-view.interface';
import type { CategorizeInboxListItemType } from '../type/categorize-inbox-list-item.type';
import type { LabelEvidenceRowInterface, CategorizeInboxRowInterface } from '@budgie/contracts';

class CategorizeInboxEngineService {
    private static readonly LIMITS = { chipCount: 2, confidentShare: 0.85, confidentCount: 2, merchantTokenCount: 3 } as const;
    private static readonly LEGAL_FORM_TOKENS: Record<LanguageEnum, readonly string[]> = {
        [LanguageEnum.EN]: ['ltd', 'llc', 'inc', 'co', 'bv'],
        [LanguageEnum.UK]: ['тов', 'фоп', 'пп', 'ооо'],
        [LanguageEnum.DE]: ['gmbh', 'ges', 'ag', 'kg', 'og'],
        [LanguageEnum.FR]: ['sa'],
        [LanguageEnum.ES]: ['sa', 'srl']
    };

    private static readonly PAYMENT_TYPE_PREFIX_KEYWORDS: Record<LanguageEnum, readonly string[]> = {
        [LanguageEnum.EN]: ['card\\s+payment', 'pos\\s+purchase', 'pos'],
        [LanguageEnum.UK]: ['оплата', 'покупка', 'платіж'],
        [LanguageEnum.DE]: ['kartenzahlung', 'lastschrifteinzug', 'lastschrift', 'überweisung', 'gutschrift'],
        [LanguageEnum.FR]: ['paiement\\s+carte', 'prélèvement', 'virement'],
        [LanguageEnum.ES]: ['pago\\s+con\\s+tarjeta', 'transferencia', 'compra']
    };

    private static readonly LEGAL_FORMS = new Set(Object.values(CategorizeInboxEngineService.LEGAL_FORM_TOKENS).flat());
    private static readonly PAYMENT_TYPE_PREFIX_PATTERN = CategorizeInboxEngineService.buildPrefixPattern(
        CategorizeInboxEngineService.PAYMENT_TYPE_PREFIX_KEYWORDS
    );

    private static readonly MASKED_PAN_PATTERN = /\d{4,6}\*+\d{2,4}/u;
    private static readonly NOISE_PATTERN = /(?<![\p{L}\p{N}])\p{L}{2,8}:\S+|https?:\/\/\S+|\bwww\.|\d{4,6}\*+\d{2,4}|\+?\d[\d\s-]{6,}\d/gu;
    private static readonly REFERENCE_NOISE_PATTERN = new RegExp(
        `(?<![\\p{L}\\p{N}])\\p{L}{2,8}:\\S+|${CategorizeInboxEngineService.MASKED_PAN_PATTERN.source}|\\+?\\d[\\d\\s-]{6,}\\d|\\b\\d{1,2}[./]\\d{1,2}(?:[./]\\d{2,4})?\\b|\\b\\d{1,2}:\\d{2}\\b`,
        'u'
    );

    private static readonly TRAILING_LEGAL_FORM_PATTERN = new RegExp(
        `[\\s.,-]*(?<!\\p{L})(?:ges\\.?\\s*m\\.?\\s*b\\.?\\s*h\\.?|(?:${[...CategorizeInboxEngineService.LEGAL_FORMS].join('|')})\\.?)\\s*$`,
        'iu'
    );

    private static readonly EDGE_PUNCTUATION_PATTERN = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;
    private static readonly DIACRITIC_PATTERN = /\p{Diacritic}/gu;
    private static readonly TOKEN_SEPARATOR_PATTERN = /[^\p{L}]+/u;
    private static readonly RULE_WORD_PATTERN = /\p{L}{2,}/gu;
    private static readonly SECTION_ORDER = Object.values(CategorizeInboxSectionEnum);

    @Log(
        (evidence, defaultInstrumentId) => `enter evidenceCount=${evidence.length} defaultInstrumentId=${defaultInstrumentId}`,
        (result, evidence, defaultInstrumentId) =>
            `done evidenceCount=${evidence.length} defaultInstrumentId=${defaultInstrumentId} merchantKeyCount=${result.merchant.size}`,
        (error, evidence, defaultInstrumentId) =>
            `throw evidenceCount=${evidence.length} defaultInstrumentId=${defaultInstrumentId} error=${getErrorMessage(error)}`
    )
    buildContext(evidence: LabelEvidenceRowInterface[], defaultInstrumentId: number): CategorizeInboxBuildContextInterface {
        const titledEvidence = evidence.filter(row => isNotEmptyString(row.title.trim()));
        const brandEvidence = titledEvidence.filter(row => isDefined(this.brandKey(row.title)));
        const mccEvidence = evidence.filter(row => isDefined(row.mccCategoryId));

        return {
            exact: this.groupBy(titledEvidence, row => `${row.type}|${row.title.toLowerCase()}`),
            merchant: this.groupBy(titledEvidence, row => `${row.type}|${this.merchantKey(row.title)}`),
            brand: this.groupBy(brandEvidence, row => `${row.type}|${this.brandKey(row.title)}`),
            mcc: this.groupBy(mccEvidence, row => `${row.type}|${row.mccCategoryId}`),
            defaultInstrumentId
        };
    }

    @Log(
        (rows, context) => `enter rowCount=${rows.length} defaultInstrumentId=${context.defaultInstrumentId}`,
        (result, rows, context) =>
            `done rowCount=${rows.length} defaultInstrumentId=${context.defaultInstrumentId} clusterCount=${result.length}`,
        (error, rows, context) =>
            `throw rowCount=${rows.length} defaultInstrumentId=${context.defaultInstrumentId} error=${getErrorMessage(error)}`
    )
    buildClusters(rows: CategorizeInboxRowInterface[], context: CategorizeInboxBuildContextInterface): CategorizeInboxClusterInterface[] {
        const uniqueRows = [...new Map(rows.map(row => [row.transactionId, row])).values()];
        const merchantGroups = this.groupBy(uniqueRows, row => `${row.type}|${this.merchantKey(row.title)}`);

        return [...merchantGroups]
            .map(([key, groupRows]) => this.buildCluster(key, groupRows, context))
            .sort((left, right) => this.compareClusters(left, right));
    }

    @Log(
        (clusters, session, hiddenTransactionIds, defaultInstrumentId) =>
            `enter clusterCount=${clusters.length} placementCount=${session.placements.size} hiddenCount=${hiddenTransactionIds.size} defaultInstrumentId=${defaultInstrumentId}`,
        (result, ...[clusters, session, hiddenTransactionIds, defaultInstrumentId]) =>
            `done clusterCount=${clusters.length} placementCount=${session.placements.size} hiddenCount=${hiddenTransactionIds.size} defaultInstrumentId=${defaultInstrumentId} itemCount=${result.items.length} remainingCount=${result.remainingCount}`,
        (error, ...[clusters, session, hiddenTransactionIds, defaultInstrumentId]) =>
            `throw clusterCount=${clusters.length} placementCount=${session.placements.size} hiddenCount=${hiddenTransactionIds.size} defaultInstrumentId=${defaultInstrumentId} error=${getErrorMessage(error)}`
    )
    placeClusters(
        clusters: readonly CategorizeInboxClusterInterface[],
        session: CategorizeInboxSessionInterface,
        hiddenTransactionIds: ReadonlySet<number>,
        defaultInstrumentId: number
    ): CategorizeInboxViewInterface {
        const { placements, clustersByKey } = session;
        const placementOrder = new Map([...placements.keys()].map((key, index) => [key, index]));
        const placedClusters = clusters
            .map(cluster => this.hideRows(cluster, hiddenTransactionIds, defaultInstrumentId))
            .filter(isDefined)
            .map(cluster => this.reusePrevious(this.pinSection(cluster, placements), clustersByKey.get(cluster.key)))
            .map((cluster, index) => ({ cluster, order: placementOrder.get(cluster.key) ?? placements.size + index }))
            .sort((left, right) => left.order - right.order)
            .map(({ cluster }) => cluster);
        const isUnchanged =
            placedClusters.length === clustersByKey.size && placedClusters.every(cluster => clustersByKey.get(cluster.key) === cluster);

        return {
            items: this.buildListItems(placedClusters),
            clustersByKey: isUnchanged ? clustersByKey : new Map(placedClusters.map(cluster => [cluster.key, cluster])),
            remainingCount: this.sumValues(placedClusters.map(cluster => cluster.rows.length))
        };
    }

    suggestLabelIds(rows: CategorizeInboxRowInterface[], context: CategorizeInboxBuildContextInterface): number[] {
        return isNotEmptyArray(rows) ? this.scoreRows(rows, context).candidates.map(candidate => candidate.labelId) : [];
    }

    startSession(clusters: readonly CategorizeInboxClusterInterface[]): CategorizeInboxSessionInterface {
        return { placements: new Map(clusters.map(cluster => [cluster.key, cluster.section])), clustersByKey: new Map() };
    }

    private buildCluster(
        key: string,
        rows: CategorizeInboxRowInterface[],
        context: CategorizeInboxBuildContextInterface
    ): CategorizeInboxClusterInterface {
        const { candidates, isConfident, hasEvidence } = this.scoreRows(rows, context);
        const titles = rows.map(row => row.title);
        const mostFrequentTitle = this.mostFrequent(titles);
        const ruleConditionValue = this.buildRuleConditionValue(titles, mostFrequentTitle);
        const variantCount = new Set(titles).size;

        return {
            key,
            displayTitle: this.resolveDisplayTitle(variantCount, ruleConditionValue, mostFrequentTitle),
            variantCount,
            rows,
            totalBaseAmount: this.sumBaseAmounts(rows, context.defaultInstrumentId),
            candidates,
            isConfident,
            hasEvidence,
            ruleConditionValue,
            section: this.resolveSection(isConfident, rows.length)
        };
    }

    private sumBaseAmounts(rows: readonly CategorizeInboxRowInterface[], defaultInstrumentId: number): number | null {
        const baseAmounts = rows.map(row => (row.baseInstrumentId === defaultInstrumentId ? row.baseAmount : null)).filter(isDefined);

        return isNotEmptyArray(baseAmounts) ? this.sumValues(baseAmounts) : null;
    }

    private hideRows(
        cluster: CategorizeInboxClusterInterface,
        hiddenTransactionIds: ReadonlySet<number>,
        defaultInstrumentId: number
    ): CategorizeInboxClusterInterface | null {
        const rows = cluster.rows.filter(row => !hiddenTransactionIds.has(row.transactionId));

        if (rows.length === cluster.rows.length) {
            return cluster;
        }

        return isNotEmptyArray(rows) ? { ...cluster, rows, totalBaseAmount: this.sumBaseAmounts(rows, defaultInstrumentId) } : null;
    }

    private compareClusters(left: CategorizeInboxClusterInterface, right: CategorizeInboxClusterInterface): number {
        const { SECTION_ORDER } = CategorizeInboxEngineService;

        return (
            SECTION_ORDER.indexOf(left.section) - SECTION_ORDER.indexOf(right.section) ||
            this.computeSortScore(right) - this.computeSortScore(left) ||
            left.key.localeCompare(right.key)
        );
    }

    private pinSection(
        cluster: CategorizeInboxClusterInterface,
        placements: ReadonlyMap<string, CategorizeInboxSectionEnum>
    ): CategorizeInboxClusterInterface {
        const section = placements.get(cluster.key) ?? this.resolveSection(false, cluster.rows.length);

        return { ...cluster, section, isConfident: section === CategorizeInboxSectionEnum.CONFIDENT };
    }

    private reusePrevious(
        cluster: CategorizeInboxClusterInterface,
        previous: CategorizeInboxClusterInterface | undefined
    ): CategorizeInboxClusterInterface {
        return isDefined(previous) && this.isSameCluster(previous, cluster) ? previous : cluster;
    }

    private isSameCluster(previous: CategorizeInboxClusterInterface, next: CategorizeInboxClusterInterface): boolean {
        return (
            previous.section === next.section &&
            previous.hasEvidence === next.hasEvidence &&
            previous.displayTitle === next.displayTitle &&
            previous.ruleConditionValue === next.ruleConditionValue &&
            previous.totalBaseAmount === next.totalBaseAmount &&
            previous.candidates.map(candidate => candidate.labelId).join() === next.candidates.map(candidate => candidate.labelId).join() &&
            previous.rows.length === next.rows.length &&
            previous.rows.every((row, index) => this.isSameRow(row, next.rows[index]))
        );
    }

    private isSameRow(previous: CategorizeInboxRowInterface, next: CategorizeInboxRowInterface): boolean {
        return (
            previous.transactionId === next.transactionId &&
            previous.title === next.title &&
            previous.amount === next.amount &&
            previous.instrumentSymbol === next.instrumentSymbol &&
            previous.operatedAt.getTime() === next.operatedAt.getTime()
        );
    }

    private resolveDisplayTitle(variantCount: number, ruleConditionValue: string, mostFrequentTitle: string): string {
        if (variantCount === 1) {
            return this.cleanDisplayTitle(mostFrequentTitle);
        }

        const commonSubstring = ruleConditionValue.replace(CategorizeInboxEngineService.EDGE_PUNCTUATION_PATTERN, '');
        const originalCasedSubstring = this.resolveOriginalCasing(commonSubstring, mostFrequentTitle);
        const candidate = originalCasedSubstring.length >= 3 ? originalCasedSubstring : mostFrequentTitle;

        return this.cleanDisplayTitle(candidate);
    }

    private cleanDisplayTitle(title: string): string {
        const { PAYMENT_TYPE_PREFIX_PATTERN, REFERENCE_NOISE_PATTERN, TRAILING_LEGAL_FORM_PATTERN } = CategorizeInboxEngineService;
        const withoutPrefix = title.replace(PAYMENT_TYPE_PREFIX_PATTERN, '').trimStart();
        const noiseMatch = REFERENCE_NOISE_PATTERN.exec(withoutPrefix);
        const cutTitle = isDefined(noiseMatch) ? withoutPrefix.slice(0, noiseMatch.index) : withoutPrefix;
        const cleaned = cutTitle.replace(TRAILING_LEGAL_FORM_PATTERN, '').trim();

        return cleaned.length >= 3 ? cleaned : title.trim();
    }

    private resolveOriginalCasing(substring: string, sourceTitle: string): string {
        const matchIndex = sourceTitle.toLowerCase().indexOf(substring.toLowerCase());

        return matchIndex === -1 ? substring : sourceTitle.slice(matchIndex, matchIndex + substring.length);
    }

    private scoreRows(rows: CategorizeInboxRowInterface[], context: CategorizeInboxBuildContextInterface): CategorizeInboxScoreInterface {
        const { LIMITS } = CategorizeInboxEngineService;
        const [{ type }] = rows;
        const exactCounts = this.countLabels(context.exact, new Set(rows.map(row => `${type}|${row.title.toLowerCase()}`)));
        const merchantCounts = this.countLabels(context.merchant, new Set(rows.map(row => `${type}|${this.merchantKey(row.title)}`)));
        const brandKeys = new Set(rows.map(row => `${type}|${this.brandKey(row.title) ?? ''}`).filter(key => !key.endsWith('|')));
        const brandCounts = this.countLabels(context.brand, brandKeys);
        const historyCounts = [exactCounts, merchantCounts].find(counts => isPositiveNumber(counts.size));
        const counts =
            historyCounts ??
            (isPositiveNumber(brandCounts.size)
                ? brandCounts
                : this.countLabels(
                      context.mcc,
                      rows.map(row => `${type}|${row.mccCategoryId}`)
                  ));
        const total = this.sumValues(counts.values());
        const topCount = Math.max(0, ...counts.values());
        const candidates = isPositiveNumber(counts.size)
            ? this.rankLabelIds(counts)
                  .slice(0, LIMITS.chipCount)
                  .map(labelId => ({ labelId, probability: (counts.get(labelId) ?? 0) / (total + 1) }))
            : [];

        return {
            candidates,
            isConfident: isDefined(historyCounts) && topCount >= LIMITS.confidentCount && topCount / total >= LIMITS.confidentShare,
            hasEvidence: isPositiveNumber(counts.size)
        };
    }

    private countLabels(level: ReadonlyMap<string, LabelEvidenceRowInterface[]>, keys: Iterable<string>): Map<number, number> {
        const counts = new Map<number, number>();

        [...keys].flatMap(key => level.get(key) ?? []).forEach(row => counts.set(row.labelId, (counts.get(row.labelId) ?? 0) + row.count));

        return counts;
    }

    private merchantKey(title: string): string {
        const { LIMITS, NOISE_PATTERN, DIACRITIC_PATTERN, TOKEN_SEPARATOR_PATTERN, LEGAL_FORMS, PAYMENT_TYPE_PREFIX_PATTERN } =
            CategorizeInboxEngineService;
        const withoutPrefix = title.toLowerCase().replace(PAYMENT_TYPE_PREFIX_PATTERN, ' ');
        const cleaned = withoutPrefix.normalize('NFKD').replace(DIACRITIC_PATTERN, '').replace(NOISE_PATTERN, ' ');
        const tokens = cleaned.split(TOKEN_SEPARATOR_PATTERN).filter(token => token.length >= 2 && !LEGAL_FORMS.has(token));
        const key = [...new Set(tokens)].slice(0, LIMITS.merchantTokenCount).join(' ');

        return isNotEmptyString(key) ? key : title.trim().toLowerCase();
    }

    private brandKey(title: string): string | null {
        const [firstToken] = this.merchantKey(title).split(' ');

        return firstToken.length >= 3 ? firstToken : null;
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

        return sequences.find(sequence => sequence.length >= 3 && loweredTitles.every(title => title.includes(sequence))) ?? displayTitle;
    }

    private resolveSection(isConfident: boolean, rowCount: number): CategorizeInboxSectionEnum {
        if (isConfident) {
            return CategorizeInboxSectionEnum.CONFIDENT;
        }

        return rowCount > 1 ? CategorizeInboxSectionEnum.REVIEW : CategorizeInboxSectionEnum.ONE_OFFS;
    }

    private buildListItems(clusters: readonly CategorizeInboxClusterInterface[]): CategorizeInboxListItemType[] {
        return CategorizeInboxEngineService.SECTION_ORDER.flatMap((section): CategorizeInboxListItemType[] => {
            const sectionClusters = clusters.filter(cluster => cluster.section === section);
            const clusterKind =
                section === CategorizeInboxSectionEnum.ONE_OFFS
                    ? CategorizeInboxListItemKindEnum.ONE_OFF
                    : CategorizeInboxListItemKindEnum.CLUSTER;
            const baseAmounts = sectionClusters.map(cluster => cluster.totalBaseAmount).filter(isDefined);
            const header: CategorizeInboxListItemType = {
                kind: CategorizeInboxListItemKindEnum.SECTION_HEADER,
                key: `section-${section}`,
                section,
                count: this.sumValues(sectionClusters.map(cluster => cluster.rows.length)),
                totalBaseAmount: isNotEmptyArray(baseAmounts) ? this.sumValues(baseAmounts) : null
            };

            return isNotEmptyArray(sectionClusters)
                ? [
                      header,
                      ...sectionClusters.map((cluster): CategorizeInboxListItemType => ({ kind: clusterKind, key: cluster.key, cluster }))
                  ]
                : [];
        });
    }

    private computeSortScore(cluster: CategorizeInboxClusterInterface): number {
        const absoluteAmount = Math.abs(convertFromMicroUnits(cluster.totalBaseAmount ?? cluster.rows[0].amount));

        switch (cluster.section) {
            case CategorizeInboxSectionEnum.REVIEW:
                return cluster.rows.length * Math.log10(10 + absoluteAmount);
            case CategorizeInboxSectionEnum.ONE_OFFS:
                return absoluteAmount;
            default:
                return cluster.rows.length;
        }
    }

    private groupBy<T>(items: readonly T[], keyOf: (item: T) => string): Map<string, T[]> {
        const groups = new Map<string, T[]>();

        items.forEach(item => {
            const key = keyOf(item);
            const group = groups.get(key) ?? [];

            groups.set(key, group);
            group.push(item);
        });

        return groups;
    }

    private rankLabelIds(counts: ReadonlyMap<number, number>): number[] {
        return [...counts].sort(([leftId, left], [rightId, right]) => right - left || leftId - rightId).map(([labelId]) => labelId);
    }

    private mostFrequent(values: readonly string[]): string {
        const counts = new Map<string, number>();

        values.forEach(value => counts.set(value, (counts.get(value) ?? 0) + 1));

        return [...counts].reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0];
    }

    private sumValues(values: Iterable<number>): number {
        return [...values].reduce((total, value) => total + value, 0);
    }

    private static buildPrefixPattern(keywords: Record<LanguageEnum, readonly string[]>): RegExp {
        return new RegExp(`^(?:${Object.values(keywords).flat().join('|')})(?!\\p{L})`, 'iu');
    }
}

export const categorizeInboxEngineService = new CategorizeInboxEngineService();
