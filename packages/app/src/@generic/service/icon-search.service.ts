import { isEmojiIcon, isUserIcon } from '@budgie/contracts';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { normalizeIconSearchText } from '../utils/normalize-icon-search-text.util';

import type { IconSearchEntryInterface } from '../interface/icon-search-entry.interface';
import type { UserIconType } from '@budgie/contracts';

class IconSearchService {
    private static readonly NAME_SCORE = 4;
    private static readonly EXACT_SCORE = 3;
    private static readonly WORD_PREFIX_SCORE = 2;
    private static readonly STEM_SCORE = 1;
    private static readonly SUBSTRING_SCORE = 0.5;
    private static readonly MIN_SUBSTRING_LENGTH = 3;
    private static readonly STEM_TRIM_DIVISOR = 3;

    entries: readonly IconSearchEntryInterface[] = [];

    private loadingEntries: Promise<readonly IconSearchEntryInterface[]> | null = null;

    async load(): Promise<readonly IconSearchEntryInterface[]> {
        this.loadingEntries ??= import('../constant/icon-search-index.json').then(({ default: index }) => {
            const translations: Record<string, string> = index.translations;

            this.entries = index.icons.flatMap(([icon, keywords]) =>
                isUserIcon(icon) && isNotEmptyString(keywords) ? [this.createEntry(icon, keywords, translations)] : []
            );

            return this.entries;
        });

        return this.loadingEntries;
    }

    rank(entries: readonly IconSearchEntryInterface[], terms: readonly string[]): IconSearchEntryInterface[] {
        const normalizedTerms = [...new Set(terms.map(normalizeIconSearchText))].filter(isNotEmptyString);

        return entries
            .map(entry => ({
                entry,
                score: normalizedTerms.reduce((total, term, index) => total + this.scoreTerm(entry, term) / (index + 1), 0)
            }))
            .filter(({ score }) => isPositiveNumber(score))
            .sort((first, second) => second.score - first.score)
            .map(({ entry }) => entry);
    }

    private createEntry(icon: UserIconType, keywords: string, translations: Record<string, string>): IconSearchEntryInterface {
        const [nameKeywords, otherKeywords = ''] = keywords.split('||');
        const name = `|${this.withTranslations(icon, nameKeywords, translations)}|`;

        return {
            icon,
            label: nameKeywords.split('|')[0],
            name,
            keywords: `${name}${this.withTranslations(icon, otherKeywords, translations)}|`
        };
    }

    private withTranslations(icon: UserIconType, keywords: string, translations: Record<string, string>): string {
        const translatedKeywords = isEmojiIcon(icon)
            ? []
            : [...new Set(keywords.split(/[^a-z]+/u))].map(word => translations[word]).filter(isDefined);

        return [keywords, ...translatedKeywords].join('|');
    }

    private scoreTerm(entry: IconSearchEntryInterface, term: string): number {
        const stem = term.slice(0, term.length - Math.floor(term.length / IconSearchService.STEM_TRIM_DIVISOR));

        return entry.keywords.includes(stem) ? this.scoreMatch(entry, term, stem) : 0;
    }

    private scoreMatch({ name, keywords }: IconSearchEntryInterface, term: string, stem: string): number {
        if (name.includes(`|${term}|`)) {
            return IconSearchService.NAME_SCORE;
        }

        if (keywords.includes(`|${term}|`)) {
            return IconSearchService.EXACT_SCORE;
        }

        if (keywords.includes(`|${term}`) || keywords.includes(` ${term}`)) {
            return IconSearchService.WORD_PREFIX_SCORE;
        }

        if (stem.length >= IconSearchService.MIN_SUBSTRING_LENGTH && (keywords.includes(`|${stem}`) || keywords.includes(` ${stem}`))) {
            return IconSearchService.STEM_SCORE;
        }

        return term.length >= IconSearchService.MIN_SUBSTRING_LENGTH && keywords.includes(term) ? IconSearchService.SUBSTRING_SCORE : 0;
    }
}

export const iconSearchService = new IconSearchService();
