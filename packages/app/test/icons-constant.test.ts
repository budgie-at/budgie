import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CategoryCreateEntitySchema, ReiconIconNameEnum, UserIconNameEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { ICON_IMPORTS } from '../src/@generic/constant/icons.constant';
import { LEGACY_REICON_ICONS } from '../src/@generic/constant/legacy-reicon-icons.constant';
import { resolveReiconIcon } from '../src/@generic/utils/resolve-reicon-icon.util';

const REICON_ICON_COUNT = 2676;
const LEGACY_ICON_COUNT = 1878;

const CHUNKS_DIR = join(__dirname, '..', 'src', '@generic', 'constant', 'icons');
const REICON_ICONS_DIR = join(__dirname, '..', 'node_modules', 'reicon-react-native', 'icons');

const mappedIconNames = readdirSync(CHUNKS_DIR)
    .flatMap(fileName => [...readFileSync(join(CHUNKS_DIR, fileName), 'utf8').matchAll(/reicon-react-native\/icons\/(\w+)'/gu)])
    .map(([, iconName]) => iconName);

describe('ICON_IMPORTS', () => {
    it('mapsAllReiconIconNameEnumValues', () => {
        expect(Object.keys(ICON_IMPORTS)).toHaveLength(REICON_ICON_COUNT);
        expect(Object.keys(ICON_IMPORTS).sort()).toEqual(Object.values(ReiconIconNameEnum).sort());
    });

    it('pointsEveryMappingAtAnExistingReiconIcon', () => {
        expect(mappedIconNames).toHaveLength(Object.keys(ICON_IMPORTS).length);
        expect(mappedIconNames.map(iconName => `reicon:${iconName}`).sort()).toEqual(Object.values(ReiconIconNameEnum).sort());
        expect(mappedIconNames.filter(iconName => !existsSync(join(REICON_ICONS_DIR, `${iconName}.js`)))).toEqual([]);
    });
});

describe('LEGACY_REICON_ICONS', () => {
    it('mapsAllSavedUserIconNameEnumValues', () => {
        expect(Object.keys(LEGACY_REICON_ICONS)).toHaveLength(LEGACY_ICON_COUNT);
        expect(Object.keys(LEGACY_REICON_ICONS).sort()).toEqual(Object.values(UserIconNameEnum).sort());
    });

    it('resolvesEveryLegacyIconToACanonicalImport', () => {
        for (const icon of Object.values(UserIconNameEnum)) {
            expect(resolveReiconIcon(icon)).toBe(LEGACY_REICON_ICONS[icon]);
            expect(ICON_IMPORTS[resolveReiconIcon(icon)]).toBeTypeOf('function');
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
