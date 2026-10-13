import { ATM_CASH_WITHDRAWAL_MCC, LanguageEnum, PRECISION, REFUND_TITLE_PREFIXES, TransactionTypeEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { CategorizeInboxLabelKindEnum } from '../enum/categorize-inbox-label-kind.enum';
import { CategorizeInboxSectionEnum } from '../enum/categorize-inbox-section.enum';

import type { CategorizeInboxBuildContextInterface } from '../interface/categorize-inbox-build-context.interface';
import type { CategorizeInboxClusterInterface } from '../interface/categorize-inbox-cluster.interface';
import type { CategorizeInboxRowInterface } from '../interface/categorize-inbox-row.interface';
import type { CategorizeInboxScoreInterface } from '../interface/categorize-inbox-score.interface';
import type { CategorizeInboxSessionInterface } from '../interface/categorize-inbox-session.interface';
import type { CategorizeInboxViewInterface } from '../interface/categorize-inbox-view.interface';
import type { LabelEvidenceRowInterface } from '../interface/label-evidence-row.interface';
import type { CategorizeInboxListItemType } from '../type/categorize-inbox-list-item.type';

class CategorizeInboxEngineService {
    private static readonly LIMITS = {
        chipCount: 2,
        confidentShare: 0.85,
        confidentCount: 2,
        merchantTokenCount: 3,
        maxConfidentRowCount: 50
    } as const;

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

    private static readonly REFUND_PREFIXES = REFUND_TITLE_PREFIXES.review.map(prefix => prefix.toUpperCase());

    private static readonly LEGAL_FORMS = new Set(Object.values(CategorizeInboxEngineService.LEGAL_FORM_TOKENS).flat());
    private static readonly PAYMENT_TYPE_PREFIX_PATTERN = new RegExp(
        `^(?:${Object.values(CategorizeInboxEngineService.PAYMENT_TYPE_PREFIX_KEYWORDS).flat().join('|')})(?!\\p{L})`,
        'iu'
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

    buildContext(
        evidence: LabelEvidenceRowInterface[],
        defaultInstrumentId: number,
        labelKind: CategorizeInboxLabelKindEnum
    ): CategorizeInboxBuildContextInterface {
        const titledEvidence = evidence.filter(row => isNotEmptyString(row.title.trim()));
        const brandEvidence = titledEvidence.filter(row => isDefined(this.brandKey(row.title)));
        const mccEvidence = evidence.filter(row => isDefined(row.mccCategoryId));

        return {
            exact: this.groupBy(titledEvidence, row => `${row.type}|${row.title.toLowerCase()}`),
            merchant: this.groupBy(titledEvidence, row => `${row.type}|${this.merchantKey(row.title)}`),
            brand: this.groupBy(brandEvidence, row => `${row.type}|${this.brandKey(row.title)}`),
            mcc: this.groupBy(mccEvidence, row => `${row.type}|${row.mccCategoryId}`),
            defaultInstrumentId,
            labelKind
        };
    }

    buildClusters(rows: CategorizeInboxRowInterface[], context: CategorizeInboxBuildContextInterface): CategorizeInboxClusterInterface[] {
        const uniqueRows = [...new Map(rows.map(row => [row.transactionId, row])).values()];
        const clusterGroups = this.groupBy(uniqueRows, row =>
            this.isCashWithdrawal(row) ? CategorizeInboxSectionEnum.CASH_WITHDRAWALS : `${row.type}|${this.merchantKey(row.title)}`
        );

        return [...clusterGroups]
            .map(([key, groupRows]) => this.buildCluster(key, groupRows, context))
            .sort((left, right) => this.compareClusters(left, right));
    }

    placeClusters(
        clusters: readonly CategorizeInboxClusterInterface[],
        session: CategorizeInboxSessionInterface,
        hiddenTransactionIds: ReadonlySet<number>,
        defaultInstrumentId: number
    ): CategorizeInboxViewInterface {
        const { clustersByKey } = session;
        const visibleClusters = clusters
            .map(cluster => this.hideRows(cluster, hiddenTransactionIds, defaultInstrumentId))
            .filter(isDefined);
        const placements = this.placeNewClusters(visibleClusters, session.placements);
        const placementOrder = new Map([...placements.keys()].map((key, index) => [key, index]));
        const placedClusters = visibleClusters
            .map(cluster => this.reusePrevious({ ...cluster, section: placements.get(cluster.key) ?? cluster.section }, clustersByKey))
            .sort((left, right) => (placementOrder.get(left.key) ?? 0) - (placementOrder.get(right.key) ?? 0));
        const isUnchanged =
            placedClusters.length === clustersByKey.size && placedClusters.every(cluster => clustersByKey.get(cluster.key) === cluster);

        return {
            items: this.buildListItems(placedClusters),
            placements,
            clustersByKey: isUnchanged ? clustersByKey : new Map(placedClusters.map(cluster => [cluster.key, cluster])),
            remainingCount: this.sumValues(placedClusters.map(cluster => cluster.rows.length))
        };
    }

    suggestLabelIds(rows: CategorizeInboxRowInterface[], context: CategorizeInboxBuildContextInterface): number[] {
        return isNotEmptyArray(rows) ? this.scoreRows(rows, context).candidateLabelIds : [];
    }

    private buildCluster(
        key: string,
        rows: CategorizeInboxRowInterface[],
        context: CategorizeInboxBuildContextInterface
    ): CategorizeInboxClusterInterface {
        const { candidateLabelIds, isConfident } = this.scoreRows(rows, context);
        const titles = rows.map(row => row.title);
        const mostFrequentTitle = this.mostFrequent(titles);
        const ruleConditionValue = this.buildRuleConditionValue(titles, mostFrequentTitle);

        return {
            key,
            displayTitle: this.resolveDisplayTitle(new Set(titles).size, ruleConditionValue, mostFrequentTitle),
            rows,
            totalBaseAmount: this.sumBaseAmounts(rows, context.defaultInstrumentId),
            candidateLabelIds,
            ruleConditionValue,
            section: this.resolveSection(isConfident, rows)
        };
    }

    private isCashWithdrawal(row: Pick<CategorizeInboxRowInterface, 'type' | 'mcc'>): boolean {
        return row.type === TransactionTypeEnum.EXPENSE && row.mcc === ATM_CASH_WITHDRAWAL_MCC;
    }

    private isRefund(row: Pick<CategorizeInboxRowInterface, 'type' | 'title'>): boolean {
        const normalizedTitle = row.title.trim().toUpperCase();

        return (
            row.type === TransactionTypeEnum.INCOME &&
            CategorizeInboxEngineService.REFUND_PREFIXES.some(prefix => normalizedTitle.startsWith(prefix))
        );
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

    private placeNewClusters(
        clusters: readonly CategorizeInboxClusterInterface[],
        placements: ReadonlyMap<string, CategorizeInboxSectionEnum>
    ): ReadonlyMap<string, CategorizeInboxSectionEnum> {
        const newClusters = clusters.filter(cluster => !placements.has(cluster.key));

        return isNotEmptyArray(newClusters)
            ? new Map([
                  ...placements,
                  ...newClusters.map((cluster): [string, CategorizeInboxSectionEnum] => [cluster.key, cluster.section])
              ])
            : placements;
    }

    private reusePrevious(
        cluster: CategorizeInboxClusterInterface,
        clustersByKey: ReadonlyMap<string, CategorizeInboxClusterInterface>
    ): CategorizeInboxClusterInterface {
        const previous = clustersByKey.get(cluster.key);

        return isDefined(previous) && this.isSameCluster(previous, cluster) ? previous : cluster;
    }

    private isSameCluster(previous: CategorizeInboxClusterInterface, next: CategorizeInboxClusterInterface): boolean {
        return (
            previous.section === next.section &&
            previous.displayTitle === next.displayTitle &&
            previous.ruleConditionValue === next.ruleConditionValue &&
            previous.totalBaseAmount === next.totalBaseAmount &&
            previous.candidateLabelIds.join() === next.candidateLabelIds.join() &&
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

        if (context.labelKind === CategorizeInboxLabelKindEnum.TAG && rows.some(row => this.isRefund(row))) {
            return { candidateLabelIds: [], isConfident: false };
        }

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

        return {
            candidateLabelIds: this.rankLabelIds(counts).slice(0, LIMITS.chipCount),
            isConfident:
                rows.length <= LIMITS.maxConfidentRowCount &&
                isDefined(historyCounts) &&
                topCount >= LIMITS.confidentCount &&
                topCount / total >= LIMITS.confidentShare
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

    private resolveSection(isConfident: boolean, rows: readonly CategorizeInboxRowInterface[]): CategorizeInboxSectionEnum {
        if (this.isCashWithdrawal(rows[0])) {
            return CategorizeInboxSectionEnum.CASH_WITHDRAWALS;
        }

        if (isConfident) {
            return CategorizeInboxSectionEnum.CONFIDENT;
        }

        return rows.length > 1 ? CategorizeInboxSectionEnum.REVIEW : CategorizeInboxSectionEnum.ONE_OFFS;
    }

    private buildListItems(clusters: readonly CategorizeInboxClusterInterface[]): CategorizeInboxListItemType[] {
        return CategorizeInboxEngineService.SECTION_ORDER.flatMap((section): CategorizeInboxListItemType[] => {
            const sectionClusters = clusters.filter(cluster => cluster.section === section);
            const baseAmounts = sectionClusters.map(cluster => cluster.totalBaseAmount).filter(isDefined);
            const header = {
                key: `section-${section}`,
                section,
                count: this.sumValues(sectionClusters.map(cluster => cluster.rows.length)),
                totalBaseAmount: isNotEmptyArray(baseAmounts) ? this.sumValues(baseAmounts) : null
            };

            return isNotEmptyArray(sectionClusters) ? [header, ...sectionClusters] : [];
        });
    }

    private computeSortScore(cluster: CategorizeInboxClusterInterface): number {
        const absoluteAmount = Math.abs((cluster.totalBaseAmount ?? cluster.rows[0].amount) / PRECISION);

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
}

export const categorizeInboxEngineService = new CategorizeInboxEngineService();
