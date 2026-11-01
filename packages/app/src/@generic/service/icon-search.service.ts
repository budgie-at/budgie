import { isEmojiIcon, isUserIcon, UserIconNameEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { normalizeIconSearchText } from '../utils/normalize-icon-search-text.util';
import { resolveReiconIcon } from '../utils/resolve-reicon-icon.util';

import type { IconSearchEntryInterface } from '../interface/icon-search-entry.interface';
import type { IconSearchTokenIndexInterface } from '../interface/icon-search-token-index.interface';
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
    private static readonly NAME_WORD_SCORE = IconSearchService.NAME_SCORE - IconSearchService.PREFIX_SCORE;
    private static readonly HEAD_WORD_WEIGHT = 0.65;
    private static readonly MODIFIER_WORD_WEIGHT = 0.6;
    private static readonly MIN_SUGGESTION_SCORE = IconSearchService.WORD_SCORE;
    private static readonly MIN_RELEVANT_SUGGESTIONS = 4;
    private static readonly GENERIC_WORDS = new Set([
        'a',
        'activities',
        'an',
        'and',
        'costs',
        'expenses',
        'extra',
        'extras',
        'for',
        'general',
        'misc',
        'miscellaneous',
        'my',
        'of',
        'other',
        'others',
        'our',
        'personal',
        'runs',
        'side',
        'stuff',
        'the',
        'things',
        'various'
    ]);

    private static readonly FALLBACK_ICONS: readonly UserIconType[] = [
        UserIconNameEnum.Folder,
        UserIconNameEnum.Briefcase,
        UserIconNameEnum.Laptop,
        UserIconNameEnum.Code,
        UserIconNameEnum.Lightbulb,
        UserIconNameEnum.Star,
        UserIconNameEnum.Bookmark,
        UserIconNameEnum.Tag,
        UserIconNameEnum.Sparkles
    ].map(resolveReiconIcon);

    readonly load = Effect.fn('IconSearchService.load')(function* (this: IconSearchService) {
        const { default: index } = yield* Effect.promise(() => import('../constant/icon-search-index.json'));
        const translations: Record<string, string> = index.translations;
        const icons = index.icons.flatMap(([icon, keywords]) =>
            isUserIcon(icon) && isNotEmptyString(keywords) ? [{ icon, keywords }] : []
        );
        const labels = new Set(icons.map(({ keywords }) => this.toReadableName(keywords.split(/\|/u)[0])));

        return icons.map(({ icon, keywords }) => this.createEntry(icon, keywords, translations, labels));
    });

    private readonly tokenIndexes = new WeakMap<readonly IconSearchEntryInterface[], IconSearchTokenIndexInterface>();

    rank(entries: readonly IconSearchEntryInterface[], terms: readonly string[]): IconSearchEntryInterface[] {
        return this.score(entries, terms, true).map(({ entry }) => entry);
    }

    suggest(
        entries: readonly IconSearchEntryInterface[],
        terms: readonly string[],
        excludedIcons: readonly UserIconNameEnum[] = []
    ): IconSearchEntryInterface[] {
        const scored = this.score(entries, terms, false).filter(({ score }) => score >= IconSearchService.MIN_SUGGESTION_SCORE);
        const relevant = this.distinctFamilies(
            scored.map(({ entry }) => entry),
            excludedIcons
        );

        if (relevant.length >= IconSearchService.MIN_RELEVANT_SUGGESTIONS) {
            return relevant;
        }

        const fallback = IconSearchService.FALLBACK_ICONS.map(icon => entries.find(entry => entry.icon === icon)).filter(isDefined);

        return this.distinctFamilies([...relevant, ...fallback], excludedIcons);
    }

    findConfidentIcon(entries: readonly IconSearchEntryInterface[], terms: readonly string[]): UserIconType | null {
        const confident = this.score(entries, terms, false).filter(({ score }) => score >= IconSearchService.CONFIDENT_SCORE);
        const top = confident.find(({ entry }) => !isEmojiIcon(entry.icon)) ?? confident.at(0);

        return top?.entry.icon ?? null;
    }

    private distinctFamilies(
        candidates: readonly IconSearchEntryInterface[],
        excludedIcons: readonly UserIconNameEnum[]
    ): IconSearchEntryInterface[] {
        const families = new Set(excludedIcons.map(icon => this.getFamily(resolveReiconIcon(icon))));

        return candidates.filter(({ icon }) => {
            const family = this.getFamily(icon);
            const isNewFamily = !families.has(family);
            families.add(family);

            return isNewFamily;
        });
    }

    private getFamily(icon: UserIconType): string {
        return isEmojiIcon(icon) ? (Array.from(icon).at(0) ?? icon) : (/^(?:reicon:)?[A-Z][a-z]*/u.exec(icon)?.[0] ?? icon);
    }

    private score(entries: readonly IconSearchEntryInterface[], terms: readonly string[], allowPrefix: boolean) {
        const weightedTerms = [...new Set(terms.map(normalizeIconSearchText))]
            .filter(isNotEmptyString)
            .map(term => this.toWeightedWords(term));

        const variants = weightedTerms.flatMap(({ phrase, words }) => [...phrase, ...words.flatMap(({ variants }) => variants)]);

        return this.findCandidates(entries, variants)
            .map(entry => ({
                entry,
                score: weightedTerms.reduce(
                    (total, { phrase, words }, index) =>
                        total +
                        Math.max(
                            this.scoreWord(entry, phrase, allowPrefix),
                            words.reduce((sum, { variants, weight }) => sum + this.scoreWord(entry, variants, allowPrefix) * weight, 0)
                        ) /
                            (index + 1),
                    0
                )
            }))
            .filter(({ score }) => isPositiveNumber(score))
            .sort((first, second) => second.score - first.score);
    }

    private findCandidates(entries: readonly IconSearchEntryInterface[], variants: readonly string[]): IconSearchEntryInterface[] {
        const { tokens, postings } = this.getTokenIndex(entries);
        const entryIndexes = new Set<number>();

        variants.forEach(variant => {
            const [prefix] = variant.split(/[| ]/u);
            const start = this.countTokensBefore(tokens, token => token < prefix);
            const end = this.countTokensBefore(tokens, token => token < prefix || token.startsWith(prefix));

            tokens.slice(start, end).forEach(token => postings.get(token)?.forEach(entryIndex => void entryIndexes.add(entryIndex)));
        });

        return [...entryIndexes].sort((first, second) => first - second).map(entryIndex => entries[entryIndex]);
    }

    private getTokenIndex(entries: readonly IconSearchEntryInterface[]): IconSearchTokenIndexInterface {
        const cachedIndex = this.tokenIndexes.get(entries);

        if (isDefined(cachedIndex)) {
            return cachedIndex;
        }

        const postings = new Map<string, number[]>();

        entries.forEach(({ keywords }, entryIndex) => {
            new Set(keywords.split(/[| ]/u)).forEach(token => {
                const entryIndexes = postings.get(token);

                if (isDefined(entryIndexes)) {
                    entryIndexes.push(entryIndex);
                } else {
                    postings.set(token, [entryIndex]);
                }
            });
        });

        const index = { tokens: [...postings.keys()].sort(), postings };
        this.tokenIndexes.set(entries, index);

        return index;
    }

    private countTokensBefore(tokens: readonly string[], isBefore: (token: string) => boolean): number {
        let low = 0;
        let high = tokens.length;

        while (low < high) {
            const middle = Math.floor((low + high) / 2);

            if (isBefore(tokens[middle])) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }

        return low;
    }

    private toWeightedWords(term: string) {
        const words = term.split(/[^\p{L}\p{N}]+/u).filter(isNotEmptyString);
        const meaningfulWords = words.filter(word => !IconSearchService.GENERIC_WORDS.has(word));
        const candidateWords = isNotEmptyArray(meaningfulWords) ? meaningfulWords : words;
        const scoredWords = words.length < 2 ? [] : candidateWords;

        return {
            phrase: this.toVariants(term),
            words: scoredWords.map((word, index) => ({
                variants: this.toVariants(word),
                weight: index === scoredWords.length - 1 ? IconSearchService.HEAD_WORD_WEIGHT : IconSearchService.MODIFIER_WORD_WEIGHT
            }))
        };
    }

    private scoreWord(entry: IconSearchEntryInterface, variants: readonly string[], allowPrefix: boolean): number {
        return Math.max(...variants.map(variant => this.scoreVariant(entry, variant, allowPrefix)));
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

    private createEntry(
        icon: UserIconType,
        keywords: string,
        translations: Record<string, string>,
        labels: Set<string>
    ): IconSearchEntryInterface {
        const [nameKeywords, otherKeywords = ''] = keywords.split('||');
        const name = `|${this.withTranslations(icon, nameKeywords, translations)}|`;

        return {
            icon,
            label: this.toDistinctLabel(nameKeywords.split('|'), labels),
            name,
            keywords: `${name}${this.withTranslations(icon, otherKeywords, translations)}|`
        };
    }

    private toDistinctLabel([primaryName = '', ...aliases]: readonly string[], labels: Set<string>): string {
        const label = this.toReadableName(primaryName);
        const alias = /\d/u.test(primaryName)
            ? aliases.map(candidate => this.toReadableName(candidate)).find(candidate => !/\d/u.test(candidate) && !labels.has(candidate))
            : void 0;

        if (isDefined(alias)) {
            labels.add(alias);
        }

        return alias ?? label;
    }

    private toReadableName(name: string): string {
        const readable = name.replaceAll(/(?<=\p{L})(\d+)\b/gu, ' $1').trim();

        return `${readable.charAt(0).toUpperCase()}${readable.slice(1)}`;
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

        if (name.includes(`|${term} `) || name.includes(` ${term}|`) || name.includes(` ${term} `)) {
            return IconSearchService.NAME_WORD_SCORE;
        }

        if (this.hasPrefix(name, term)) {
            return IconSearchService.NAME_PREFIX_SCORE;
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
