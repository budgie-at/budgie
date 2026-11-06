import { readdirSync } from 'node:fs';

import { expect, it } from '@effect/vitest';

import { BANK_LOGO_NAMES } from '../src/@generic/constant/bank-logo-names.constant';
import { BANK_PROVIDER_LOGO_SLUG } from '../src/@generic/constant/bank-provider-logo-slug.constant';
import { getBankLogoSlug } from '../src/@generic/utils/get-bank-logo-slug.util';

import logoNames from './fixture/bank-logo-names.json';

it('resolves every listed bank name to its logo', () => {
    for (const [slug, names] of Object.entries(logoNames)) {
        for (const name of names) {
            expect(getBankLogoSlug(name)).toBe(slug);
        }
    }
});

it('maps every provider to an existing logo', () => {
    expect(Object.values(BANK_PROVIDER_LOGO_SLUG).every(slug => slug in BANK_LOGO_NAMES)).toBe(true);
    expect(Object.keys(BANK_PROVIDER_LOGO_SLUG).toSorted()).toStrictEqual(['BINANCE', 'ERSTE', 'MONOBANK', 'PRIVATBANK']);
});

it('keeps logo files and names in step', () => {
    const files = readdirSync(new URL('../assets/icons', import.meta.url))
        .filter(file => file.endsWith('.webp'))
        .map(file => file.replace('.webp', ''));

    expect(files.toSorted()).toStrictEqual(Object.keys(BANK_LOGO_NAMES).toSorted());
});

it('never gives an unlisted bank a logo', () => {
    for (const name of ['Volksbank Wien', 'Raiffeisenkasse Meran', 'Sparkasse', 'Some Unknown Bank', '']) {
        expect(getBankLogoSlug(name)).toBeNull();
    }
});
