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

    private static readonly ES_PLURAL_REGEX = /(?:s|x|z|ch|sh)es$/u;
    private static readonly NON_WORD_CHAR_REGEX = /[^\p{L}\p{N}]+/u;
    private static readonly DIGIT_REGEX = /\d/u;
    private static readonly READABLE_DIGIT_REGEX = /(?<=\p{L})(\d+)\b/gu;
    private static readonly EMOJI_MODIFIER_REGEX = /[\u{1F3FB}-\u{1F3FF}]|\u{FE0F}|\u{200D}[\u{2640}\u{2642}]/gu;
    private static readonly ICON_FAMILY_REGEX = /^(?:reicon:)?[A-Z][a-z]*/u;
    private static readonly PIPE_CHAR_CODE = '|'.charCodeAt(0);
    private static readonly SPACE_CHAR_CODE = ' '.charCodeAt(0);
    private static readonly LOWER_A_CHAR_CODE = 'a'.charCodeAt(0);
    private static readonly LOWER_Z_CHAR_CODE = 'z'.charCodeAt(0);

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
        if (isDefined(this.cachedEntries)) {
            return this.cachedEntries;
        }

        const loadPromise =
            this.loadPromise ??
            import('../constant/icon-search-index.json').then(({ default: index }) => {
                const entries = this.buildEntries(index.icons, index.translations);
                this.cachedEntries = entries;

                return entries;
            });

        this.loadPromise = loadPromise;

        return yield* Effect.promise(() => loadPromise);
    });

    private cachedEntries: IconSearchEntryInterface[] | null = null;
    private loadPromise: Promise<IconSearchEntryInterface[]> | null = null;
    private readonly tokenIndexes = new WeakMap<readonly IconSearchEntryInterface[], IconSearchTokenIndexInterface>();
    private readonly translationSeenWords = new Set<string>();

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

    private buildEntries(rawIcons: readonly (readonly string[])[], translations: Record<string, string>): IconSearchEntryInterface[] {
        const labels = new Set<string>();
        const icons: [UserIconType, string][] = [];

        for (const [icon, keywords] of rawIcons) {
            if (isUserIcon(icon) && isNotEmptyString(keywords)) {
                const firstPipe = keywords.indexOf('|');
                const primaryName = firstPipe >= 0 ? keywords.slice(0, firstPipe) : keywords;
                labels.add(this.toReadableName(primaryName));
                icons.push([icon, keywords]);
            }
        }

        const entries: IconSearchEntryInterface[] = [];

        for (const [icon, keywords] of icons) {
            entries.push(this.createEntry(icon, keywords, translations, labels));
        }

        return entries;
    }

    private getFamily(icon: UserIconType): string {
        return isEmojiIcon(icon)
            ? icon.replaceAll(IconSearchService.EMOJI_MODIFIER_REGEX, '')
            : (IconSearchService.ICON_FAMILY_REGEX.exec(icon)?.[0] ?? icon);
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

    private extractFirstToken(value: string): string {
        for (let index = 0; index < value.length; index += 1) {
            const code = value.charCodeAt(index);

            if (code === IconSearchService.PIPE_CHAR_CODE || code === IconSearchService.SPACE_CHAR_CODE) {
                return value.slice(0, index);
            }
        }

        return value;
    }

    private findCandidates(entries: readonly IconSearchEntryInterface[], variants: readonly string[]): IconSearchEntryInterface[] {
        const { tokens, postings } = this.getTokenIndex(entries);
        const isCandidate = new Uint8Array(entries.length);

        for (const variant of variants) {
            const prefix = this.extractFirstToken(variant);
            const start = this.countTokensBefore(tokens, token => token < prefix);
            const end = this.countTokensBefore(tokens, token => token < prefix || token.startsWith(prefix));

            for (let tokenIndex = start; tokenIndex < end; tokenIndex += 1) {
                const posting = postings.get(tokens[tokenIndex]);

                if (isDefined(posting)) {
                    for (const entryIndex of posting) {
                        isCandidate[entryIndex] = 1;
                    }
                }
            }
        }

        const candidates: IconSearchEntryInterface[] = [];

        for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
            if (isCandidate[entryIndex] === 1) {
                candidates.push(entries[entryIndex]);
            }
        }

        return candidates;
    }

    private addTokenPosting(postings: Map<string, number[]>, token: string, entryIndex: number): void {
        const entryIndexes = postings.get(token);

        if (!isDefined(entryIndexes)) {
            postings.set(token, [entryIndex]);

            return;
        }

        if (entryIndexes[entryIndexes.length - 1] !== entryIndex) {
            entryIndexes.push(entryIndex);
        }
    }

    private getTokenIndex(entries: readonly IconSearchEntryInterface[]): IconSearchTokenIndexInterface {
        const cachedIndex = this.tokenIndexes.get(entries);

        if (isDefined(cachedIndex)) {
            return cachedIndex;
        }

        const postings = new Map<string, number[]>();

        for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
            const { keywords } = entries[entryIndex];
            let tokenStart = 0;

            for (let index = 0; index <= keywords.length; index += 1) {
                const code = index < keywords.length ? keywords.charCodeAt(index) : IconSearchService.PIPE_CHAR_CODE;

                if (code === IconSearchService.PIPE_CHAR_CODE || code === IconSearchService.SPACE_CHAR_CODE) {
                    this.addTokenPosting(postings, keywords.slice(tokenStart, index), entryIndex);
                    tokenStart = index + 1;
                }
            }
        }

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
        const words = term.split(IconSearchService.NON_WORD_CHAR_REGEX).filter(isNotEmptyString);
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
        let best = 0;

        for (const variant of variants) {
            const current = this.scoreVariant(entry, variant, allowPrefix);

            if (current > best) {
                best = current;
            }
        }

        return best;
    }

    private toVariants(term: string): string[] {
        if (term.length < IconSearchService.MIN_SINGULAR_LENGTH || term.endsWith('ss')) {
            return [term];
        }

        if (term.endsWith('ies')) {
            return [term, `${term.slice(0, -3)}y`];
        }

        if (IconSearchService.ES_PLURAL_REGEX.test(term)) {
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
        const separatorIndex = keywords.indexOf('||');
        const nameKeywords = separatorIndex >= 0 ? keywords.slice(0, separatorIndex) : keywords;
        const otherKeywords = separatorIndex >= 0 ? keywords.slice(separatorIndex + 2) : '';
        const name = `|${this.withTranslations(icon, nameKeywords, translations)}|`;

        return {
            icon,
            label: this.toDistinctLabel(nameKeywords, labels),
            name,
            keywords: `${name}${this.withTranslations(icon, otherKeywords, translations)}|`
        };
    }

    private toDistinctLabel(nameKeywords: string, labels: Set<string>): string {
        const firstPipe = nameKeywords.indexOf('|');
        const primaryName = firstPipe >= 0 ? nameKeywords.slice(0, firstPipe) : nameKeywords;
        const label = this.toReadableName(primaryName);

        if (firstPipe < 0 || !IconSearchService.DIGIT_REGEX.test(primaryName)) {
            return label;
        }

        let start = firstPipe + 1;

        while (start <= nameKeywords.length) {
            const nextPipe = nameKeywords.indexOf('|', start);
            const end = nextPipe >= 0 ? nextPipe : nameKeywords.length;
            const candidate = this.toReadableName(nameKeywords.slice(start, end));

            if (!IconSearchService.DIGIT_REGEX.test(candidate) && !labels.has(candidate)) {
                labels.add(candidate);

                return candidate;
            }

            if (nextPipe < 0) {
                break;
            }

            start = nextPipe + 1;
        }

        return label;
    }

    private toReadableName(name: string): string {
        const readable = (
            IconSearchService.DIGIT_REGEX.test(name) ? name.replaceAll(IconSearchService.READABLE_DIGIT_REGEX, ' $1') : name
        ).trim();

        return `${readable.charAt(0).toUpperCase()}${readable.slice(1)}`;
    }

    private appendWordTranslation(word: string, translations: Record<string, string>): string {
        const translated = translations[word];

        if (!isDefined(translated) || this.translationSeenWords.has(word)) {
            return '';
        }

        this.translationSeenWords.add(word);

        return `|${translated}`;
    }

    private withTranslations(icon: UserIconType, keywords: string, translations: Record<string, string>): string {
        if (isEmojiIcon(icon) || !isNotEmptyString(keywords)) {
            return keywords;
        }

        this.translationSeenWords.clear();
        let result = keywords;
        let wordStart = -1;

        for (let index = 0; index <= keywords.length; index += 1) {
            const code = index < keywords.length ? keywords.charCodeAt(index) : 0;
            const isLowerAscii = code >= IconSearchService.LOWER_A_CHAR_CODE && code <= IconSearchService.LOWER_Z_CHAR_CODE;

            if (isLowerAscii && wordStart < 0) {
                wordStart = index;
            } else if (!isLowerAscii && wordStart >= 0) {
                result += this.appendWordTranslation(keywords.slice(wordStart, index), translations);
                wordStart = -1;
            }
        }

        return result;
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

        return this.hasPrefix(keywords, term) ? IconSearchService.PREFIX_SCORE : 0;
    }

    private hasPrefix(keywords: string, term: string): boolean {
        return keywords.includes(`|${term}`) || keywords.includes(` ${term}`);
    }
}

export const iconSearchService = new IconSearchService();
