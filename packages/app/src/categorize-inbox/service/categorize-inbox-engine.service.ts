import { LanguageEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { CategorizeInboxListItemKindEnum } from '../enum/categorize-inbox-list-item-kind.enum';
import { CategorizeInboxSectionEnum } from '../enum/categorize-inbox-section.enum';
import { CategorizeInboxTransferKindEnum } from '../enum/categorize-inbox-transfer-kind.enum';

import type { CategorizeInboxBuildContextInterface } from '../interface/categorize-inbox-build-context.interface';
import type { CategorizeInboxClusterInterface } from '../interface/categorize-inbox-cluster.interface';
import type { CategorizeInboxScoreInterface } from '../interface/categorize-inbox-score.interface';
import type { CategorizeInboxListItemType } from '../type/categorize-inbox-list-item.type';
import type { CategoryEvidenceRowInterface, CategorizeInboxRowInterface } from '@budgie/contracts';

class CategorizeInboxEngineService {
    private static readonly LIMITS = { chipCount: 3, confidentShare: 0.85, confidentCount: 2, merchantTokenCount: 3 } as const;
    private static readonly LEGAL_FORM_TOKENS: Record<LanguageEnum, readonly string[]> = {
        [LanguageEnum.EN]: ['ltd', 'llc', 'inc', 'co', 'bv'],
        [LanguageEnum.UK]: ['тов', 'фоп', 'пп', 'ооо'],
        [LanguageEnum.DE]: ['gmbh', 'ag', 'kg', 'og'],
        [LanguageEnum.FR]: ['sa'],
        [LanguageEnum.ES]: ['sa', 'srl']
    };

    private static readonly ATM_KEYWORDS: Record<LanguageEnum, readonly string[]> = {
        [LanguageEnum.EN]: ['atm', 'cash\\s+withdrawal'],
        [LanguageEnum.UK]: ['банкомат', 'зняття\\s+готівки'],
        [LanguageEnum.DE]: ['bankomat', 'geldautomat', 'bargeld'],
        [LanguageEnum.FR]: ['distributeur', 'retrait'],
        [LanguageEnum.ES]: ['cajero', 'retiro']
    };

    private static readonly CARD_KEYWORDS: Record<LanguageEnum, readonly string[]> = {
        [LanguageEnum.EN]: ['card\\s+transfer', 'transfer\\s+to\\s+card'],
        [LanguageEnum.UK]: ['переказ\\s+на\\s+картку', 'переказ\\s+з\\s+картки', 'з\\s+картки'],
        [LanguageEnum.DE]: ['umbuchung', 'überweisung\\s+an'],
        [LanguageEnum.FR]: ['virement\\s+carte'],
        [LanguageEnum.ES]: ['transferencia\\s+a\\s+tarjeta']
    };

    private static readonly LEGAL_FORMS = new Set(Object.values(CategorizeInboxEngineService.LEGAL_FORM_TOKENS).flat());
    private static readonly ATM_PATTERN = CategorizeInboxEngineService.buildKeywordPattern(CategorizeInboxEngineService.ATM_KEYWORDS);
    private static readonly CARD_PATTERN = CategorizeInboxEngineService.buildKeywordPattern(CategorizeInboxEngineService.CARD_KEYWORDS);
    private static readonly MASKED_PAN_PATTERN = /\d{4,6}\*+\d{2,4}/u;
    private static readonly NOISE_PATTERN = /(?<![\p{L}\p{N}])\p{L}{2,8}:\S+|https?:\/\/\S+|\bwww\.|\d{4,6}\*+\d{2,4}|\+?\d[\d\s-]{6,}\d/gu;
    private static readonly DIACRITIC_PATTERN = /\p{Diacritic}/gu;
    private static readonly TOKEN_SEPARATOR_PATTERN = /[^\p{L}]+/u;
    private static readonly RULE_WORD_PATTERN = /\p{L}{2,}/gu;
    private static readonly ATM_MCC_CODES: ReadonlySet<string | null> = new Set(['6010', '6011']);
    private static readonly CARD_TRANSFER_MCC_CODES: ReadonlySet<string | null> = new Set(['4829']);
    private static readonly SECTION_ORDER = Object.values(CategorizeInboxSectionEnum);

    @Log(
        (rows, evidence, defaultInstrumentId) =>
            `enter rowCount=${rows.length} evidenceCount=${evidence.length} defaultInstrumentId=${defaultInstrumentId}`,
        (result, rows, evidence, defaultInstrumentId) =>
            `done rowCount=${rows.length} evidenceCount=${evidence.length} defaultInstrumentId=${defaultInstrumentId} itemCount=${result.items.length} confidentRowCount=${result.confidentRowCount}`,
        (error, rows, evidence, defaultInstrumentId) =>
            `throw rowCount=${rows.length} evidenceCount=${evidence.length} defaultInstrumentId=${defaultInstrumentId} error=${getErrorMessage(error)}`
    )
    buildInbox(rows: CategorizeInboxRowInterface[], evidence: CategoryEvidenceRowInterface[], defaultInstrumentId: number) {
        const uniqueRows = [...new Map(rows.map(row => [row.transactionId, row])).values()];
        const clusters = this.buildClusters(uniqueRows, this.buildContext(evidence, defaultInstrumentId));
        const confidentClusters = clusters.filter(cluster => cluster.isConfident);

        return {
            items: this.buildListItems(clusters),
            totalRowCount: uniqueRows.length,
            confidentRowCount: this.sumValues(confidentClusters.map(cluster => cluster.rows.length)),
            confidentClusterCount: confidentClusters.length,
            confidentAssignments: confidentClusters.map(cluster => ({
                clusterKey: cluster.key,
                categoryId: cluster.candidates[0].categoryId,
                transactionIds: cluster.rows.map(row => row.transactionId),
                ruleConditionValue: cluster.ruleConditionValue
            }))
        };
    }

    private buildContext(evidence: CategoryEvidenceRowInterface[], defaultInstrumentId: number): CategorizeInboxBuildContextInterface {
        const titledEvidence = evidence.filter(row => isNotEmptyString(row.title.trim()));
        const global = this.groupBy(evidence, row => row.type);
        const mccEvidence = evidence.filter(row => isDefined(row.mccCategoryId));

        return {
            exact: this.groupBy(titledEvidence, row => `${row.type}|${row.title.toLowerCase()}`),
            merchant: this.groupBy(titledEvidence, row => `${row.type}|${this.merchantKey(row.title)}`),
            mcc: this.groupBy(mccEvidence, row => `${row.type}|${row.mccCategoryId}`),
            popularCategoryIds: new Map([...global.keys()].map(type => [type, this.rankCategoryIds(this.countCategories(global, [type]))])),
            defaultInstrumentId
        };
    }

    private buildClusters(rows: CategorizeInboxRowInterface[], context: CategorizeInboxBuildContextInterface) {
        const transferKinds = new Map(rows.map(row => [row, this.detectTransferKind(row)]));
        const isTransfer = (row: CategorizeInboxRowInterface): boolean => isDefined(transferKinds.get(row));
        const transferRows: CategorizeInboxRowInterface[] = [];
        const merchantGroups = this.groupBy(rows, row => `${row.type}|${this.merchantKey(row.title)}`);
        const categoryClusters = [...merchantGroups].flatMap(([key, groupRows]) => {
            if (!groupRows.some(isTransfer) || this.scoreRows(groupRows, context).isConfident) {
                return [this.buildCluster(key, groupRows, null, context)];
            }

            const categoryRows = groupRows.filter(row => !isTransfer(row));

            transferRows.push(...groupRows.filter(isTransfer));

            return isNotEmptyArray(categoryRows) ? [this.buildCluster(key, categoryRows, null, context)] : [];
        });
        const transferGroups = this.groupBy(transferRows, row => `${row.type}|TRANSFER|${transferKinds.get(row)}|${row.accountId}`);

        const transferClusters = [...transferGroups].map(([key, groupRows]) =>
            this.buildCluster(key, groupRows, transferKinds.get(groupRows[0]) ?? null, context)
        );

        return [...categoryClusters, ...transferClusters];
    }

    private buildCluster(
        key: string,
        rows: CategorizeInboxRowInterface[],
        transferKind: CategorizeInboxTransferKindEnum | null,
        context: CategorizeInboxBuildContextInterface
    ): CategorizeInboxClusterInterface {
        const { candidates, isConfident } = this.scoreRows(rows, context);
        const isClusterConfident = isConfident && !isDefined(transferKind);
        const titles = rows.map(row => row.title);
        const displayTitle = this.mostFrequent(titles);
        const baseAmounts = rows
            .map(row => (row.baseInstrumentId === context.defaultInstrumentId ? row.baseAmount : null))
            .filter(isDefined);

        return {
            key,
            type: rows[0].type,
            displayTitle,
            variantCount: new Set(titles).size,
            rows,
            totalBaseAmount: isNotEmptyArray(baseAmounts) ? this.sumValues(baseAmounts) : null,
            sourceAccountId: rows[0].accountId,
            candidates,
            isConfident: isClusterConfident,
            transferKind,
            ruleConditionValue: this.buildRuleConditionValue(titles, displayTitle),
            section: this.resolveSection(isClusterConfident, isDefined(transferKind), rows.length)
        };
    }

    private scoreRows(rows: CategorizeInboxRowInterface[], context: CategorizeInboxBuildContextInterface): CategorizeInboxScoreInterface {
        const { LIMITS } = CategorizeInboxEngineService;
        const [{ type }] = rows;
        const exactCounts = this.countCategories(context.exact, new Set(rows.map(row => `${type}|${row.title.toLowerCase()}`)));
        const merchantCounts = this.countCategories(context.merchant, new Set(rows.map(row => `${type}|${this.merchantKey(row.title)}`)));
        const historyCounts = [exactCounts, merchantCounts].find(counts => isPositiveNumber(counts.size));
        const mccKeys = rows.map(row => `${type}|${row.mccCategoryId}`);
        const counts = historyCounts ?? this.countCategories(context.mcc, mccKeys);
        const total = this.sumValues(counts.values());
        const topCount = Math.max(0, ...counts.values());
        const categoryIds = new Set([...this.rankCategoryIds(counts), ...(context.popularCategoryIds.get(type) ?? [])]);

        return {
            candidates: [...categoryIds]
                .slice(0, LIMITS.chipCount)
                .map(categoryId => ({ categoryId, probability: (counts.get(categoryId) ?? 0) / (total + 1) })),
            isConfident: isDefined(historyCounts) && topCount >= LIMITS.confidentCount && topCount / total >= LIMITS.confidentShare
        };
    }

    private countCategories(level: ReadonlyMap<string, CategoryEvidenceRowInterface[]>, keys: Iterable<string>): Map<number, number> {
        const counts = new Map<number, number>();

        [...keys]
            .flatMap(key => level.get(key) ?? [])
            .forEach(row => counts.set(row.categoryId, (counts.get(row.categoryId) ?? 0) + row.count));

        return counts;
    }

    private merchantKey(title: string): string {
        const { LIMITS, NOISE_PATTERN, DIACRITIC_PATTERN, TOKEN_SEPARATOR_PATTERN, LEGAL_FORMS } = CategorizeInboxEngineService;
        const cleaned = title.normalize('NFKD').replace(DIACRITIC_PATTERN, '').toLowerCase().replace(NOISE_PATTERN, ' ');
        const tokens = cleaned.split(TOKEN_SEPARATOR_PATTERN).filter(token => token.length >= 2 && !LEGAL_FORMS.has(token));
        const key = [...new Set(tokens)].slice(0, LIMITS.merchantTokenCount).join(' ');

        return isNotEmptyString(key) ? key : title.trim().toLowerCase();
    }

    private detectTransferKind(row: CategorizeInboxRowInterface): CategorizeInboxTransferKindEnum | null {
        const { ATM_MCC_CODES, ATM_PATTERN, CARD_TRANSFER_MCC_CODES, MASKED_PAN_PATTERN, CARD_PATTERN } = CategorizeInboxEngineService;
        const title = row.title.normalize('NFC').toLowerCase();

        if (ATM_MCC_CODES.has(row.mccCode) || ATM_PATTERN.test(title)) {
            return CategorizeInboxTransferKindEnum.ATM_WITHDRAWAL;
        }

        if (CARD_TRANSFER_MCC_CODES.has(row.mccCode) || MASKED_PAN_PATTERN.test(row.title) || CARD_PATTERN.test(title)) {
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

        return sequences.find(sequence => sequence.length >= 3 && loweredTitles.every(title => title.includes(sequence))) ?? displayTitle;
    }

    private resolveSection(isConfident: boolean, isTransfer: boolean, rowCount: number): CategorizeInboxSectionEnum {
        if (isConfident) {
            return CategorizeInboxSectionEnum.CONFIDENT;
        }

        if (isTransfer) {
            return CategorizeInboxSectionEnum.TRANSFERS;
        }

        return rowCount > 1 ? CategorizeInboxSectionEnum.REVIEW : CategorizeInboxSectionEnum.ONE_OFFS;
    }

    private buildListItems(clusters: readonly CategorizeInboxClusterInterface[]): CategorizeInboxListItemType[] {
        return CategorizeInboxEngineService.SECTION_ORDER.flatMap((section): CategorizeInboxListItemType[] => {
            const sectionClusters = clusters
                .filter(cluster => cluster.section === section)
                .sort((left, right) => this.computeSortScore(right) - this.computeSortScore(left) || left.key.localeCompare(right.key));
            const clusterItems = sectionClusters.map((cluster): CategorizeInboxListItemType => ({
                kind: CategorizeInboxListItemKindEnum.CLUSTER,
                key: cluster.key,
                cluster
            }));
            const header: CategorizeInboxListItemType = {
                kind: CategorizeInboxListItemKindEnum.SECTION_HEADER,
                key: `section-${section}`,
                section,
                count: sectionClusters.length
            };

            return isNotEmptyArray(clusterItems) ? [header, ...clusterItems] : [];
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

    private rankCategoryIds(counts: ReadonlyMap<number, number>): number[] {
        return [...counts].sort(([leftId, left], [rightId, right]) => right - left || leftId - rightId).map(([categoryId]) => categoryId);
    }

    private mostFrequent(values: readonly string[]): string {
        const counts = new Map<string, number>();

        values.forEach(value => counts.set(value, (counts.get(value) ?? 0) + 1));

        return [...counts].reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0];
    }

    private sumValues(values: Iterable<number>): number {
        return [...values].reduce((total, value) => total + value, 0);
    }

    private static buildKeywordPattern(keywords: Record<LanguageEnum, readonly string[]>): RegExp {
        return new RegExp(`(?<!\\p{L})(?:${Object.values(keywords).flat().join('|')})(?!\\p{L})`, 'u');
    }
}

export const categorizeInboxEngineService = new CategorizeInboxEngineService();
