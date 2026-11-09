import {
    ATM_CASH_WITHDRAWAL_MCC,
    ATM_CASH_WITHDRAWAL_TITLE_PREFIXES,
    CASH_DEPOSIT_TITLE_PREFIXES,
    LanguageEnum,
    PRECISION,
    REFUND_TITLE_PREFIXES,
    TransactionTypeEnum
} from '@budgie/contracts';

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
    private static readonly NON_DESCRIPTIVE_MCC: ReadonlySet<string> = new Set([
        '4829',
        '6010',
        ATM_CASH_WITHDRAWAL_MCC,
        '6012',
        '6051',
        '6538',
        '6540',
        '5999',
        '8999',
        '7299',
        '7399'
    ]);

    private static readonly LIMITS = {
        chipCount: 2,
        fallbackCount: 3,
        confidentShare: 0.85,
        confidentCount: 2,
        merchantTokenCount: 3,
        maxConfidentRowCount: 50,
        minTitlePrefixWordCount: 2
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

    private static readonly GENERIC_TRANSFER_TITLES: Record<LanguageEnum, readonly string[]> = {
        [LanguageEnum.EN]: [],
        [LanguageEnum.UK]: [],
        [LanguageEnum.DE]: ['überweisung'],
        [LanguageEnum.FR]: ['virement'],
        [LanguageEnum.ES]: ['transferencia']
    };

    private static readonly TRANSFER_RECIPIENT_PREFIXES: Record<LanguageEnum, readonly string[]> = {
        [LanguageEnum.EN]: ['transfer', 'card transfer', 'transfer to card', 'to card'],
        [LanguageEnum.UK]: [
            'переказ',
            'переказ на картку',
            'на картку',
            'переказ коштів',
            'переказ власних коштів',
            'перевод',
            'перевод на карту',
            'на карту'
        ],
        [LanguageEnum.DE]: ['kartenüberweisung', 'überweisung an', 'sepa überweisung', 'echtzeitüberweisung'],
        [LanguageEnum.FR]: [
            'virement carte',
            'virement sepa',
            'virement émis',
            'virement reçu',
            'virement instantané',
            'virement de',
            'virement à',
            'vir'
        ],
        [LanguageEnum.ES]: [
            'transferencia a tarjeta',
            'transferencia emitida',
            'transferencia recibida',
            'transferencia inmediata',
            'transferencia a favor',
            'transferencia de',
            'transf'
        ]
    };

    private static readonly TRANSFER_TITLE_PREFIX_PATTERN = new RegExp(
        `^(?:${Object.values(CategorizeInboxEngineService.TRANSFER_RECIPIENT_PREFIXES).flat().join('|')})(?:\\s|$)`,
        'u'
    );

    private static readonly GENERIC_TRANSFER_TITLE_SET = new Set([
        ...Object.values(CategorizeInboxEngineService.GENERIC_TRANSFER_TITLES).flat(),
        ...Object.values(CategorizeInboxEngineService.TRANSFER_RECIPIENT_PREFIXES).flat()
    ]);

    private static readonly REFUND_PREFIXES = REFUND_TITLE_PREFIXES.review.map(prefix => prefix.toUpperCase());

    private static readonly LEGAL_FORMS = new Set(Object.values(CategorizeInboxEngineService.LEGAL_FORM_TOKENS).flat());
    private static readonly PAYMENT_TYPE_PREFIX_PATTERN = new RegExp(
        `^(?:${Object.values(CategorizeInboxEngineService.PAYMENT_TYPE_PREFIX_KEYWORDS).flat().join('|')})(?!\\p{L})`,
        'iu'
    );

    private static readonly CASH_WITHDRAWAL_TITLE_PATTERN = new RegExp(
        `^(?:${Object.values(ATM_CASH_WITHDRAWAL_TITLE_PREFIXES).flat().join('|')})(?:\\s|$)`,
        'iu'
    );

    private static readonly CASH_DEPOSIT_TITLE_PATTERN = new RegExp(
        `^(?:${Object.values(CASH_DEPOSIT_TITLE_PREFIXES).flat().join('|')})(?:\\s|$)`,
        'iu'
    );

    private static readonly NOISE_PATTERN = /(?<![\p{L}\p{N}])\p{L}{2,8}:\S+|https?:\/\/\S+|\bwww\.|\d{4,6}\*+\d{2,4}|\+?\d[\d\s-]{6,}\d/gu;
    private static readonly DIACRITIC_PATTERN = /\p{Diacritic}/gu;
    private static readonly TOKEN_SEPARATOR_PATTERN = /[^\p{L}]+/u;
    private static readonly SECTION_ORDER = [
        CategorizeInboxSectionEnum.CONFIDENT,
        CategorizeInboxSectionEnum.CASH_WITHDRAWALS,
        CategorizeInboxSectionEnum.REVIEW,
        CategorizeInboxSectionEnum.ONE_OFFS,
        CategorizeInboxSectionEnum.OLDER
    ];

    buildContext(
        evidence: LabelEvidenceRowInterface[],
        defaultInstrumentId: number,
        labelKind: CategorizeInboxLabelKindEnum
    ): CategorizeInboxBuildContextInterface {
        const titledEvidence = evidence.filter(row => isNotEmptyString(row.title.trim()));
        const merchantEvidence = titledEvidence.filter(row => !this.isTransferLike(row.title));
        const brandEvidence = merchantEvidence.filter(row => isDefined(this.brandKey(row.title)));
        const mccEvidence = evidence.filter(row => isDefined(row.mccCategoryId) && !this.isTransferLike(row.title));

        return {
            exact: this.groupBy(titledEvidence, row => `${row.type}|${this.normalizeTitle(row.title)}`),
            merchant: this.groupBy(merchantEvidence, row => `${row.type}|${this.merchantKey(row.title)}`),
            brand: this.groupBy(brandEvidence, row => `${row.type}|${this.brandKey(row.title)}`),
            mcc: this.groupBy(mccEvidence, row => `${row.type}|${row.mccCategoryId}`),
            defaultInstrumentId,
            labelKind
        };
    }

    buildClusters(
        rows: CategorizeInboxRowInterface[],
        context: CategorizeInboxBuildContextInterface,
        now: Date
    ): CategorizeInboxClusterInterface[] {
        const cutoff = new Date(now);
        cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
        const uniqueRows = [...new Map(rows.map(row => [row.transactionId, row])).values()];
        const clusterGroups = this.groupBy(uniqueRows, row => this.clusterKey(row, cutoff));

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
        const sectionedClusters = visibleClusters
            .map(cluster => ({ ...cluster, section: placements.get(cluster.key) ?? cluster.section }))
            .sort((left, right) => (placementOrder.get(left.key) ?? 0) - (placementOrder.get(right.key) ?? 0));
        const titlePrefixes = this.findTitlePrefixes(sectionedClusters);
        const placedClusters = sectionedClusters.map(cluster =>
            this.reusePrevious({ ...cluster, titlePrefix: titlePrefixes.get(cluster.key) ?? null }, clustersByKey)
        );
        const isUnchanged =
            placedClusters.length === clustersByKey.size && placedClusters.every(cluster => clustersByKey.get(cluster.key) === cluster);

        return {
            items: this.buildListItems(placedClusters),
            placements,
            clustersByKey: isUnchanged ? clustersByKey : new Map(placedClusters.map(cluster => [cluster.key, cluster])),
            remainingCount: this.sumValues(placedClusters.map(cluster => cluster.rows.length))
        };
    }

    suggestLabelIds(rows: Omit<CategorizeInboxRowInterface, 'toIban'>[], context: CategorizeInboxBuildContextInterface): number[] {
        return isNotEmptyArray(rows) ? this.scoreRows(rows, context).candidateLabelIds : [];
    }

    private buildCluster(
        key: string,
        rows: CategorizeInboxRowInterface[],
        context: CategorizeInboxBuildContextInterface
    ): CategorizeInboxClusterInterface {
        const { candidateLabelIds, isConfident } = this.scoreRows(rows, context);
        const mostFrequentTitle = this.mostFrequent(rows.map(row => row.title));

        return {
            key,
            displayTitle: mostFrequentTitle,
            rows,
            totalBaseAmount: this.sumBaseAmounts(rows, context.defaultInstrumentId),
            candidateLabelIds,
            ruleConditionValue: mostFrequentTitle,
            section: this.resolveSection(key, isConfident, rows),
            titlePrefix: null,
            isCashDeposit: rows.every(row =>
                this.isCashRow(row, TransactionTypeEnum.INCOME, CategorizeInboxEngineService.CASH_DEPOSIT_TITLE_PATTERN)
            )
        };
    }

    private clusterKey(row: CategorizeInboxRowInterface, cutoff: Date): string {
        const normalizedTitle = this.normalizeTitle(row.title);
        const exactKey = `${row.type}|${normalizedTitle}|${row.mcc ?? ''}|${row.toIban ?? ''}`;

        if (row.operatedAt < cutoff) {
            return `${CategorizeInboxSectionEnum.OLDER}|${exactKey}`;
        }

        return this.isCashWithdrawal(row) ? `${CategorizeInboxSectionEnum.CASH_WITHDRAWALS}|${exactKey}` : exactKey;
    }

    private isCashWithdrawal(row: Pick<CategorizeInboxRowInterface, 'type' | 'mcc' | 'title'>): boolean {
        return this.isCashRow(row, TransactionTypeEnum.EXPENSE, CategorizeInboxEngineService.CASH_WITHDRAWAL_TITLE_PATTERN);
    }

    private isCashRow(
        row: Pick<CategorizeInboxRowInterface, 'type' | 'mcc' | 'title'>,
        type: TransactionTypeEnum,
        titlePattern: RegExp
    ): boolean {
        return row.type === type && (row.mcc === ATM_CASH_WITHDRAWAL_MCC || (!isDefined(row.mcc) && titlePattern.test(row.title)));
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
            previous.titlePrefix === next.titlePrefix &&
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

    private scoreRows(
        rows: Omit<CategorizeInboxRowInterface, 'toIban'>[],
        context: CategorizeInboxBuildContextInterface
    ): CategorizeInboxScoreInterface {
        const { LIMITS } = CategorizeInboxEngineService;
        const [{ type }] = rows;

        if (
            rows.some(row => this.isGenericTransfer(row.title)) ||
            (context.labelKind === CategorizeInboxLabelKindEnum.TAG && rows.some(row => this.isRefund(row)))
        ) {
            return { candidateLabelIds: [], isConfident: false };
        }

        const exactCounts = this.countLabels(context.exact, new Set(rows.map(row => `${type}|${this.normalizeTitle(row.title)}`)));
        const merchantCounts = this.countLabels(context.merchant, new Set(rows.map(row => `${type}|${this.merchantKey(row.title)}`)));
        const transferLike = rows.some(row => this.isTransferLike(row.title));
        const historyCounts = (transferLike ? [exactCounts] : [exactCounts, merchantCounts]).find(counts => isPositiveNumber(counts.size));
        const counts = historyCounts ?? (transferLike ? new Map<number, number>() : this.fallbackCounts(rows, context));
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

    private fallbackCounts(
        rows: Omit<CategorizeInboxRowInterface, 'toIban'>[],
        context: CategorizeInboxBuildContextInterface
    ): Map<number, number> {
        const [{ type }] = rows;
        const brandCounts = this.countLabels(
            context.brand,
            new Set(rows.map(row => `${type}|${this.brandKey(row.title) ?? ''}`).filter(key => !key.endsWith('|')))
        );
        const mccCounts = this.countLabels(
            context.mcc,
            new Set(
                rows
                    .filter(row => isDefined(row.mcc) && !CategorizeInboxEngineService.NON_DESCRIPTIVE_MCC.has(row.mcc))
                    .map(row => `${type}|${row.mccCategoryId}`)
            )
        );

        return (
            [brandCounts, mccCounts].find(candidate => {
                const topCount = Math.max(0, ...candidate.values());

                return (
                    topCount >= CategorizeInboxEngineService.LIMITS.fallbackCount &&
                    topCount / this.sumValues(candidate.values()) >= CategorizeInboxEngineService.LIMITS.confidentShare
                );
            }) ?? new Map<number, number>()
        );
    }

    private normalizeTitle(title: string): string {
        return title.trim().replaceAll(/\s+/gu, ' ').toLowerCase();
    }

    private isGenericTransfer(title: string): boolean {
        return CategorizeInboxEngineService.GENERIC_TRANSFER_TITLE_SET.has(this.normalizeTransferTitle(title));
    }

    private isTransferLike(title: string): boolean {
        return CategorizeInboxEngineService.TRANSFER_TITLE_PREFIX_PATTERN.test(this.normalizeTransferTitle(title));
    }

    private normalizeTransferTitle(title: string): string {
        return title
            .normalize('NFC')
            .toLowerCase()
            .replaceAll(/[^\p{L}]+/gu, ' ')
            .trim();
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

    private resolveSection(key: string, isConfident: boolean, rows: readonly CategorizeInboxRowInterface[]): CategorizeInboxSectionEnum {
        if (key.startsWith(`${CategorizeInboxSectionEnum.OLDER}|`)) {
            return CategorizeInboxSectionEnum.OLDER;
        }

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

            return isNotEmptyArray(sectionClusters) ? [header, ...this.groupByTitlePrefix(sectionClusters)] : [];
        });
    }

    private groupByTitlePrefix(sectionClusters: readonly CategorizeInboxClusterInterface[]): CategorizeInboxListItemType[] {
        const clustersByPrefix = this.groupBy(sectionClusters, cluster => cluster.titlePrefix ?? '');

        return sectionClusters.flatMap((cluster): CategorizeInboxListItemType[] => {
            if (!isDefined(cluster.titlePrefix)) {
                return [cluster];
            }

            const members = clustersByPrefix.get(cluster.titlePrefix) ?? [];

            return members[0] === cluster
                ? [
                      {
                          key: `prefix-${cluster.section}-${cluster.titlePrefix.toLowerCase()}`,
                          section: cluster.section,
                          prefix: cluster.titlePrefix,
                          count: this.sumValues(members.map(member => member.rows.length))
                      },
                      ...members
                  ]
                : [];
        });
    }

    private findTitlePrefixes(clusters: readonly CategorizeInboxClusterInterface[]): ReadonlyMap<string, string> {
        const { LIMITS } = CategorizeInboxEngineService;
        const candidates = clusters
            .filter(cluster => cluster.section !== CategorizeInboxSectionEnum.ONE_OFFS)
            .map(cluster => ({
                cluster,
                words: cluster.displayTitle.trim().split(/\s+/u)
            }))
            .filter(({ words }) => words.length > LIMITS.minTitlePrefixWordCount);
        const groups = this.groupBy(candidates, ({ cluster, words }) =>
            [cluster.section, ...words.slice(0, LIMITS.minTitlePrefixWordCount)].join(' ').toLocaleLowerCase()
        );

        return new Map(
            [...groups.values()]
                .filter(members => members.length > 1)
                .flatMap(members => {
                    const prefixWordCount = this.countSharedPrefixWords(members.map(({ words }) => words));
                    const prefix = members[0].words.slice(0, prefixWordCount).join(' ');

                    return members.map(({ cluster }): [string, string] => [cluster.key, prefix]);
                })
        );
    }

    private countSharedPrefixWords(titles: readonly (readonly string[])[]): number {
        const [first] = titles;
        const maxCount = Math.min(...titles.map(words => words.length)) - 1;
        const mismatchIndex = first
            .slice(0, maxCount)
            .findIndex((word, index) => titles.some(words => words[index].toLocaleLowerCase() !== word.toLocaleLowerCase()));

        return mismatchIndex < 0 ? maxCount : mismatchIndex;
    }

    private computeSortScore(cluster: CategorizeInboxClusterInterface): number {
        const absoluteAmount = Math.abs((cluster.totalBaseAmount ?? cluster.rows[0].amount) / PRECISION);

        switch (cluster.section) {
            case CategorizeInboxSectionEnum.OLDER:
            case CategorizeInboxSectionEnum.ONE_OFFS:
                return absoluteAmount;
            case CategorizeInboxSectionEnum.REVIEW:
            case CategorizeInboxSectionEnum.CASH_WITHDRAWALS:
            case CategorizeInboxSectionEnum.CONFIDENT:
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
