import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { iconSearchService } from '../src/@generic/service/icon-search.service';
import { getCategoryIconTerms } from '../src/category/utils/get-category-icon-terms.util';

const suggestFor = (title: string) =>
    Effect.map(iconSearchService.load(), entries => {
        const terms = getCategoryIconTerms({ title, titleEn: null, titleTags: null });

        return {
            top: iconSearchService.suggest(entries, terms).at(0)?.icon,
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

    it.effect('matchesClimbingGymToClimbingOrFitness', () =>
        Effect.gen(function* () {
            expect(['🧗', 'reicon:ImageMountain', 'reicon:Dumbbell']).toContain((yield* suggestFor('Climbing gym')).top);
        })
    );

    it.effect('matchesKidsActivitiesToAChild', () =>
        Effect.gen(function* () {
            expect(['🧒', '👦', '👧', 'reicon:UserHeart']).toContain((yield* suggestFor('Kids activities')).top);
        })
    );

    it.effect('appliesNoIconWhenSideProjectHasOnlyWeakMatches', () =>
        Effect.gen(function* () {
            expect((yield* suggestFor('Side project')).confident).toBeNull();
        })
    );

    it.effect('neverMatchesAStemCollision', () =>
        Effect.gen(function* () {
            const entries = yield* iconSearchService.load();

            expect(iconSearchService.suggest(entries, ['Plants']).map(({ icon }) => icon)).not.toContain('reicon:Airplane');
        })
    );
});
