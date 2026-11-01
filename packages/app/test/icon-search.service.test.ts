import { isEmojiIcon } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { iconSearchService } from '../src/@generic/service/icon-search.service';
import { PLACEHOLDER_CATEGORY_ICONS } from '../src/category/constant/placeholder-category-icon.constant';
import { getCategoryIconTerms } from '../src/category/utils/get-category-icon-terms.util';

const suggestFor = (title: string) =>
    Effect.map(iconSearchService.load(), entries => {
        const terms = getCategoryIconTerms({ title, titleEn: null, titleTags: null });

        const suggestions = iconSearchService.suggest(entries, terms).map(({ icon }) => icon);

        return {
            suggestions,
            top: suggestions.at(0),
            confident: iconSearchService.findConfidentIcon(entries, terms)
        };
    });

describe('IconSearchService', () => {
    it.effect('matchesThePluralPlantsToAPlantIcon', () =>
        Effect.gen(function* () {
            const { top, confident } = yield* suggestFor('Plants');

            expect(top).toBe('reicon:Leaf');
            expect(confident).toBe('reicon:Leaf');
        })
    );

    it.effect('matchesCoffeeRunsToCoffee', () =>
        Effect.gen(function* () {
            expect((yield* suggestFor('Coffee runs')).confident).toBe('reicon:Coffee');
        })
    );

    it.effect('prefersAConfidentGlyphOverAHigherScoringEmoji', () =>
        Effect.gen(function* () {
            expect((yield* suggestFor('Parcel delivery')).confident).toBe('reicon:Package');
        })
    );

    it.effect('fallsBackToAnEmojiWhenNoGlyphIsConfident', () =>
        Effect.gen(function* () {
            const { confident, suggestions } = yield* suggestFor('Climbing gym');

            expect(confident).toBe('🧗');
            expect(suggestions.filter(icon => icon.startsWith('🧗'))).toEqual(['🧗']);
        })
    );

    it.effect('matchesKidsActivitiesToAChild', () =>
        Effect.gen(function* () {
            expect((yield* suggestFor('Kids activities')).top).toBe('🧒');
        })
    );

    it.effect('suggestsProjectIconsWithoutFoodOrConfidenceForSideProject', () =>
        Effect.gen(function* () {
            const { confident, suggestions } = yield* suggestFor('Side project');

            expect(confident).toBeNull();
            expect(suggestions.filter(icon => icon.startsWith('reicon:Folder'))).toHaveLength(1);
            expect(suggestions.slice(0, 6)).toContain('reicon:Briefcase');
            expect(suggestions).not.toContain('🍳');
            expect(suggestions).not.toContain('reicon:FoodTray');
        })
    );

    it.effect('putsWeakNameMatchesBeforeFallbacksWithoutPlaceholders', () =>
        Effect.gen(function* () {
            const entries = yield* iconSearchService.load();
            const terms = getCategoryIconTerms({ title: 'Side project', titleEn: null, titleTags: null });
            const suggestFrom = (searchTerms: readonly string[]) =>
                iconSearchService
                    .suggest(entries, searchTerms, PLACEHOLDER_CATEGORY_ICONS)
                    .slice(0, 6)
                    .map(({ icon }) => icon);
            const suggestions = suggestFrom(terms);

            expect(suggestions.filter(icon => /^reicon:(?:Folder|Home)/u.test(icon))).toEqual([]);
            expect(suggestions.at(0)).toBe('reicon:Presentation');
            expect(suggestions).toEqual(expect.arrayContaining(['reicon:Briefcase', 'reicon:Laptop', 'reicon:Code']));
            expect(suggestions).not.toEqual(suggestFrom([]));
        })
    );

    it.effect('stopsPaddingWithGenericIconsWhenEnoughMatchesExist', () =>
        Effect.gen(function* () {
            const { suggestions } = yield* suggestFor('Groceries');

            expect(suggestions.length).toBeGreaterThanOrEqual(4);
            expect(suggestions).not.toContain('reicon:Star');
        })
    );

    it.effect('givesEveryIconOfAKindADistinctLabel', () =>
        Effect.gen(function* () {
            const labels = (yield* iconSearchService.load()).map(({ icon, label }) => `${isEmojiIcon(icon)}:${label}`);

            expect(new Set(labels).size).toBe(labels.length);
        })
    );

    it.effect('humanizesCatalogNamesForLabels', () =>
        Effect.gen(function* () {
            const entries = yield* iconSearchService.load();

            expect(entries.find(({ name }) => name.startsWith('|ac2|'))?.label).toBe('Ac 2');
            expect(entries.find(({ name }) => name.startsWith('|building2|'))?.label).toBe('Building complex');
            expect(entries.find(({ name }) => name.startsWith('|add circle|'))?.label).toBe('Add circle');
        })
    );

    it.effect('fallsBackToGenericIconsWhenNothingIsRelevant', () =>
        Effect.gen(function* () {
            expect((yield* suggestFor('Zzqx')).suggestions).toEqual([
                'reicon:Folder',
                'reicon:Briefcase',
                'reicon:Laptop',
                'reicon:Code',
                'reicon:Lightbulb',
                'reicon:Star',
                'reicon:Bookmark',
                'reicon:Tag',
                'reicon:Sparkles'
            ]);
        })
    );

    it.effect('neverMatchesAStemCollision', () =>
        Effect.gen(function* () {
            const entries = yield* iconSearchService.load();

            expect(iconSearchService.suggest(entries, ['Plants']).map(({ icon }) => icon)).not.toContain('reicon:Airplane');
        })
    );

    it.effect('ranksPartialSearchesByTheirPrefix', () =>
        Effect.gen(function* () {
            const entries = yield* iconSearchService.load();

            expect(iconSearchService.rank(entries, ['coff']).map(({ icon }) => icon)).toContain('reicon:Coffee');
            expect(iconSearchService.rank(entries, ['zzqx'])).toEqual([]);
        })
    );
});
