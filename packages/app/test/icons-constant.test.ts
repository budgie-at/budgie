import { CategoryCreateEntitySchema, ReiconIconNameEnum, UserIconNameEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { isEmptyArray } from '@rnw-community/shared';

import { LEGACY_REICON_ICONS } from '../src/@generic/constant/legacy-reicon-icons.constant';
import REICON_GLYPHS from '../src/@generic/constant/reicon-glyphs.json';
import { resolveReiconIcon } from '../src/@generic/utils/resolve-reicon-icon.util';

const REICON_ICON_COUNT = 2676;
const LEGACY_ICON_COUNT = 1878;

describe('REICON_GLYPHS', () => {
    it('mapsAllReiconIconNameEnumValues', () => {
        expect(Object.keys(REICON_GLYPHS.outline)).toHaveLength(REICON_ICON_COUNT);
        expect(Object.keys(REICON_GLYPHS.outline).sort()).toEqual(Object.values(ReiconIconNameEnum).sort());
    });

    it('drawsEveryReiconIcon', () => {
        expect(Object.entries(REICON_GLYPHS.outline).filter(([, elements]) => isEmptyArray(elements))).toEqual([]);
    });

    it('drawsTheFilledStar', () => {
        expect(Object.keys(REICON_GLYPHS.filled)).toEqual([ReiconIconNameEnum.STAR]);
    });
});

describe('LEGACY_REICON_ICONS', () => {
    it('mapsAllSavedUserIconNameEnumValues', () => {
        expect(Object.keys(LEGACY_REICON_ICONS)).toHaveLength(LEGACY_ICON_COUNT);
        expect(Object.keys(LEGACY_REICON_ICONS).sort()).toEqual(Object.values(UserIconNameEnum).sort());
    });

    it('resolvesEveryLegacyIconToACanonicalGlyph', () => {
        for (const icon of Object.values(UserIconNameEnum)) {
            expect(resolveReiconIcon(icon)).toBe(LEGACY_REICON_ICONS[icon]);
            expect(Object.keys(REICON_GLYPHS.outline)).toContain(resolveReiconIcon(icon));
        }
    });

    it.effect('preservesSavedBikeIdWhileResolvingToBicycle', () =>
        Effect.gen(function* () {
            const category = yield* Schema.decodeUnknownEffect(CategoryCreateEntitySchema)({
                title: 'legacyCategory',
                icon: UserIconNameEnum.Bike,
                parentId: null
            });

            expect(category.icon).toBe(UserIconNameEnum.Bike);
            expect(resolveReiconIcon(UserIconNameEnum.Bike)).toBe(ReiconIconNameEnum.BICYCLE);
        })
    );
});

describe('canonicalSavedIcons', () => {
    it.effect('validatesNamespacedSelectionsWithoutChangingPersistedIds', () =>
        Effect.gen(function* () {
            for (const icon of [ReiconIconNameEnum.BICYCLE, ReiconIconNameEnum.HOME, ReiconIconNameEnum.HEART]) {
                const category = yield* Schema.decodeUnknownEffect(CategoryCreateEntitySchema)({
                    title: 'e2eCategory',
                    icon,
                    parentId: null
                });

                expect(category.icon).toBe(icon);
                expect(resolveReiconIcon(icon)).toBe(icon);
            }
        })
    );
});
