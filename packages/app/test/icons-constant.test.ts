import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { UserIconNameEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';

import { ICON_IMPORTS } from '../src/@generic/constant/icons.constant';

const CHUNKS_DIR = join(__dirname, '..', 'src', '@generic', 'constant', 'icons');
const REICON_ICONS_DIR = join(__dirname, '..', 'node_modules', 'reicon-react-native', 'icons');

const mappedIconNames = readdirSync(CHUNKS_DIR)
    .flatMap(fileName => [...readFileSync(join(CHUNKS_DIR, fileName), 'utf8').matchAll(/reicon-react-native\/icons\/(\w+)'/gu)])
    .map(([, iconName]) => iconName);

describe('ICON_IMPORTS', () => {
    it('maps every UserIconNameEnum value', () => {
        expect(Object.keys(ICON_IMPORTS).sort()).toEqual(Object.values(UserIconNameEnum).sort());
    });

    it('points every mapping at an existing Reicon icon', () => {
        expect(mappedIconNames).toHaveLength(Object.keys(ICON_IMPORTS).length);
        expect(mappedIconNames.filter(iconName => !existsSync(join(REICON_ICONS_DIR, `${iconName}.js`)))).toEqual([]);
    });
});
