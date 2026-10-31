import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { iconSearchService } from '../src/@generic/service/icon-search.service';
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

            expect(['reicon:Leaf', '🌱', '🪴', '🌿']).toContain(top);
            expect(confident).toBe(top);
        })
    );

    it.effect('matchesCoffeeRunsToCoffee', () =>
        Effect.gen(function* () {
            expect((yield* suggestFor('Coffee runs')).confident).toBe('reicon:Coffee');
        })
    );

    it.effect('matchesParcelDeliveryToAPackage', () =>
        Effect.gen(function* () {
            expect(['📦️', 'reicon:Package', 'reicon:Box']).toContain((yield* suggestFor('Parcel delivery')).confident);
        })
    );

    it.effect('matchesClimbingGymToAClimberConfidently', () =>
        Effect.gen(function* () {
            expect((yield* suggestFor('Climbing gym')).confident).toBe('🧗');
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
            expect(suggestions.slice(0, 6)).toContain('reicon:FolderOpen');
            expect(suggestions.slice(0, 6)).toContain('reicon:Briefcase');
            expect(suggestions).not.toContain('🍳');
            expect(suggestions).not.toContain('reicon:FoodTray');
        })
    );

    it.effect('fallsBackToGenericIconsWhenNothingIsRelevant', () =>
        Effect.gen(function* () {
            expect((yield* suggestFor('Zzqx')).suggestions).toEqual([
                'reicon:Folder',
                'reicon:Briefcase',
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
});
