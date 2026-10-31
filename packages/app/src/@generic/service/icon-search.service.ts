import { isEmojiIcon, isUserIcon } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { normalizeIconSearchText } from '../utils/normalize-icon-search-text.util';

import type { IconSearchEntryInterface } from '../interface/icon-search-entry.interface';
import type { UserIconType } from '@budgie/contracts';

class IconSearchService {
    private static readonly NAME_SCORE = 4;
    private static readonly EXACT_SCORE = 3;
    private static readonly EXACT_DECAY_LENGTH = 200;
    private static readonly WORD_SCORE = 1.5;
    private static readonly NAME_PREFIX_SCORE = 0.75;
    private static readonly PREFIX_SCORE = 0.5;
    private static readonly MIN_PREFIX_LENGTH = 4;
    private static readonly MIN_SINGULAR_LENGTH = 4;
    private static readonly CONFIDENT_SCORE = 2;

    readonly load = Effect.fn('IconSearchService.load')(function* (this: IconSearchService) {
        const { default: index } = yield* Effect.promise(() => import('../constant/icon-search-index.json'));
        const translations: Record<string, string> = index.translations;

        return index.icons.flatMap(([icon, keywords]) =>
            isUserIcon(icon) && isNotEmptyString(keywords) ? [this.createEntry(icon, keywords, translations)] : []
        );
    });

    rank(entries: readonly IconSearchEntryInterface[], terms: readonly string[]): IconSearchEntryInterface[] {
        return this.score(entries, terms, true).map(({ entry }) => entry);
    }

    suggest(entries: readonly IconSearchEntryInterface[], terms: readonly string[]): IconSearchEntryInterface[] {
        return this.score(entries, terms, false).map(({ entry }) => entry);
    }

    findConfidentIcon(entries: readonly IconSearchEntryInterface[], terms: readonly string[]): UserIconType | null {
        const [top] = this.score(entries, terms, false);

        return isDefined(top) && top.score >= IconSearchService.CONFIDENT_SCORE ? top.entry.icon : null;
    }

    private score(entries: readonly IconSearchEntryInterface[], terms: readonly string[], allowPrefix: boolean) {
        const termVariants = [...new Set(terms.map(normalizeIconSearchText))].filter(isNotEmptyString).map(term => this.toVariants(term));

        return entries
            .map(entry => ({
                entry,
                score: termVariants.reduce(
                    (total, variants, index) =>
                        total + Math.max(...variants.map(variant => this.scoreVariant(entry, variant, allowPrefix))) / (index + 1),
                    0
                )
            }))
            .filter(({ score }) => isPositiveNumber(score))
            .sort((first, second) => second.score - first.score);
    }

    private toVariants(term: string): string[] {
        if (term.length < IconSearchService.MIN_SINGULAR_LENGTH || term.endsWith('ss')) {
            return [term];
        }

        if (term.endsWith('ies')) {
            return [term, `${term.slice(0, -3)}y`];
        }

        if (/(?:s|x|z|ch|sh)es$/u.test(term)) {
            return [term, term.slice(0, -2)];
        }

        return term.endsWith('s') ? [term, term.slice(0, -1)] : [term];
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

    private scoreVariant({ name, keywords }: IconSearchEntryInterface, term: string, allowPrefix: boolean): number {
        if (name.includes(`|${term}|`)) {
            return IconSearchService.NAME_SCORE;
        }

        const exactOffset = keywords.indexOf(`|${term}|`, name.length - 1);

        if (exactOffset >= 0) {
            const decay =
                Math.min(exactOffset - name.length + 1, IconSearchService.EXACT_DECAY_LENGTH) / IconSearchService.EXACT_DECAY_LENGTH;

            return IconSearchService.EXACT_SCORE - decay;
        }

        if (keywords.includes(`|${term} `) || keywords.includes(` ${term}|`) || keywords.includes(` ${term} `)) {
            return IconSearchService.WORD_SCORE;
        }

        if (!allowPrefix || term.length < IconSearchService.MIN_PREFIX_LENGTH) {
            return 0;
        }

        if (this.hasPrefix(name, term)) {
            return IconSearchService.NAME_PREFIX_SCORE;
        }

        return this.hasPrefix(keywords, term) ? IconSearchService.PREFIX_SCORE : 0;
    }

    private hasPrefix(keywords: string, term: string): boolean {
        return keywords.includes(`|${term}`) || keywords.includes(` ${term}`);
    }
}

export const iconSearchService = new IconSearchService();
